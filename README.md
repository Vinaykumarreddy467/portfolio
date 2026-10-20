# Vinay Kumar Reddy · Portfolio

**A portfolio that cites its sources.** I build grounded LLM systems, so every claim on this site carries a footnote that links to the repository that proves it.

Live: https://portfolio-pink-gamma-k8pt11kzv1.vercel.app

## What's inside

**Turnaround.** The photos are a character turnaround (front, three-quarter, profile, back), so the site is built like a living model sheet.

- **Turntable hero.** A cut-out of me stands in front of my name. He turns to look at your cursor. Drag, tap or use the arrow keys to spin him round, with a degree dial behind him that tracks the angle. Call-out lines draw themselves onto the photo: cap, lenses, core, and a watch that shows live Bengaluru time.
- **Dye the tee.** Four swatches re-dye the tee (crimson, cobalt, forest, marigold), wiping up from the hem. The whole site's accent colour follows, animated through `@property`. The choice is remembered per visitor.
- **Kinetic headline.** "I build AI that…" flips through *cites its sources*, *reasons in graphs*, *remembers context* and *measures itself*. Each one is backed by a project.
- **Model sheet.** All five poses on construction guides (cap, eyes, chin, shoulders, hands). Pick one to open the original, undyed photo in a lightbox.
- **Citations everywhere.** `[n]` footnotes link to a References section, and each reference links to its GitHub repository.
- **Selected work.** Expandable rows, each with a hand-drawn diagram of that system's actual shape. On desktop, a preview card follows the cursor.
- **The loop, career as `git log`, ⌘K palette.** The palette can dye the tee too.
- **Contact and footer.** The profile shot looks at the email address, and the back view walks off behind the footer name.
- **Light and dark themes**, remembered per visitor. The first visit follows the OS setting.
- **Accessible and responsive.** Tested from 390 px phones to 1440 px desktops. Honours `prefers-reduced-motion`, and the turntable works with the keyboard.

## Photos

Everything in `public/img` comes from one studio contact sheet, through [`scripts/photos.py`](scripts/photos.py). It cuts out the backgrounds (rembg), aligns front, three-quarter and back on one canvas, and re-dyes the tee per colour while keeping the fabric's shading. To use new photos, run it on a new sheet:

```bash
pip install rembg scipy pillow
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

React 19 · TypeScript · Vite 6 · hand-written CSS (no UI framework). Typefaces: Inter Tight, Instrument Serif, JetBrains Mono.
