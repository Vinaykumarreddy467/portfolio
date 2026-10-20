import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { asset, modelTex } from '../data';
import { reducedMotion } from '../hooks';

// The shader does its maths on the photos' own sRGB values, so CSS colours must pass through unconverted.
THREE.ColorManagement.enabled = false;

/** What the hero drives every frame. Angles in degrees; zoom 0 = close-up, 1 = full body; light -1…1. */
export type Fig3D = { yaw: number; pitch: number; zoom: number; lx: number; ly: number };

type Props = { tee: string; accent: string; ctl: MutableRefObject<Fig3D>; onReady: () => void; onFail: () => void };
type Views = { angles: number[]; canvas: [number, number]; top: number; height: number; atlas: [number, number] };

// World units are model units / 100: the body stands 12 tall, feet at y = 0, turning about the y axis.
// The cameras are orthographic, like the reconstruction, so at each photo's angle the model lines up
// with that photo pixel for pixel.
const FRAMES = {
  near: { top: 12.25, bottom: 4 }, // cap to mid-thigh: the same crop as the 2D frames
  far: { top: 13, bottom: -0.5 },  // the whole figure and its shadow
};

const vert = /* glsl */ `
  attribute vec4 w0;
  attribute vec4 w1;
  varying vec3 vP;
  varying vec3 vN;
  varying vec3 vV;
  varying vec4 vW0;
  varying vec4 vW1;
  void main() {
    vP = position;
    vW0 = w0;
    vW1 = w1;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

// Eight photos, one per 45° around the body, packed in a 4×2 atlas. Each is projected back onto the
// mesh from its own camera. A photo counts where its camera saw the point (baked per vertex: visible,
// facing it, inside its cut-out) and more the closer the current view is to that camera, so each angle
// shows the photo taken from it. Near a camera, anything outside that photo's outline is trimmed,
// which gives back the exact silhouette the reconstruction slightly overshoots.
const frag = (v: Views) => /* glsl */ `
  uniform sampler2D atlas;
  uniform sampler2D atlasNext;
  uniform float dye;
  uniform float yaw;
  uniform float th[8];
  uniform vec3 light;
  uniform vec3 accent;
  varying vec3 vP;
  varying vec3 vN;
  varying vec3 vV;
  varying vec4 vW0;
  varying vec4 vW1;
  const float CW = ${v.canvas[0].toFixed(1)};
  const float CH = ${v.canvas[1].toFixed(1)};
  const float TOP = ${v.top.toFixed(1)};
  const float HN = ${v.height.toFixed(1)};
  const vec2 ATLAS = vec2(${(v.canvas[0] * v.atlas[0]).toFixed(1)}, ${(v.canvas[1] * v.atlas[1]).toFixed(1)});

  vec4 shot(sampler2D tex, int i) {
    float t = radians(th[i]);
    vec2 px = vec2(CW * 0.5 + (vP.x * cos(t) + vP.z * sin(t)) * 100.0, TOP + HN - vP.y * 100.0);
    if (px.x < 1.0 || px.x > CW - 1.0 || px.y < 1.0 || px.y > CH - 1.0) return vec4(0.0);
    vec2 tile = vec2(float(i % 4), float(i / 4));
    // explicit level: no mipmaps anyway, and some drivers (ANGLE on D3D) reject implicit-derivative
    // lookups inside this loop's branches
    return textureLod(tex, vec2((tile.x * CW + px.x) / ATLAS.x, 1.0 - (tile.y * CH + px.y) / ATLAS.y), 0.0);
  }
  vec4 photo(int i) {
    vec4 c = shot(atlas, i);
    if (dye >= 0.0) c = mix(c, shot(atlasNext, i), step(vP.y / 12.0, dye));
    return c;
  }
  float near(float a) { return abs(mod(yaw - a + 540.0, 360.0) - 180.0); }

  void main() {
    float wv[8] = float[8](vW0.x, vW0.y, vW0.z, vW0.w, vW1.x, vW1.y, vW1.z, vW1.w);
    vec4 c[8];
    int k = 0;
    for (int i = 0; i < 8; i++) {
      c[i] = photo(i);
      float d = near(th[i]);
      if (d < near(th[k])) k = i;
    }
    // The body is carved by every photo's outline, so at a camera's own angle its outline is the
    // truth: trim the smoothing's slight overshoot. Only there; further off, this would cut holes.
    if (near(th[k]) < 3.0 && c[k].a < 0.5) discard;

    // Each point picks the photo that both saw it squarely (its baked weight) and was taken close to
    // the current angle; the choice is sharpened so in-between angles show one photo wrapped on the
    // turning geometry rather than a cross-fade of two separate shots that disagree slightly.
    float sc[8];
    float smax = 0.0;
    for (int i = 0; i < 8; i++) {
      float d = near(th[i]);
      sc[i] = wv[i] >= 0.004 && c[i].a >= 0.5 ? wv[i] * exp(-d * d / 900.0) : 0.0;
      smax = max(smax, sc[i]);
    }
    vec3 acc = vec3(0.0); float ws = 0.0;
    for (int i = 0; i < 8; i++) {
      if (sc[i] <= 0.0) continue;
      float w = pow(sc[i] / smax, 14.0);
      acc += c[i].rgb * w; ws += w;
    }
    vec3 col = ws > 0.0 ? acc / ws : vec3(0.45);

    vec3 n = normalize(vN);
    float facing = clamp(dot(n, normalize(vV)), 0.0, 1.0);
    float wrap = clamp(dot(n, normalize(light)) * 0.5 + 0.5, 0.0, 1.0);
    col *= mix(0.86, 1.06, wrap);
    col += accent * pow(1.0 - facing, 4.0) * 0.35;
    if (dye >= 0.0) col += accent * exp(-abs(vP.y / 12.0 - dye) * 150.0) * 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Whether the frame just rendered put anything on the canvas: a row across its middle has opaque pixels. */
function drewSomething(renderer: THREE.WebGLRenderer) {
  const gl = renderer.getContext();
  const w = gl.drawingBufferWidth;
  const row = new Uint8Array(w * 4);
  gl.readPixels(0, gl.drawingBufferHeight >> 1, w, 1, gl.RGBA, gl.UNSIGNED_BYTE, row);
  for (let i = 3; i < row.length; i += 4) if (row[i] > 200) return true;
  return false;
}

/** body.bin: counts, bounds, then uint16 positions, int8 normals, 8 uint8 view weights, uint16 indices. */
async function loadBody() {
  const buf = await (await fetch(asset('model/body.bin'))).arrayBuffer();
  const [nv, ni] = new Uint32Array(buf, 0, 2);
  const lo = new Float32Array(buf.slice(8, 20));
  const hi = new Float32Array(buf.slice(20, 32));
  let off = 32;
  const take = (bytes: number) => { const b = buf.slice(off, off + bytes); off += bytes; return b; };
  const q = new Uint16Array(take(nv * 6));
  const nrm = new Int8Array(take(nv * 3));
  const wts = new Uint8Array(take(nv * 8));
  const idx = nv < 65536 ? new Uint16Array(take(ni * 2)) : new Uint32Array(take(ni * 4));
  const pos = new Float32Array(nv * 3);
  for (let i = 0; i < nv * 3; i++) {
    const a = i % 3;
    pos[i] = (lo[a] + (q[i] / 65535) * (hi[a] - lo[a])) / 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3, true));
  const iw = new THREE.InterleavedBuffer(wts, 8);
  g.setAttribute('w0', new THREE.InterleavedBufferAttribute(iw, 4, 0, true));
  g.setAttribute('w1', new THREE.InterleavedBufferAttribute(iw, 4, 4, true));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.5)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.2)');
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
    // a shader this GPU can't compile would leave an empty stage: fall back to the photos instead
    let broken = false;
    renderer.debug.onShaderError = () => { broken = true; };
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // the shader works in the photos' own sRGB values
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, 0, 40);
    const rig = new THREE.Group();
    scene.add(rig);
    let aspect = 1;

    const loader = new THREE.TextureLoader();
    const tex = (url: string) =>
      new Promise<THREE.Texture>((res, rej) =>
        loader.load(url, (t) => {
          t.colorSpace = THREE.NoColorSpace;
          // shown at about the photos' own scale, so no mipmaps: projected UVs jump at depth edges,
          // and a mip lookup there would smear the whole atlas into light streaks
          t.generateMipmaps = false;
          t.minFilter = THREE.LinearFilter;
          res(t);
        }, undefined, rej),
      );

    let mat: THREE.ShaderMaterial | null = null;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.6),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.01;
    scene.add(shadow);

    const resize = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      aspect = r.width / r.height;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);

    let curTee = first.current.tee;
    let dyeing: { t0: number; next: string } | null = null;

    api.current = {
      setTee: (t) => {
        if (!mat || (t === curTee && !dyeing)) return;
        tex(modelTex(t)).then((next) => {
          if (disposed || !mat) return;
          mat.uniforms.atlasNext.value?.dispose();
          mat.uniforms.atlasNext.value = next;
          dyeing = { t0: performance.now(), next: t };
        }).catch(() => undefined);
      },
      setAccent: (c) => mat?.uniforms.accent.value.set(c),
    };

    const look = { pitch: 0, zoom: 0, lx: 0, ly: 0 };
    const t0 = performance.now();
    let shown = false;
    const sway = reducedMotion() ? 0 : 0.8; // a slight idle weight shift, in degrees
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || !mat) return;
      const c = ctl.current;
      look.lx += (c.lx - look.lx) * 0.08;
      look.ly += (c.ly - look.ly) * 0.08;
      look.zoom += (c.zoom - look.zoom) * 0.2;
      look.pitch += (c.pitch - look.pitch) * 0.1;
      const yaw = c.yaw + Math.sin(((now - t0) / 1000) * 0.7) * sway;
      rig.rotation.y = THREE.MathUtils.degToRad(yaw);
      rig.rotation.x = THREE.MathUtils.degToRad(look.pitch * 0.5);
      mat.uniforms.yaw.value = yaw;

      const z = ease(Math.min(1, Math.max(0, look.zoom)));
      const top = THREE.MathUtils.lerp(FRAMES.near.top, FRAMES.far.top, z);
      const bottom = THREE.MathUtils.lerp(FRAMES.near.bottom, FRAMES.far.bottom, z);
      const h = top - bottom;
      camera.left = (-h * aspect) / 2;
      camera.right = (h * aspect) / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.position.y = (top + bottom) / 2;
      camera.updateProjectionMatrix();
      (shadow.material as THREE.MeshBasicMaterial).opacity = z;

      mat.uniforms.light.value.set(look.lx * 1.1, 0.55 - look.ly * 0.5, 1);
      if (dyeing) {
        const p = Math.min(1, (now - dyeing.t0) / 1100);
        mat.uniforms.dye.value = ease(p) * 1.02;
        if (p >= 1) {
          mat.uniforms.atlas.value?.dispose();
          mat.uniforms.atlas.value = mat.uniforms.atlasNext.value;
          mat.uniforms.atlasNext.value = null;
          mat.uniforms.dye.value = -1;
          curTee = dyeing.next;
          dyeing = null;
        }
      }
      renderer.render(scene, camera);
      if (!shown) {
        shown = true;
        if (broken || !drewSomething(renderer)) {
          cancelAnimationFrame(raf);
          cbs.current.onFail();
          return;
        }
        // let the first frame land before the 2D figure fades out
        requestAnimationFrame(() => !disposed && cbs.current.onReady());
      }
    };

    Promise.all([loadBody(), fetch(asset('model/views.json')).then((r) => r.json() as Promise<Views>), tex(modelTex(curTee))])
      .then(([geo, views, atlas]) => {
        if (disposed) return;
        mat = new THREE.ShaderMaterial({
          vertexShader: vert,
          fragmentShader: frag(views),
          uniforms: {
            atlas: { value: atlas },
            atlasNext: { value: null },
            dye: { value: -1 },
            yaw: { value: 0 },
            th: { value: views.angles },
            light: { value: new THREE.Vector3(0.4, 0.6, 1) },
            accent: { value: new THREE.Color(first.current.accent) },
          },
        });
        rig.add(new THREE.Mesh(geo, mat));
        resize();
        raf = requestAnimationFrame(frame);
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
          if ('uniforms' in m) { m.uniforms.atlas.value?.dispose(); m.uniforms.atlasNext.value?.dispose(); }
          else m.map?.dispose();
          m.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [ctl]);

  useEffect(() => { api.current?.setTee(tee); }, [tee]);
  useEffect(() => { api.current?.setAccent(accent); }, [accent]);

  return <div className="fig-3d" ref={host} aria-hidden="true" />;
}
