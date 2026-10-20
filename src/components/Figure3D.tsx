import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { modelTex, zmap } from '../data';
import { reducedMotion } from '../hooks';

// The shader does its maths on the photos' own sRGB values, so CSS colours must pass through unconverted.
THREE.ColorManagement.enabled = false;

/** What the hero drives every frame. Angles in degrees; zoom 0 = close-up, 1 = full body; light -1…1. */
export type Fig3D = { yaw: number; pitch: number; zoom: number; lx: number; ly: number };

type Props = { tee: string; accent: string; ctl: MutableRefObject<Fig3D>; onReady: () => void; onFail: () => void };

// World units are canvas pixels / 100. The textures are 520×1280; the 2D frame shows rows 0–820.
const TEX_W = 5.2;
const TEX_H = 12.8;
const Z_MAX = 2; // z-map full scale: 200 px
const FOV = 20;
const FRAMES = {
  near: { h: 8.2, y: TEX_H / 2 - 4.1 }, // rows 0–820, exactly the 2D frame
  far: { h: 14, y: -0.25 },             // the whole figure and its shadow
};
const FEET_Y = TEX_H / 2 - 12.14;

const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNm;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vNm = normal;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

// Lit like a photo, not a game: the texture already carries the studio light, so the live light
// only nudges it. Seen from (close to) its own camera, each shell is the photo exactly: its own
// outline, no blur. Turned away (away → 1), both shells switch to the shared outline so the body
// closes, and wherever the photo's camera didn't see the surface square-on, the texture blurs
// through its mipmaps and shades, so the sides show soft local colour instead of stretched pixels.
const frag = /* glsl */ `
  uniform sampler2D front, back, frontNext, backNext, outline;
  uniform float dye;
  uniform float shell;
  uniform float away;
  uniform vec3 light;
  uniform vec3 accent;
  varying vec2 vUv;
  varying vec3 vNm;
  varying vec3 vN;
  varying vec3 vV;
  vec4 photo(float bias) {
    vec4 c = shell > 0.0 ? texture2D(front, vUv, bias) : texture2D(back, vUv, bias);
    if (dye >= 0.0) c = mix(c, shell > 0.0 ? texture2D(frontNext, vUv, bias) : texture2D(backNext, vUv, bias), step(vUv.y, dye));
    return c;
  }
  void main() {
    if (!gl_FrontFacing) discard; // the shells' insides are never meant to be seen
    float own = shell > 0.0 ? texture2D(front, vUv).a : texture2D(back, vUv).a;
    // facing its camera: cut on the photo's own outline. Turned: keep whole edge cells, whose outer
    // vertices sit at z = 0 on both shells, so the mesh itself seals the seam.
    if (mix(own, texture2D(outline, vUv).b, away) < mix(0.5, 0.01, away)) discard;
    float seen = mix(1.0, smoothstep(0.12, 0.62, shell * normalize(vNm).z), away);
    vec4 c = photo((1.0 - seen) * 7.0);
    vec3 n = normalize(vN);
    float facing = clamp(dot(n, normalize(vV)), 0.0, 1.0);
    float wrap = clamp(dot(n, normalize(light)) * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = c.rgb * mix(0.8, 1.08, wrap) * mix(0.66, 1.0, seen);
    col += accent * pow(1.0 - facing, 4.0) * 0.4;
    if (dye >= 0.0) col += accent * exp(-abs(vUv.y - dye) * 150.0) * 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

/** One side of the figure as a height field: z-map texels become vertices, empty cells are dropped. */
async function surface(url: string, side: 1 | -1) {
  const img = await loadImage(url);
  const cv = document.createElement('canvas');
  cv.width = img.width;
  cv.height = img.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data: d } = ctx.getImageData(0, 0, img.width, img.height);
  const w = img.width;
  const h = img.height;
  const sx = TEX_W / w;
  const sy = TEX_H / h;
  const z = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) z[k] = (((d[k * 4] << 8) | d[k * 4 + 1]) / 65535) * Z_MAX;
  const zAt = (i: number, j: number) => z[Math.min(h - 1, Math.max(0, j)) * w + Math.min(w - 1, Math.max(0, i))];

  const pos = new Float32Array(w * h * 3);
  const nor = new Float32Array(w * h * 3);
  const uv = new Float32Array(w * h * 2);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      pos[k * 3] = (i + 0.5) * sx - TEX_W / 2;
      pos[k * 3 + 1] = TEX_H / 2 - (j + 0.5) * sy;
      pos[k * 3 + 2] = side * z[k];
      const dx = (zAt(i + 1, j) - zAt(i - 1, j)) / (2 * sx);
      const dy = (zAt(i, j - 1) - zAt(i, j + 1)) / (2 * sy);
      const l = Math.hypot(dx, dy, 1);
      // outward normal of z = side·h(x, y): (−∂h/∂x, −∂h/∂y, side)
      nor[k * 3] = -dx / l;
      nor[k * 3 + 1] = -dy / l;
      nor[k * 3 + 2] = side / l;
      uv[k * 2] = (i + 0.5) / w;
      uv[k * 2 + 1] = 1 - (j + 0.5) / h;
    }
  }
  const idx: number[] = [];
  const on = (i: number, j: number) => d[(j * w + i) * 4 + 2] > 0;
  for (let j = 0; j < h - 1; j++) {
    for (let i = 0; i < w - 1; i++) {
      if (!(on(i, j) || on(i + 1, j) || on(i, j + 1) || on(i + 1, j + 1))) continue;
      const a = j * w + i;
      const b = a + 1;
      const c = a + w;
      const e = c + 1;
      if (side === 1) idx.push(a, c, b, b, c, e);
      else idx.push(a, b, c, b, e, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function Figure3D({ tee, accent, ctl, onReady, onFail }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ setTee: (t: string) => void; setAccent: (c: string) => void } | null>(null);
  const cbs = useRef({ onReady, onFail });
  cbs.current = { onReady, onFail };
  const first = useRef({ tee, accent });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let raf = 0;
    let visible = true;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      cbs.current.onFail();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // the shader works in the photo's own sRGB values
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    const rig = new THREE.Group();
    scene.add(rig);

    const loader = new THREE.TextureLoader();
    const tex = (url: string) =>
      new Promise<THREE.Texture>((res, rej) =>
        loader.load(url, (t) => {
          t.colorSpace = THREE.NoColorSpace;
          // no anisotropic filtering: it would keep the streaks the "unseen" blur is there to remove
          res(t);
        }, undefined, rej),
      );

    const uniforms = (shell: number) => ({
      front: { value: null as THREE.Texture | null },
      back: { value: null as THREE.Texture | null },
      frontNext: { value: null as THREE.Texture | null },
      backNext: { value: null as THREE.Texture | null },
      outline: { value: null as THREE.Texture | null },
      dye: { value: -1 },
      shell: { value: shell },
      away: { value: 0 },
      light: { value: new THREE.Vector3(0.4, 0.6, 1) },
      accent: { value: new THREE.Color(first.current.accent) },
    });
    const mats = [1, -1].map((sh) => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide, uniforms: uniforms(sh) }));
    const TEXES = ['front', 'back'] as const;
    const setAll = (k: string, v: unknown) => mats.forEach((m) => { m.uniforms[k].value = v; });

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.5),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = FEET_Y - 0.02;
    scene.add(shadow);

    const resize = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);

    let curTee = first.current.tee;
    let dyeing: { t0: number; next: string } | null = null;
    const loadTee = (t: string) => Promise.all([tex(modelTex(t, 'front')), tex(modelTex(t, 'back'))]);

    api.current = {
      setTee: (t) => {
        if (t === curTee && !dyeing) return;
        loadTee(t).then((ts) => {
          if (disposed) return;
          TEXES.forEach((k, i) => setAll(`${k}Next`, ts[i]));
          dyeing = { t0: performance.now(), next: t };
        }).catch(() => undefined);
      },
      setAccent: (c) => mats.forEach((m) => m.uniforms.accent.value.set(c)),
    };

    const look = { yaw: 0, pitch: 0, zoom: 0, lx: 0, ly: 0 };
    const t0 = performance.now();
    const sway = reducedMotion() ? 0 : 0.8; // a slight idle weight shift, in degrees
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const c = ctl.current;
      // light and zoom ease a little; yaw is already smoothed by the turntable physics
      look.lx += (c.lx - look.lx) * 0.08;
      look.ly += (c.ly - look.ly) * 0.08;
      look.zoom += (c.zoom - look.zoom) * 0.2;
      look.pitch += (c.pitch - look.pitch) * 0.1;
      const t = (now - t0) / 1000;
      rig.rotation.y = THREE.MathUtils.degToRad(c.yaw + Math.sin(t * 0.7) * sway);
      rig.rotation.x = THREE.MathUtils.degToRad(look.pitch);

      const z = ease(Math.min(1, Math.max(0, look.zoom)));
      const h = THREE.MathUtils.lerp(FRAMES.near.h, FRAMES.far.h, z);
      const y = THREE.MathUtils.lerp(FRAMES.near.y, FRAMES.far.y, z);
      const dist = h / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.position.set(0, y, dist);
      camera.lookAt(0, y, 0);
      (shadow.material as THREE.MeshBasicMaterial).opacity = z;

      const L = new THREE.Vector3(look.lx * 1.1, 0.55 - look.ly * 0.5, 1);
      mats.forEach((m) => m.uniforms.light.value.copy(L));
      // how far the view has turned from each shell's camera (front 0°, back 180°)
      const off = (phi: number) => Math.abs(((((c.yaw - phi) % 360) + 540) % 360) - 180);
      mats[0].uniforms.away.value = THREE.MathUtils.smoothstep(off(0), 6, 30);
      mats[1].uniforms.away.value = THREE.MathUtils.smoothstep(off(180), 6, 30);

      if (dyeing) {
        const p = Math.min(1, (now - dyeing.t0) / 1100);
        setAll('dye', ease(p) * 1.02);
        if (p >= 1) {
          for (const k of TEXES) {
            mats[0].uniforms[k].value?.dispose();
            setAll(k, mats[0].uniforms[`${k}Next`].value);
            setAll(`${k}Next`, null);
          }
          setAll('dye', -1);
          curTee = dyeing.next;
          dyeing = null;
        }
      }
      renderer.render(scene, camera);
    };

    Promise.all([surface(zmap('front'), 1), surface(zmap('back'), -1), loadTee(curTee), tex(zmap('front'))])
      .then(([gf, gb, ts, outline]) => {
        if (disposed) return;
        TEXES.forEach((k, i) => setAll(k, ts[i]));
        outline.generateMipmaps = false;
        outline.minFilter = THREE.LinearFilter;
        setAll('outline', outline); // the z-map's blue channel is the shared front+back silhouette
        rig.add(new THREE.Mesh(gf, mats[0]), new THREE.Mesh(gb, mats[1]));
        resize();
        raf = requestAnimationFrame(frame);
        // let the first frame land before the 2D figure fades out
        requestAnimationFrame(() => requestAnimationFrame(() => !disposed && cbs.current.onReady()));
      })
      .catch(() => !disposed && cbs.current.onFail());

    renderer.domElement.addEventListener('webglcontextlost', () => cbs.current.onFail());

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      api.current = null;
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.ShaderMaterial | THREE.MeshBasicMaterial;
          if (!('uniforms' in m)) m.map?.dispose();
          m.dispose();
        }
      });
      for (const k of TEXES) { mats[0].uniforms[k].value?.dispose(); mats[0].uniforms[`${k}Next`].value?.dispose(); }
      mats[0].uniforms.outline.value?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [ctl]);

  useEffect(() => { api.current?.setTee(tee); }, [tee]);
  useEffect(() => { api.current?.setAccent(accent); }, [accent]);

  return <div className="fig-3d" ref={host} aria-hidden="true" />;
}
