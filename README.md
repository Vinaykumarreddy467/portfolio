# Vinay Kumar Reddy · Portfolio

**A portfolio that cites its sources.** I build grounded LLM systems, so every claim on this site carries a footnote that links to the repository that proves it.

Live: https://portfolio-pink-gamma-k8pt11kzv1.vercel.app

## What's inside

**Turnaround.** The photos are a character turnaround (front, three-quarter, profile, back), so the site is built like a living model sheet.

- **A 3D model of me.** The hero is a real-time WebGL model built from my photos, not a video or a sprite. Drag to orbit, with inertia, and he settles on a good angle. He leans toward your cursor and a light follows it. On desktop, scrolling scrubs a full turnaround while the camera pulls back from the close-up to the whole figure. A dial tracks the angle. At rest the call-out lines draw onto him: cap, lenses, core, and a watch with live Bengaluru time. Browsers without WebGL2 get the photo turntable instead.
- **Dye the tee.** Four swatches re-dye the tee (crimson, cobalt, forest, marigold), a dye line rising up the 3D model from the hem. The whole site's accent colour follows, animated through `@property`. The choice is remembered per visitor.
- **Kinetic headline.** "I build AI that…" flips through *cites its sources*, *reasons in graphs*, *remembers context* and *measures itself*. Each one is backed by a project.
- **Model sheet.** All five poses on construction guides (cap, eyes, chin, shoulders, hands). Pick one to open the original, undyed photo in a lightbox.
- **Citations everywhere.** `[n]` footnotes link to a References section, and each reference links to its GitHub repository.
- **Selected work.** Expandable rows, each with a hand-drawn diagram of that system's actual shape. On desktop, a preview card follows the cursor.
- **The loop, career as `git log`, ⌘K palette.** The palette can dye the tee too.
- **Contact and footer.** The profile shot looks at the email address, and the back view walks off behind the footer name.
- **Light and dark themes**, remembered per visitor. The first visit follows the OS setting.
- **Accessible and responsive.** Tested from 390 px phones to 1440 px desktops. Honours `prefers-reduced-motion`, and the turntable works with the keyboard.

## Photos and the 3D model

Everything in `public/img` and `public/model` comes from one studio contact sheet, through [`scripts/photos.py`](scripts/photos.py):

1. **Cut-outs.** rembg removes the backgrounds, and front, three-quarter and back are aligned on one canvas.
2. **Tee colours.** The tee is re-dyed per colour, keeping the fabric's shading.
3. **3D model** ([`scripts/model3d.py`](scripts/model3d.py)):
   - The back shot is mirrored and shifted until its outline overlaps the front best.
   - Body volume comes from the silhouette, with round limbs and an oval torso.
   - Depth Anything V2 adds the local relief: cap brim, glasses, folds, hands.
   - The result is two height-field shells that close into one body. In the browser each shell shows exactly its own photo when seen from that photo's camera. As it turns away, both shells switch to the shared outline, and surfaces no camera saw blur and shade softly instead of stretching.

To use new photos, run it on a new sheet. The first run downloads the 1.3 GB depth model.

```bash
pip install rembg scipy pillow onnxruntime
python scripts/photos.py path/to/contact-sheet.webp
```

## Edit the content

Everything (profile, photos and tee colours, projects, journey, metrics, certifications and sources) lives in one file: [`src/data.ts`](src/data.ts).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type-check + production build to dist/
```

React 19 · TypeScript · Vite 6 · three.js (lazy-loaded, hero only) · hand-written CSS (no UI framework). Typefaces: Inter Tight, Instrument Serif, JetBrains Mono.
