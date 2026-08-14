# Overthink — kinetic typography

A 6-second motion-graphics piece built with [Remotion](https://remotion.dev),
styled after the **Apple (España)** design language: a cathedral of white space
where oversized weight-700 Inter type rises out of the paper one word at a time.

> "…overthink long enough, and the negative thoughts starts defining you."

## The design language

Distilled from `DESIGN.md` into `src/theme.ts`:

- **Near-monochrome palette** — ink `#1d1d1f` on paper `#ffffff`, with the gray
  band `#f5f5f7` used for rhythm instead of dividers.
- **A single chromatic moment** — the "primary ink" gradient (dark ink fading
  through electric blue) is spent only on the words **"defining you."**, the one
  place color is allowed to touch the type.
- **Signature Apple reveal** — each word rises a few pixels while a blur resolves
  into focus and opacity climbs from 0 to 1 (`src/components/RevealWord.tsx`).
  Nothing scales, nothing casts a shadow.
- **Oversized display type** — Inter 700 at 96px with `-1.44px` tracking, the
  DESIGN.md-specified substitute for SF Pro Display.
- **System chrome** — a mid-gray eyebrow label, dot pagination that steps per
  line, and a single foot hairline nod to the Apple grid.

## Animation timeline (180 frames @ 30fps)

| Beat | Frames | What happens |
|------|--------|--------------|
| Setup | 12–34 | "…overthink long enough," reveals word by word |
| The turn | 60–84 | "and the negative thoughts" — canvas eases into gray |
| The thesis | 116–132 | "starts defining you." — the chromatic accent lands |
| Settle | 150–180 | the full quote holds, a whisper back toward paper |

## Run it

```bash
npm install
npm start            # open Remotion Studio
npm run build        # render out/overthink.mp4
npm run still        # render a hero still
```

Fonts are self-hosted via `@fontsource/inter` (no network needed at render time).
