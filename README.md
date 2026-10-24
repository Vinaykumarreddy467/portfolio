# Vinay Kumar Reddy · Portfolio

**A portfolio that cites its sources.** I build grounded LLM systems, so every claim on this site carries a footnote that links to the repository that proves it.

Live: https://portfolio-pink-gamma-k8pt11kzv1.vercel.app

## What's inside

**Turnaround.** The photos are a character turnaround (front, three-quarter, profile, back), so the site is built like a living model sheet.

- **A 3D model of me.** The hero is a real-time WebGL model reconstructed from an 8-photo turnaround, not a video or a sprite. Drag to orbit, with inertia, and he settles on the nearest 45° photo. He leans toward your cursor and a light follows it. On desktop, scrolling scrubs a full turn while the camera pulls back from the close-up to the whole figure. A dial tracks the angle. At rest the call-out lines draw onto him: cap, lenses, core, and a watch with live Bengaluru time. Browsers without WebGL2 get the photo turntable instead.
- **Dye the tee.** Four swatches re-dye the tee (crimson, cobalt, forest, marigold), with a dye line rising up the 3D model from the hem. The whole site's accent colour follows, animated through `@property`. The choice is remembered per visitor.
- **Kinetic headline.** "I build AI that…" flips through *cites its sources*, *reasons in graphs*, *remembers context* and *measures itself*. Each one is backed by a project.
- **Ask the corpus.** Below the hero, the site is a small retrieval system over my work. Every fact in `data.ts` is a chunk (about a hundred), laid out as glowing dots in seven clusters on a dark map. Scrolling steps through seven guided questions (who, shipped, method, history, toolbox, proof, contact): each lights its chunks, threads them into a context window with a token budget, and streams an answer with `[n]` citations. Visitors can ask their own: BM25 plus character-trigram vectors, fused with reciprocal rank fusion, in the browser. No model writes anything, and a question nothing matches gets an honest miss. Any card or dot opens the full chunk. Phones get the same questions stacked.
- **References and the ⌘K palette.** Sources link to their GitHub repositories; the palette jumps to any question and can dye the tee too.
- **Footer.** The back view walks off behind the footer name.
- **Light and dark themes**, remembered per visitor. The first visit follows the OS setting.
- **Accessible and responsive.** Tested from 390 px phones to 1440 px desktops. Honours `prefers-reduced-motion`, and the turntable works with the keyboard.

## The 3D model

The hero model is reconstructed from an **8-shot turnaround**: full-body photos every 45° around me, same pose, with only the camera moving. [`scripts/turnaround.py`](scripts/turnaround.py) builds it:

1. **Cut-outs** with rembg.
2. **Calibration.** Each shot's rotation axis and angle are nudged until the shape carved from all eight silhouettes re-projects onto every photo as closely as possible (about 92% overlap). The shots are separate photos, not a camera rig.
3. **Visual hull.** Space is carved down to what lies inside every silhouette. A 3D opening removes thin sheets, a blur rounds the 8-sided slices toward the body's oval sections, then marching cubes, decimation and Taubin smoothing give 60k triangles.
4. **View weights.** For every vertex and every photo, the script works out whether that camera saw it: visible (z-buffer), inside the cut-out, facing the camera. It also builds a 4×2 atlas of the eight aligned shots for each tee colour.

In the browser ([`Figure3D`](src/components/Figure3D.tsx)), every pixel takes its colour from the photo that both saw that spot squarely and was taken closest to the current angle. At each 45° stop you see the actual photo; in between, one photo wraps the turning geometry. Points no camera saw borrow from their neighbours.

To rebuild with new photos, put `000…315` (any image type) in a folder:

```bash
pip install rembg scipy pillow scikit-image fast-simplification
python scripts/turnaround.py path/to/turnaround/
```

[`scripts/photos.py`](scripts/photos.py) builds the two head studies, the avatar and the share card from the original contact sheet. It also holds the tee re-dye (shading kept), which both scripts use.

## Edit the content

Everything (profile, photos and tee colours, projects, journey, metrics, certifications and sources) lives in one file: [`src/data.ts`](src/data.ts). [`src/corpus.ts`](src/corpus.ts) turns it into chunks, holds the search, the map layout and the guided questions with their written answers.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type-check + production build to dist/
```

React 19 · TypeScript · Vite 6 · three.js (lazy-loaded, hero only) · hand-written CSS (no UI framework). Typefaces: Inter Tight, Instrument Serif, JetBrains Mono.
