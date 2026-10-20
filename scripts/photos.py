"""Builds every photo the site uses from one studio contact sheet.

    pip install rembg scipy pillow
    python scripts/photos.py path/to/contact-sheet.webp

The sheet is five panels (front, back, close-up, profile, three-quarter). For each one this
cuts the background out (rembg, isnet-general-use), then:

  public/img/photo/<pose>.webp     the original panel, for the lightbox
  public/img/<tee>/<pose>.webp     the cut-out with the tee re-dyed, one folder per colour
  public/img/avatar.webp, og.jpg   nav avatar and share card
  public/favicon.png

front / angle / back go onto one 520x820 canvas, aligned on the cap and the neck, so the
hero turntable and the model sheet can swap between them without the figure jumping.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from rembg import new_session, remove
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'img')

# Panel boxes on the 2000x1333 sheet, inset a few px to drop the white gutters.
PANELS = {
    'front': (0, 0, 447, 1333),
    'back': (461, 0, 875, 1333),
    'portrait': (888, 0, 1477, 1333),
    'profile': (1492, 0, 2000, 508),
    'angle': (1492, 520, 2000, 1333),
}
# None keeps the tee as photographed.
TEES = {'crimson': None, 'cobalt': (40, 74, 168), 'forest': (44, 96, 62), 'marigold': (232, 164, 22)}
CANVAS, TOP = (520, 820), 30


def hue_sat(rgba):
    a = np.asarray(rgba).astype(np.float32) / 255
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, (mx - mn) / (mx + 1e-6), mx, al


def blobs(mask, keep):
    lab, n = ndimage.label(mask)
    if not n:
        return mask
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    return np.isin(lab, [i + 1 for i, v in enumerate(sizes) if keep(i, v, sizes, lab)])


def tee_mask(rgba):
    h, sat, mx, al = hue_sat(rgba)
    red = ndimage.binary_closing(((h < 16) | (h > 335)) & (sat > 0.5) & (mx > 0.12) & (al > 0.5), iterations=2)
    lab, n = ndimage.label(red)
    if not n:
        return red
    sizes = ndimage.sum(red, lab, range(1, n + 1))
    tee_top = np.where(lab == int(np.argmax(sizes)) + 1)[0].min()
    cy = ndimage.center_of_mass(red, lab, range(1, n + 1))
    # The tee, plus tee showing below its top edge (behind a hand). Lips and ears sit above it.
    red = np.isin(lab, [i + 1 for i, v in enumerate(sizes)
                        if v > 0.04 * sizes.max() or (v > 0.003 * sizes.max() and cy[i][0] > tee_top + 10)])
    # Shadowed folds: darker and less saturated, but still true red, and next to the tee.
    loose = ((h < 9) | (h > 338)) & (sat > 0.28) & (mx > 0.05) & (al > 0.3) & ndimage.binary_dilation(red, iterations=14)
    red = ndimage.binary_fill_holes(ndimage.binary_closing(red | loose, iterations=2))
    # Opening strips thin fragments: red light bounced onto the arms is skin, not tee.
    red = ndimage.binary_opening(red, structure=np.ones((3, 3)), iterations=3)
    return blobs(red, lambda i, v, sizes, lab: v > 0.003 * sizes.max())


def dye(rgba, target):
    """Recolours the tee, keeping the photo's shading (luminance relative to the tee's median)."""
    m = tee_mask(rgba)
    soft = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)[..., None] / 255
    a = np.asarray(rgba).astype(np.float32)
    lum = a[..., :3] @ np.array([0.299, 0.587, 0.114])
    shade = (lum / (np.median(lum[m]) if m.any() else 1))[..., None]
    a[..., :3] = a[..., :3] * (1 - soft) + np.clip(np.array(target, np.float32) * shade ** 1.1, 0, 255) * soft
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def cut(img, session):
    a = np.asarray(remove(img, session=session)).copy()
    a[..., 3][a[..., 3] < 14] = 0  # faint halo and floor shadow
    return Image.fromarray(a)


def trim(img, pad=2):
    x0, y0, x1, y1 = img.getbbox()
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


def on_canvas(img):
    """Cap top at TOP, neck centred: front, three-quarter and back then line up."""
    a = np.asarray(img)[..., 3] > 128
    top = np.where(a.sum(1) > 3)[0][0]
    xs = np.where(a[top + 165])[0]
    canvas = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    canvas.paste(img, (CANVAS[0] // 2 - (xs.min() + xs.max()) // 2, TOP - top), img)
    return canvas


def main(src):
    sheet = Image.open(src).convert('RGB')
    session = new_session('isnet-general-use')
    os.makedirs(os.path.join(OUT, 'photo'), exist_ok=True)
    base = {}
    for k, box in PANELS.items():
        panel = sheet.crop(box)
        panel.save(os.path.join(OUT, 'photo', f'{k}.webp'), quality=86, method=6)
        c = cut(panel, session)
        base[k] = on_canvas(c) if k in ('front', 'angle', 'back') else trim(c)
        print('cut', k)

    for tee, colour in TEES.items():
        os.makedirs(os.path.join(OUT, tee), exist_ok=True)
        for k, img in base.items():
            (img if colour is None else dye(img, colour)).save(os.path.join(OUT, tee, f'{k}.webp'), quality=84, method=6)
        print('dyed', tee)

    # Avatar: the close-up on a crimson disc.
    p = base['portrait']
    face = p.crop((30, 0, p.width - 30, p.width - 60)).resize((256, 256), Image.LANCZOS)
    disc = Image.new('L', (256, 256), 0)
    ImageDraw.Draw(disc).ellipse((0, 0, 255, 255), fill=255)
    bg = Image.new('RGBA', (256, 256), (200, 16, 46, 255))
    bg.alpha_composite(face)
    avatar = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    avatar.paste(bg, (0, 0), disc)
    avatar.save(os.path.join(OUT, 'avatar.webp'), quality=90)
    avatar.resize((64, 64), Image.LANCZOS).save(os.path.join(ROOT, 'public', 'favicon.png'))

    # Share card.
    og = Image.new('RGBA', (1200, 630), (244, 241, 234, 255))
    d = ImageDraw.Draw(og)
    d.ellipse((730, 70, 1230, 570), fill=(200, 16, 46, 255))
    r = 640 / p.height * 1.05
    pc = p.resize((int(p.width * r), int(p.height * r)), Image.LANCZOS)
    og.alpha_composite(pc, (980 - pc.width // 2, max(0, 630 - pc.height + 40)))
    bold, reg = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    if os.path.exists(bold):
        d.text((64, 170), 'Vinay', font=ImageFont.truetype(bold, 140), fill=(21, 22, 26))
        d.text((68, 330), 'Kumar Reddy', font=ImageFont.truetype(bold, 62), fill=(21, 22, 26))
        d.text((70, 440), 'GEN AI ENGINEER  ·  RAG  ·  AGENTS  ·  MCP', font=ImageFont.truetype(reg, 24), fill=(200, 16, 46))
    og.convert('RGB').save(os.path.join(OUT, 'og.jpg'), quality=86)
    print('done')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
