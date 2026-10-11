# Vinay Kumar Reddy · Portfolio

**A portfolio that cites its sources.** I build grounded LLM systems, so every claim on this site carries a footnote that links to the repository that proves it.

Live: https://portfolio-pink-gamma-k8pt11kzv1.vercel.app

## What's inside

- **Embedding-space hero.** A live canvas where your cursor is a query vector. It draws lines to its k nearest neighbours in real time and shows their similarity scores.
- **Citations everywhere.** `[n]` footnotes link to a References section, and each reference links to its GitHub repository.
- **Selected work.** Expandable rows, each with a hand-drawn diagram of that system's actual shape (RRF fusion, LangGraph fan-out, token buckets, and so on). On desktop, a preview card follows the cursor.
- **The loop.** An animated agent-pipeline diagram (retrieve, reason, cite, measure) that changes its highlighted step as you scroll.
- **Career as `git log`.** The journey is laid out as a commit graph.
- **⌘K / Ctrl K / `/` command palette.** Jump to sections, open projects, copy the email address, or switch the theme.
- **Dynamic but restrained.** A scroll-velocity marquee, magnetic buttons, scrambled mono labels, hero parallax and a custom cursor.
- **Light and dark themes.** "Ink" and "paper", remembered per visitor. The first visit follows the OS setting.
- **Accessible and responsive.** Tested from 320 px phones to 2560 px displays. Honours `prefers-reduced-motion`, works with the keyboard, and has a skip link.

## Edit the content

Everything (profile, projects, journey, metrics, certifications and sources) lives in one file: [`src/data.ts`](src/data.ts).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # type-check + production build to dist/
```

React 19 · TypeScript · Vite 6 · hand-written CSS (no UI framework). Typefaces: Inter Tight, Instrument Serif, JetBrains Mono.
