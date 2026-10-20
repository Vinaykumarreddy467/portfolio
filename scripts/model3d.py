"""The hero's 3D model: two depth shells (front and back) that close into one body.

Called by photos.py with the full-length front and back cut-outs. Writes to public/model:

  z-front.png, z-back.png      208x512 height fields: R,G = 16-bit height (0-200 px), B = the shared
                               front+back silhouette. The browser turns texels into mesh vertices.
  <tee>/front.webp, back.webp  520x1280 textures. The back is mirrored into model space, alpha is each
                               photo's own outline, and colour is carried past it for turned views.

Height = body volume from the silhouette (round tubes for limbs, a fuller oval for the torso)
       + local relief from Depth Anything V2, run on overlapping tiles and high-passed, so the
         model's low-frequency guesses don't bend the figure.
"""
import os
import urllib.request

import numpy as np
from PIL import Image
from scipy import ndimage

W, H, TOP = 520, 1280, 30
GRID = (208, 512)
Z_MAX = 200
DEPTH_URL = 'https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vitl.onnx'
DEPTH_PATH = os.path.expanduser('~/.cache/vkr-portfolio/depth_anything_v2_vitl.onnx')
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)


def depth_session():
    import onnxruntime as ort
    if not os.path.exists(DEPTH_PATH):
        os.makedirs(os.path.dirname(DEPTH_PATH), exist_ok=True)
        print('downloading Depth Anything V2 (1.3 GB) ...')
        urllib.request.urlretrieve(DEPTH_URL, DEPTH_PATH)
    return ort.InferenceSession(DEPTH_PATH, providers=['CPUExecutionProvider'])


def depth(session, rgb):
    s = rgb.size[0]
    x = np.asarray(rgb.resize((518, 518), Image.BICUBIC)).astype(np.float32) / 255
    d = session.run(None, {session.get_inputs()[0].name: ((x - MEAN) / STD).transpose(2, 0, 1)[None]})[0][0]
    return np.asarray(Image.fromarray(d).resize((s, s), Image.BICUBIC))


def anchor(img):
    a = np.asarray(img)[..., 3] > 128
    rows = np.where(a.sum(1) > 3)[0]
    xs = np.where(a[rows[0] + 165])[0]
    return rows[0], rows[-1], (xs.min() + xs.max()) / 2


def full_canvas(img):
    top, _, cx = anchor(img)
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cv.paste(img, (int(round(W / 2 - cx)), TOP - top), img)
    return cv


def align_back(front, back):
    """Scale the back shot to the front's height, then shift it until its mirror overlaps the front best."""
    ft, fb, _ = anchor(front)
    bt, bb, _ = anchor(back)
    s = (fb - ft) / (bb - bt)
    F = full_canvas(front)
    B = full_canvas(back.resize((round(back.width * s), round(back.height * s)), Image.LANCZOS))
    fa = np.asarray(F)[..., 3] > 128
    ba = np.asarray(B)[..., 3] > 128
    best = (-1, 0, 0)
    for dy in range(-12, 13, 3):
        for dx in range(-40, 41, 2):
            m = np.roll(np.roll(ba, dy, 0), dx, 1)[:, ::-1]
            iou = (fa & m).sum() / (fa | m).sum()
            if iou > best[0]:
                best = (iou, dx, dy)
    print(f'back aligned: IoU {best[0]:.3f}, shift {best[1]},{best[2]}')
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.paste(B, (best[1], best[2]), B)
    return F, out


def masked_blur(v, m, s):
    return ndimage.gaussian_filter(v * m, s) / np.maximum(ndimage.gaussian_filter(m, s), 1e-4)


def relief(session, cv):
    """Local relief from overlapping 520 px tiles, each normalised and high-passed on its own."""
    m = (np.asarray(cv)[..., 3] / 255 > 0.5).astype(np.float32)
    bg = Image.new('RGBA', (W, H), (236, 238, 240, 255))
    bg.alpha_composite(cv)
    rgb = bg.convert('RGB')
    acc = np.zeros((H, W), np.float32)
    wsum = np.zeros((H, W), np.float32)
    for y0 in (0, 253, 506, 760):
        mm = m[y0:y0 + 520]
        if mm.sum() < 500:
            continue
        d = depth(session, rgb.crop((0, y0, W, y0 + 520)))
        lo, hi = np.percentile(d[mm > 0], 2), np.percentile(d[mm > 0], 98)
        dn = (d - lo) / max(hi - lo, 1e-6)
        hp = (dn - masked_blur(dn, mm, 26)) * mm
        w = np.minimum(np.linspace(0, 1, 520) * 4, 1) * np.minimum(np.linspace(1, 0, 520) * 4, 1)
        if y0 == 0:
            w[:260] = 1
        if y0 == 760:
            w[260:] = 1
        acc[y0:y0 + 520] += hp * w[:, None]
        wsum[y0:y0 + 520] += w[:, None]
    return acc / np.maximum(wsum, 1e-4), m > 0.5


def inflate(m):
    dist = ndimage.distance_transform_edt(m)
    rl = np.maximum(ndimage.grey_dilation(dist, size=(41, 41)), 1)
    rl = np.maximum(rl, ndimage.grey_dilation(dist, size=(121, 121)) * 0.85)  # local half-width
    ratio = 1.05 - 0.4 * np.clip((rl - 25) / 100, 0, 1)                      # limbs round, torso oval
    return ratio * np.sqrt(np.clip(rl ** 2 - (rl - np.minimum(dist, rl)) ** 2, 0, None)), dist


def extend(img, own):
    """Carry this view's nearest colours outward; alpha stays the photo's own outline."""
    a = np.asarray(img).copy()
    _, (iy, ix) = ndimage.distance_transform_edt(~own, return_indices=True)
    a[..., :3] = a[iy, ix, :3]
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def pack(z, m, path):
    zs = np.asarray(Image.fromarray(z.astype(np.float32)).resize(GRID, Image.BILINEAR))
    ms = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize(GRID, Image.BILINEAR))
    q = (np.clip(zs / Z_MAX, 0, 1) * 65535).astype(np.uint16)
    Image.fromarray(np.stack([q >> 8, q & 255, ms, np.full_like(ms, 255)], -1).astype(np.uint8), 'RGBA').save(path, optimize=True)


def build(front_cut, back_cut, out, tees, dye):
    os.makedirs(out, exist_ok=True)
    session = depth_session()
    F, B = align_back(front_cut, back_cut)
    hf, mf = relief(session, F)
    hb, mb = relief(session, B)
    hb, mb = hb[:, ::-1], mb[:, ::-1]
    Bm = B.transpose(Image.FLIP_LEFT_RIGHT)  # back into model space
    mu = ndimage.binary_opening(ndimage.binary_closing(mf | mb, iterations=2), iterations=2)
    zin, dist = inflate(mu)

    def shell(h, own):
        z = zin + 30 * h * np.clip(ndimage.distance_transform_edt(own) / 12, 0, 1)
        z = ndimage.gaussian_filter(np.clip(z, 0, None) * mu, 1.1) * mu
        t = np.clip(dist / 5, 0, 1)  # taper to zero at the outline so the shells close without a crack
        return z * t * t * (3 - 2 * t)

    pack(shell(hf, mf), mu, os.path.join(out, 'z-front.png'))
    pack(shell(hb, mb), mu, os.path.join(out, 'z-back.png'))
    Fx, Bx = extend(F, mf), extend(Bm, mb)
    for tee, colour in tees.items():
        os.makedirs(os.path.join(out, tee), exist_ok=True)
        for name, img in (('front', Fx), ('back', Bx)):
            (img if colour is None else dye(img, colour)).save(os.path.join(out, tee, f'{name}.webp'), quality=86, method=6, exact=True)
    print('model built')
