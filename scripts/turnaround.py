"""The hero's 3D model, rebuilt from an 8-shot photo turnaround.

    pip install rembg scipy pillow scikit-image fast-simplification
    python scripts/turnaround.py path/to/turnaround/

The folder holds eight full-body photos named by camera angle: 000 front, 045 front-right,
090 right profile, 135 back-right, 180 back, 225 back-left, 270 left profile, 315 front-left
(any image extension). Same pose, outfit and framing in all of them; only the camera moves.

Steps:
  1. Cut-outs (rembg).
  2. Calibration. Each photo's rotation axis and angle are nudged until the 3D shape carved from all
     eight silhouettes re-projects onto every photo as closely as possible. The shots are separate
     images, not a rig, so this matters.
  3. Visual hull. Space is carved down to what lies inside every silhouette. A small 3D opening
     removes thin sheets, a blur rounds the 8-sided slices toward the body's oval sections, then
     marching cubes, decimation and Taubin smoothing.
  4. Bake. For every vertex and photo: is it visible from that camera, inside the cut-out, and
     facing the camera? That gives 8 weights per vertex. Points no camera saw (cap top, soles)
     borrow their neighbours' weights.

Writes public/model/body.bin + views.json, public/model/<tee>/atlas.webp (the eight aligned shots,
4x2, re-dyed per tee), public/img/<tee>/t*.webp for the 2D frames, and public/img/photo/t*.webp.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage, sparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from photos import TEES, dye  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
HN = 1200.0                 # body height in model units (cap top to soles); world units are /100
R = 280.0                   # half-width of the carving box
CW, CH, TOP = 640, 1280, 40  # aligned canvas per shot: rotation axis at x = CW/2, cap top at y = TOP
FRAMES_2D = (0, 45, 90, 180, 315)  # shots the page shows directly


def load(folder):
    from rembg import new_session, remove
    session = new_session('isnet-general-use')
    shots = []
    for a in ANGLES:
        name = next(f for f in os.listdir(folder) if os.path.splitext(f)[0] == f'{a:03d}')
        img = Image.open(os.path.join(folder, name)).convert('RGB')
        cut = np.asarray(remove(img, session=session)).copy()
        cut[..., 3][cut[..., 3] < 14] = 0
        shots.append((img, Image.fromarray(cut)))
        print('cut', a)
    return shots


class Views:
    """Silhouettes plus each shot's calibration: axis column c, angle th, cap-top row and sole row."""

    def __init__(self, cuts):
        self.masks, self.top, self.bot, self.c = [], [], [], []
        for cut in cuts:
            m = np.asarray(cut)[..., 3] > 128
            rows = np.where(m.sum(1) > 2)[0]
            t, b = rows[0], rows[-1]
            torso = range(int(t + 0.22 * (b - t)), int(t + 0.45 * (b - t)))
            mids = [(np.where(m[r])[0].min() + np.where(m[r])[0].max()) / 2 for r in torso]
            self.masks.append(m)
            self.top.append(int(t))
            self.bot.append(int(b))
            self.c.append(float(np.median(mids)))
        self.th = [float(a) for a in ANGLES]

    def scale(self, i):
        return HN / (self.bot[i] - self.top[i])  # model units per source pixel

    def hull(self, step, c=None, th=None):
        c, th = c or self.c, th or self.th
        xs = np.arange(-R, R + 1e-6, step)
        X, Z = np.meshgrid(xs, xs, indexing='xy')
        ys = np.arange(0, HN + 1e-6, step)
        occ = np.ones((len(ys),) + X.shape, bool)
        for i, m in enumerate(self.masks):
            s, t = self.scale(i), np.deg2rad(th[i])
            u = np.rint(c[i] + (X * np.cos(t) + Z * np.sin(t)) / s).astype(int)
            inb = (u >= 0) & (u < m.shape[1])
            u = np.clip(u, 0, m.shape[1] - 1)
            v = np.clip(np.rint(self.top[i] + (HN - ys) / s).astype(int), 0, m.shape[0] - 1)
            occ &= m[v][:, u] & inb[None]
        return occ, xs, ys

    def score(self, c, th, step=6):
        """Mean IoU between each silhouette and the carved shape re-projected into that shot."""
        occ, xs, ys = self.hull(step, c, th)
        yi, zi, xi = np.nonzero(occ)
        Y, Zc, Xc = ys[yi], xs[zi], xs[xi]
        ious = []
        for i, m in enumerate(self.masks):
            s, t = self.scale(i), np.deg2rad(th[i])
            m4 = m[::4, ::4]
            u = np.clip(((c[i] + (Xc * np.cos(t) + Zc * np.sin(t)) / s) / 4).astype(int), 0, m4.shape[1] - 1)
            v = np.clip(((self.top[i] + (HN - Y) / s) / 4).astype(int), 0, m4.shape[0] - 1)
            p = np.zeros_like(m4)
            p[v, u] = True
            p = ndimage.maximum_filter(p, 3)
            ious.append((p & m4).sum() / max((p | m4).sum(), 1))
        return float(np.mean(ious))

    def calibrate(self):
        c, th = list(self.c), list(self.th)
        best = self.score(c, th)
        print(f'calibration: IoU {best:.4f} before')
        for rng, stp, arng, astp in [(40, 8, 8, 4), (12, 3, 4, 2), (4, 1, 2, 1)]:
            for i in range(8):
                if i not in (0, 2):  # the front and right-profile axes fix the origin
                    pick = None
                    for d in np.arange(-rng, rng + 1e-6, stp):
                        cc = list(c)
                        cc[i] = c[i] + d
                        sc = self.score(cc, th)
                        if sc > best + 1e-5:
                            best, pick = sc, cc
                    c = pick or c
                if i != 0:
                    pick = None
                    for d in np.arange(-arng, arng + 1e-6, astp):
                        tt = list(th)
                        tt[i] = th[i] + d
                        sc = self.score(c, tt)
                        if sc > best + 1e-5:
                            best, pick = sc, tt
                    th = pick or th
        print(f'calibration: IoU {best:.4f} after, angles {[round(t, 1) for t in th]}')
        self.c, self.th = c, th


def build_mesh(views):
    import fast_simplification
    from skimage import measure
    occ, xs, ys = views.hull(2.0)
    r = 2
    zz, yy, xx = np.mgrid[-r:r + 1, -r:r + 1, -r:r + 1]
    occ = ndimage.binary_opening(occ, structure=(xx ** 2 + yy ** 2 + zz ** 2) <= r * r + 0.5)
    lab, n = ndimage.label(occ)
    occ = lab == (np.argmax(ndimage.sum(occ, lab, range(1, n + 1))) + 1)
    f = np.pad(ndimage.gaussian_filter(occ.astype(np.float32), (3.0, 3.2, 3.2)), 1)
    verts, faces, _, _ = measure.marching_cubes(f, 0.5)
    verts -= 1
    V = np.stack([xs[0] + verts[:, 2] * 2, ys[0] + verts[:, 0] * 2, xs[0] + verts[:, 1] * 2], 1)
    V, F = fast_simplification.simplify(V.astype(np.float32), faces.astype(np.int32), target_reduction=1 - 60000 / len(faces))
    F = F[:, ::-1].copy()  # marching cubes winds inward with this axis order
    adj = adjacency(F, len(V))
    W = sparse.diags(1 / np.maximum(np.asarray(adj.sum(1)).ravel(), 1)) @ adj
    V = V.astype(np.float64)
    for _ in range(15):  # Taubin: smooth the slice-to-slice ridges without shrinking
        V = V + 0.5 * (W @ V - V)
        V = V - 0.53 * (W @ V - V)
    print(f'mesh: {len(V)} vertices, {len(F)} faces')
    return V, F


def adjacency(F, n):
    e = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    e = np.concatenate([e, e[:, ::-1]])
    a = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
    a.data[:] = 1
    return a


BARY = np.array([(i / 12, j / 12, 1 - i / 12 - j / 12) for i in range(13) for j in range(13 - i)])


def zbuffer(V, F, ang):
    """Orthographic depth buffer of the mesh as seen by the camera at yaw `ang`, in canvas pixels."""
    t = np.deg2rad(ang)
    u = CW / 2 + V[:, 0] * np.cos(t) + V[:, 2] * np.sin(t)
    v = TOP + HN - V[:, 1]
    d = -V[:, 0] * np.sin(t) + V[:, 2] * np.cos(t)  # toward the camera = larger
    su, sv, sd = ((x[F][:, None, :] * BARY[None]).sum(2).ravel() for x in (u, v, d))
    pu, pv = np.rint(su).astype(int), np.rint(sv).astype(int)
    ok = (pu >= 0) & (pu < CW) & (pv >= 0) & (pv < CH)
    pix, sd = pv[ok] * CW + pu[ok], sd[ok]
    order = np.lexsort((sd, pix))
    last = np.r_[pix[order][1:] != pix[order][:-1], True]
    zb = np.full(CW * CH, -1e9, np.float32)
    zb[pix[order][last]] = sd[order][last]
    return ndimage.grey_dilation(zb.reshape(CH, CW), size=(3, 3)), u, v, d


def canvases(cuts, views):
    out = []
    for i, cut in enumerate(cuts):
        s = views.scale(i)
        img = cut.resize((round(cut.width * s), round(cut.height * s)), Image.LANCZOS)
        cv = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
        cv.paste(img, (round(CW / 2 - views.c[i] * s), round(TOP - views.top[i] * s)), img)
        # anti-aliased edges carry the studio background: take colour from the opaque core, and carry
        # it past the outline (alpha unchanged) so nothing grey bleeds in
        a = np.asarray(cv).copy()
        _, (iy, ix) = ndimage.distance_transform_edt(~(a[..., 3] > 250), return_indices=True)
        a[..., :3] = a[iy, ix, :3]
        out.append(Image.fromarray(a))
    return out


def bake(V, F, views, canv):
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    vn = np.zeros_like(V)
    for j in range(3):
        np.add.at(vn, F[:, j], fn)
    vn /= np.linalg.norm(vn, axis=1, keepdims=True) + 1e-12
    W = np.zeros((len(V), 8), np.float32)
    for i in range(8):
        t = np.deg2rad(views.th[i])
        zb, u, v, d = zbuffer(V, F, views.th[i])
        ui, vi = np.clip(np.rint(u).astype(int), 0, CW - 1), np.clip(np.rint(v).astype(int), 0, CH - 1)
        visible = d >= zb[vi, ui] - 6.0
        inside = ndimage.binary_erosion(np.asarray(canv[i])[..., 3] > 127, iterations=3)[vi, ui]
        f = np.clip((vn @ np.array([-np.sin(t), 0, np.cos(t)]) - 0.15) / 0.45, 0, 1)  # seen square-on
        W[:, i] = visible * inside * f * f * (3 - 2 * f)
    adj = adjacency(F, len(V))
    for _ in range(60):  # unseen spots borrow their neighbours' views
        empty = W.sum(1) == 0
        if not empty.any():
            break
        W[empty] = (adj @ W)[empty] / np.maximum((adj @ (W.sum(1) > 0).astype(np.float32))[empty], 1)[:, None]
    return vn, W


def write(V, F, vn, W, views, canv, shots):
    out = os.path.join(ROOT, 'public', 'model')
    os.makedirs(out, exist_ok=True)
    lo, hi = V.min(0), V.max(0)
    with open(os.path.join(out, 'body.bin'), 'wb') as fh:
        fh.write(np.array([len(V), F.size], '<u4').tobytes())
        fh.write(lo.astype('<f4').tobytes() + hi.astype('<f4').tobytes())
        fh.write(np.rint((V - lo) / (hi - lo) * 65535).astype('<u2').tobytes())
        fh.write(np.rint(vn * 127).astype('i1').tobytes())
        fh.write(np.rint(W * 255).astype('u1').tobytes())
        fh.write(F.astype('<u2' if len(V) < 65536 else '<u4').tobytes())
    with open(os.path.join(out, 'views.json'), 'w') as fh:
        json.dump({'angles': [round(t, 2) for t in views.th], 'canvas': [CW, CH], 'top': TOP, 'height': HN, 'atlas': [4, 2]}, fh)
    for tee, colour in TEES.items():
        dyed = [c if colour is None else dye(c, colour) for c in canv]
        atlas = Image.new('RGBA', (CW * 4, CH * 2), (0, 0, 0, 0))
        for i, v in enumerate(dyed):
            atlas.paste(v, ((i % 4) * CW, (i // 4) * CH))
        os.makedirs(os.path.join(out, tee), exist_ok=True)
        atlas.save(os.path.join(out, tee, 'atlas.webp'), quality=84, method=6, exact=True)
        for i, a in enumerate(ANGLES):
            if a in FRAMES_2D:
                v = np.asarray(dyed[i]).copy()
                v[..., :3][v[..., 3] == 0] = 0
                Image.fromarray(v).save(os.path.join(ROOT, 'public', 'img', tee, f't{a:03d}.webp'), quality=86, method=6)
        print('dyed', tee)
    for i, a in enumerate(ANGLES):
        if a in (0, 45, 90, 180):
            shots[i][0].save(os.path.join(ROOT, 'public', 'img', 'photo', f't{a:03d}.webp'), quality=84, method=6)


def main(folder):
    shots = load(folder)
    cuts = [cut for _, cut in shots]
    views = Views(cuts)
    views.calibrate()
    V, F = build_mesh(views)
    canv = canvases(cuts, views)
    vn, W = bake(V, F, views, canv)
    write(V, F, vn, W, views, canv, shots)
    print('done')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
