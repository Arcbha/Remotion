# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

Remotion motion-graphics compositions in the Apple design language. Vertical
9:16 (1080×1920) kinetic typography rendered to MP4. Not an app — every
deliverable is a video.

## Read this first

**Before building or editing any composition, read [`APPLE_MOTION.md`](./APPLE_MOTION.md).**

It is the single source of truth for timing, easing, spring physics,
transitions, stagger, display typography, palettes, layer stacking, camera math,
and glow construction. It is the default for all motion work; a request
overrides it only when explicit.

Import tokens from [`src/motion.ts`](./src/motion.ts) — never re-type magic
numbers:

```ts
import { DURATION, EASE, SPRING, CLAMP, useMs } from "./motion";
```

Colour and type tokens live in [`src/theme.ts`](./src/theme.ts).

## Commands

```bash
npm install
npm start                # Remotion Studio
npm run build            # render Overthink       → out/overthink-takeover.mp4
npm run build:defining   # render StartsDefining  → out/starts-defining.mp4
npx tsc --noEmit         # typecheck
npx remotion still <Composition> out/f.png --frame=<n>   # single-frame check
```

## Structure

| Path | Role |
|---|---|
| `src/Root.tsx` | Composition registry — every new piece must be registered here |
| `src/motion.ts` | Apple HIG motion tokens (timing, easing, springs, stagger, camera) |
| `src/theme.ts` | Colour and typography tokens |
| `src/Overthink.tsx` | 6s, 30fps, 180f — light-mode typewriter takeover |
| `src/StartsDefining.tsx` | 4s, 60fps, 240f — dark cinematic macro-camera typewriter |
| `APPLE_MOTION.md` | The motion & design reference |

## Conventions

- **Author timing in milliseconds, never hard-coded frames.** Convert with
  `useMs()` / `msToFrames()` so a composition survives an fps change.
- **Always clamp `interpolate`.** Spread `CLAMP` into every call — un-clamped
  interpolation is the most common cause of blown-out frames.
- **Offset springs to their own frame zero:** `spring({ frame: frame - START, ... })`.
- **Never ship Remotion's default spring config.** Pick from `SPRING`.
- **Animate `transform` and `opacity` only.** Never `width`, `height`, `top`,
  `left`, `margin`, `padding`, or `blur()` radius.
- **Every frame is a pure function of `frame`.** No `useEffect` for anything
  expressible as render logic; no state that persists across frames.
- **Gate text measurement on fonts.** Wrap `document.fonts.ready` in
  `delayRender()` / `continueRender()` before measuring glyphs, or you will
  silently measure the fallback face.
- **Self-host fonts** via `@fontsource/inter` so renders need no network.

## Verifying work

Typecheck, then render the key frames of each phase as stills and actually look
at them — a composition that compiles can still be blank, mistimed, or off
frame. Delete stills before committing (`out/` is gitignored).

## Deviations

If a composition departs from `APPLE_MOTION.md`, say so explicitly in the
component's doc comment with the reason. The current known deviation is
`StartsDefining`'s camera snap, which uses the deliberately underdamped
`CAMERA_SPRING.cinematicSnap` rather than a HIG spring.
