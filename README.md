# Overthink — "The Takeover"

A 6-second **9:16 (1080×1920)** kinetic-typography piece built with
[Remotion](https://remotion.dev), styled after the **Apple (España)** design
language: a minimalist white void where a typewriter turns on itself — two
lines type out, then the thesis violently takes over.

> "...overthink long enough, and the negative thoughts starts defining you."

## The design language

Distilled from `DESIGN.md` into `src/theme.ts`:

- **Absolute minimalism** — ink `#1d1d1f` on pure paper `#ffffff`. Zero UI
  chrome: no eyebrows, no pagination dots, extreme white space.
- **A single chromatic moment** — the "primary ink" gradient
  `linear-gradient(184deg, #1d1d1f 20%, #0000f9 76%, #252525 95%)` is spent
  only on the final phrase **"starts defining you."**, sweeping in and settling
  permanently on the vibrant `#0000f9`.
- **Oversized display type** — Inter 700 at 96px, line-height 1.04, `-1.44px`
  tracking (the DESIGN.md substitute for SF Pro Display), self-hosted via
  `@fontsource/inter` so renders need no network.
- **Intentional line breaks** — the setup is manually broken into a balanced
  four-line block (`...overthink` / `long enough,` / `and the negative` /
  `thoughts`) with `white-space: pre` — no auto-wrap, architectural shape.

## Structure — four phases (180 frames @ 30fps)

| Phase | Frames | What happens |
|-------|--------|--------------|
| **1 · The Void** | 0–15 | Pure white. A heavy black text cursor blinks dead-center. No text. |
| **2 · Mental Friction** | 15–75 | A strict typewriter (`useCurrentFrame` → string length, no blur). Line 1 types at a mechanical pace; line 2 follows *slower*. The cursor trails the text. |
| **3 · The Hold** | 75–105 | Typing stops. The two lines sit centered; the cursor keeps blinking. |
| **4 · The Takeover** | 105–180 | At frame 105: the cursor is **killed** instantly (zero fade); the setup is shoved to the back of the mind (`scale 0.8`, `opacity 15%`); and "starts defining you." **slams** in from `scale 1.2` while the primary-ink gradient **sweeps** its blue across the words (`background-clip: text` + animated `background-position` on both axes), settling on vibrant `#0000f9`. |

The whole composition lives in a single full-screen centered flex column, so
every line stays dead-center horizontally and vertically.

**One physics engine.** The setup receding and the final phrase slamming in are
driven by the *same* spring (`SLAM_CONFIG` — `damping 26, stiffness 220,
mass 0.7`), so the background pushback reads as a direct physical reaction to
the impact rather than an independent animation. The `scale 1.2` cap keeps the
slam violent without ever bleeding past the 1080px frame edges.

## Run it

```bash
npm install
npm start            # open Remotion Studio
npm run build        # render out/overthink-takeover.mp4
```
