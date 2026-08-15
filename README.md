# Overthink — kinetic typography

A 6-second **9:16 (1080×1920)** motion-graphics piece built with
[Remotion](https://remotion.dev), styled after the **Apple (España)** design
language: a cathedral of white space where oversized weight-700 Inter type
rises out of the paper one word at a time — then gets shoved to the back of the
mind as the thesis takes over.

> "…overthink long enough, and the negative thoughts starts defining you."

## The design language

Distilled from `DESIGN.md` into `src/theme.ts`:

- **Near-monochrome palette** — ink `#1d1d1f` on paper `#ffffff`, with the gray
  band `#f5f5f7` used for rhythm instead of dividers.
- **A single chromatic moment** — the "primary ink" gradient (dark ink fading
  through electric blue) is spent only on the final phrase
  **"starts defining you."**, the one place color is allowed to touch the type.
- **Oversized display type** — Inter 700 at 96px with `-1.44px` tracking, the
  DESIGN.md-specified substitute for SF Pro Display.

## Structure — two phases

**Phase 1 · The Setup** — Lines 1 & 2 are anchored to the top third and reveal
word by word with the signature Apple reveal: each word lifts on the Y-axis and
eases from a heavy blur into sharp focus, opacity 0→1
(`src/components/RevealWord.tsx`). Nothing scales, nothing casts a shadow.

**Phase 2 · The Takeover** (frame 108) — As line 3 fires:

- *The exit* — lines 1 & 2 recede to the back of the mind: scaling to `0.85`,
  blur pushed to `12px`, opacity dropped to `15%`.
- *The impact* — "starts defining you." skips the gentle reveal entirely. It
  enters dead-center at `scale: 1.5` and, on a stiff high-damping spring, snaps
  rapidly down to `scale: 1`.
- *The color* — the chromatic blue gradient is fully saturated from the very
  first frame it appears, dominating the white space.

## Animation timeline (180 frames @ 30fps)

| Beat | Frames | What happens |
|------|--------|--------------|
| Setup | 8–30 | "…overthink long enough," reveals word by word |
| The turn | 50–74 | "and the negative thoughts" — canvas eases into gray |
| The takeover | 108–130 | setup lines recede; "starts defining you." snaps in |
| Settle | 130–180 | the blue thesis holds, the old thoughts ghosted behind |

## Run it

```bash
npm install
npm start            # open Remotion Studio
npm run build        # render out/overthink.mp4
npm run still        # render a hero still
```

Fonts are self-hosted via `@fontsource/inter` (no network needed at render time).
