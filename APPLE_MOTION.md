# Apple Motion & Design System — Master Reference

**The single source of truth for every motion-graphics iteration in this repo.**

This document distills Apple's Human Interface Guidelines motion system, Apple's
display-typography conventions, and the Apple UI design skills into one reference
tuned for **motion graphics / animation video** (Remotion, After Effects, or any
frame-based renderer) rather than for shipping app UI.

Read this before building any composition. When a request conflicts with this
document, this document is the default and the request wins only if explicit.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Canvas & Delivery Specs](#2-canvas--delivery-specs)
3. [The Timing System](#3-the-timing-system)
4. [Easing Curves & Graphs](#4-easing-curves--graphs)
5. [Spring Physics](#5-spring-physics)
6. [Transition & Enter/Exit Patterns](#6-transition--enterexit-patterns)
7. [Apple UI Motion (UI inside video)](#7-apple-ui-motion-when-ui-appears-inside-the-video)
8. [Stagger & Rhythm](#8-stagger--rhythm)
9. [Typography for Motion](#9-typography-for-motion)
10. [Color, Surfaces & Depth](#10-color-surfaces--depth)
11. [Layer Stacking & Camera](#11-layer-stacking--camera)
12. [Glow, Gradient & Atmosphere](#12-glow-gradient--atmosphere)
13. [Accessibility & Safety](#13-accessibility--safety)
14. [Performance & Render Rules](#14-performance--render-rules)
15. [Anti-Patterns](#15-anti-patterns)
16. [Copy-Paste Snippets](#16-copy-paste-snippets)
17. [Provenance & Deliberate Deviations](#17-provenance--deliberate-deviations)

---

## 1. Philosophy

Apple's three pillars, translated from UI into motion graphics:

| Pillar | In UI | In motion graphics |
|---|---|---|
| **Clarity** | Legible text, generous negative space | One idea on screen at a time. The frame breathes. Type is never fighting the background. |
| **Deference** | Content is the focus; chrome recedes | Motion serves the message. If a move doesn't clarify meaning or direct the eye, cut it. |
| **Depth** | Distinct layers, realistic motion | Every element has a believable position in Z. Things arrive from somewhere real and leave somewhere real. |

### The five governing rules

1. **Spring physics for anything that feels touched or thrown.** Reserve
   cubic-bezier for ambient, non-interactive, or purely cinematic motion.
2. **Respect spatial metaphors consistently.** Push moves left/right. Sheets
   move up/down. Alerts appear in place. Mixing metaphors without reason
   destroys the viewer's spatial model.
3. **Match motion to velocity.** A slow move settles slowly; a fast flick exits
   fast. Never animate at a constant speed something that was "thrown."
4. **One full-screen transition at a time.** Queue anything that would collide
   with a running full-screen move.
5. **Prefer removal over addition.** If a move feels unnecessary, delete it.
   Calm and inevitable beats busy and clever.

> **Design intent test:** every animation must answer *"what does this teach the
> viewer?"* — hierarchy, causality, continuity, or spatial relationship. Motion
> that only decorates is cut.

---

## 2. Canvas & Delivery Specs

House defaults for this repo:

| Spec | Value |
|---|---|
| Aspect | 9:16 vertical |
| Resolution | 1080 × 1920 |
| Framerate | 60 fps (30 fps acceptable for lighter renders) |
| Color | sRGB |
| Type | Inter, self-hosted via `@fontsource/inter` (SF Pro substitute) |
| Safe margin | ≥ 64px horizontal, ≥ 120px top/bottom for platform UI overlays |

**Always express timing in seconds or a frame-count helper, never in raw frames
hard-coded to one fps.** A composition should survive an fps change.

```ts
const { fps } = useVideoConfig();
const ms = (v: number) => Math.round((v / 1000) * fps); // ms → frames
```

---

## 3. The Timing System

Apple's duration scale, with exact frame conversions:

| Token | Duration | @60fps | @30fps | Use |
|---|---|---|---|---|
| `instant` | 0ms | 0f | 0f | Direct manipulation, state changes that follow a finger |
| `fast` | 150ms | 9f | 5f | Small icon transitions, badge updates, tooltips, **exits** |
| `snap` | 200ms | 12f | 6f | Popovers, context menus, scale-pop entrances |
| `default` | 300ms | 18f | 9f | Standard push/pop, modal present, sheet dismiss |
| `slow` | 400ms | 24f | 12f | Full-screen transitions, hero/magic-move, splash fade |
| `slower` | 500ms | 30f | 15f | Hero image zooms, onboarding sequences, title cards |

### Timing laws

- **Exits are faster than entrances.** Typically half: enter 300ms → exit 150ms.
  The viewer has already decided to leave; don't make them wait.
- **Spring durations are emergent.** A spring's duration is a *consequence* of
  stiffness, damping, and mass — never set it explicitly. The table above
  describes *perceived* duration for springs, not a parameter you pass.
- **Anything over 500ms needs a reason.** Cinematic camera moves and title holds
  are the legitimate exceptions; UI-like elements are not.
- **Hold before you cut.** After a reveal completes, hold at least 400–600ms
  before the next event so the eye can land.

---

## 4. Easing Curves & Graphs

Five curves. Learn what each one *feels* like, not just its numbers.

| Token | `cubic-bezier` | Use |
|---|---|---|
| `ease-out` | `(0.33, 1, 0.68, 1)` | Non-spring elements entering — alerts, static overlays |
| `ease-in` | `(0.32, 0, 0.67, 0)` | Elements exiting — UI the user is leaving behind |
| `ease-in-out` | `(0.65, 0, 0.35, 1)` | Repositioning, crossfades between states of one element |
| `deceleration` | `(0.0, 0.0, 0.2, 1.0)` | Entering from off-screen — matches a physical throw |
| `linear` | `(0, 0, 1, 1)` | Progress bars, spinners, continuous loops, typewriters |

> **Apple's preferred entrance curve is strong deceleration.** The element
> arrives with high velocity and brakes firmly — communicating that it traveled
> from somewhere real.

### `ease-out` — `cubic-bezier(0.33, 1, 0.68, 1)`

Fast start, long graceful settle. The default for anything appearing.

```
  1 ┤                                ████████████████
    │                         ████████
    │                     █████
    │                  ████
    │                ███
    │             ████
    │           ███
    │          ██
    │        ███
    │       ██
    │     ███
    │    ██
    │   ██
    │  ██
    │ ██
  0 └────────────────────────────────────────────────
     0                                  time →      1
```

### `ease-in` — `cubic-bezier(0.32, 0, 0.67, 0)`

Slow creep, then accelerates away. Only for exits — it feels sluggish on entry.

```
  1 ┤                                              ██
    │                                             ██
    │                                            ██
    │                                           ██
    │                                          ██
    │                                        ███
    │                                       ██
    │                                     ███
    │                                    ██
    │                                  ███
    │                               ████
    │                             ███
    │                          ████
    │                      █████
    │               ████████
  0 └────────────────────────────────────────────────
     0                                  time →      1
```

### `ease-in-out` — `cubic-bezier(0.65, 0, 0.35, 1)`

Symmetric S-curve. For an element moving from one place to another, staying on
screen the whole time.

```
  1 ┤                                      ██████████
    │                                  █████
    │                               ████
    │                             ███
    │                           ███
    │                          ██
    │                         ██
    │                        ██
    │                      ███
    │                     ██
    │                    ██
    │                  ███
    │                ███
    │             ████
    │         █████
  0 └────────────────────────────────────────────────
     0                                  time →      1
```

### `deceleration` — `cubic-bezier(0.0, 0.0, 0.2, 1.0)`

Instant velocity at t=0, hard brake. The most "physical" of the curves — use it
when something flies in from off-screen.

```
  1 ┤                                    ████████████
    │                            █████████
    │                       ██████
    │                   █████
    │                ████
    │              ███
    │           ████
    │         ███
    │        ██
    │      ███
    │     ██
    │   ███
    │  ██
    │ ██
    │██
  0 └────────────────────────────────────────────────
     0                                  time →      1
```

### `linear` — `cubic-bezier(0, 0, 1, 1)`

No acceleration. Correct *only* for continuous mechanical motion: spinners,
progress, scrolling marquees, and **typewriter character reveals**.

```
  1 ┤                                             ███
    │                                          ████
    │                                       ████
    │                                    ████
    │                                 ████
    │                              ████
    │                           ████
    │                        ████
    │                    █████
    │                 ████
    │              ████
    │           ████
    │        ████
    │     ████
    │  ████
  0 └────────────────────────────────────────────────
     0                                  time →      1
```

### In Remotion

```ts
import { Easing, interpolate } from "remotion";

const EASE = {
  out:          Easing.bezier(0.33, 1, 0.68, 1),
  in:           Easing.bezier(0.32, 0, 0.67, 0),
  inOut:        Easing.bezier(0.65, 0, 0.35, 1),
  deceleration: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  linear:       Easing.linear,
} as const;

const opacity = interpolate(frame, [0, ms(300)], [0, 1], {
  easing: EASE.out,
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

**Always clamp both ends.** Un-clamped `interpolate` overshoots off the ends of
its range and is the single most common source of invisible or blown-out frames.

---

## 5. Spring Physics

Apple's four canonical springs. In UIKit these are `dampingRatio` /
`initialSpringVelocity`; in SwiftUI `response` / `dampingFraction`. Below they
are given as **stiffness / damping / mass**, which drops straight into Remotion,
Framer Motion, and react-spring.

| Config | stiffness | damping | mass | ζ (damping ratio) | Character |
|---|---|---|---|---|---|
| **Default** | 300 | 30 | 1 | 0.87 | Settles cleanly, no bounce. The workhorse. |
| **Snappy** | 500 | 40 | 1 | 0.89 | Fast response, matches gesture velocity. |
| **Gentle** | 170 | 26 | 1 | 1.00 | Soft arrival, critically damped. Large elements. |
| **Tight** | 700 | 60 | 1 | 1.13 | Overdamped. Near-instant, no spring tail. |

> UIKit reference: `UISpringTimingParameters(dampingRatio: 0.7, initialSpringVelocity: 0.5)`
> SwiftUI reference: `.spring(response: 0.35, dampingFraction: 0.7)`

### Measured behaviour (verified with Remotion's `measureSpring`)

| Config | 50% @60fps | 90% @60fps | 99% @60fps | Full settle @60fps | Full settle @30fps | Overshoot |
|---|---|---|---|---|---|---|
| Default | 6f | 12f | 17f | 17f (283ms) | 9f (300ms) | none |
| Snappy | 5f | 10f | 14f | 15f (250ms) | 8f (267ms) | none |
| Gentle | 8f | 18f | 31f | 34f (567ms) | 17f (567ms) | none |
| Tight | 4f | 9f | 16f | 17f (283ms) | 9f (300ms) | none |

**Critical insight: none of Apple's springs overshoot.** Every config is
ζ ≥ 0.87 — at or near critical damping. Apple motion feels *fast and
authoritative*, never bouncy. If your animation visibly rebounds past its target,
it is not Apple-like.

For contrast, **Remotion's default spring** (`stiffness 100, damping 10, mass 1`)
is ζ = 0.50 — it overshoots **16.3%** and takes 56 frames (933ms) to settle. It
is far too loose and slow for this system. **Never ship the default config.**

### Choosing a spring

```
Is the element responding to a gesture / impact?
├─ Yes → Is it a small control (button, toggle)?
│         ├─ Yes → Tight   (700/60/1)
│         └─ No  → Snappy  (500/40/1)
└─ No  → Is it large (full-screen, hero, split view)?
          ├─ Yes → Gentle  (170/26/1)
          └─ No  → Default (300/30/1)
```

### In Remotion

```ts
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export const SPRING = {
  default: { stiffness: 300, damping: 30, mass: 1 },
  snappy:  { stiffness: 500, damping: 40, mass: 1 },
  gentle:  { stiffness: 170, damping: 26, mass: 1 },
  tight:   { stiffness: 700, damping: 60, mass: 1 },
} as const;

const progress = spring({
  frame: frame - startFrame,   // always offset; springs must start at 0
  fps,
  config: SPRING.default,
});
```

Drive transforms off the normalized `progress` with `interpolate`, so one spring
can animate several properties in lockstep:

```ts
const y     = interpolate(progress, [0, 1], [120, 0]);
const scale = interpolate(progress, [0, 1], [0.94, 1]);
```

### House extension — cinematic camera springs

HIG has no concept of a camera. For dramatic camera moves (zoom-outs, whip pans,
macro-to-wide reveals) a **deliberately underdamped** spring is permitted, and
should be labelled as an intentional deviation in the composition:

| Config | stiffness | damping | mass | ζ | Character |
|---|---|---|---|---|---|
| `cinematicSnap` | 220 | 14 | 0.9 | 0.50 | Violent slam with visible overshoot |
| `cinematicGlide` | 120 | 20 | 1 | 0.91 | Slow authoritative push, no bounce |

Use these **only** for the camera/viewport itself, never for UI-like content
inside the frame.

---

## 6. Transition & Enter/Exit Patterns

The canonical Apple transitions, ready to translate into any renderer.

### Navigation Push
- **Enter:** incoming translates X `+100% → 0`; title and back button fade in.
  Outgoing translates X `0 → -30%` (parallax — it recedes, it doesn't just leave).
- **Exit (pop):** exact reverse. Incoming `-30% → 0`, outgoing `0 → +100%`.
- **Timing:** `default` (300ms), spring **Default**.

### Modal Sheet
- **Enter:** translateY `100% → 0`; corner radius animates to the sheet radius.
  `default` (300ms), spring **Default**.
- **Exit:** translateY `0 → 100%`. `default` (300ms), spring **Snappy**.

### Fade + Slide (alerts, non-interactive overlays)
- **Enter:** opacity `0 → 1`, scale `0.94 → 1`. `default` (300ms), `ease-out`.
- **Exit:** opacity `1 → 0`, scale `1 → 0.94`. `fast` (150ms), `ease-in`.

### Scale Pop (popovers, context menus, tooltips)
- **Enter:** opacity `0 → 1`, scale `0.8 → 1`, **transform-origin at the anchor
  point**. `snap` (200ms), spring **Snappy**.
- **Exit:** opacity `1 → 0`, scale `1 → 0.8`. `fast` (150ms), `ease-in`.

### Hero / Magic Move (shared element)
The source element's frame animates **directly** to the destination frame. No
fade, no separate enter and exit — the element *becomes* the destination.
`slow` (400ms), spring **Gentle**. This is the highest-value transition in the
system; use it whenever the same object persists across two states.

### Contextual Menu
Source scales to `0.95` (pressed feel), background blurs in over 200ms. Menu
items appear from the anchor: scale `0.8 → 1`, opacity `0 → 1`, spring
**Snappy**, staggered 20ms.

### Interaction states (for UI-mockup shots)
- **Hover:** subtle highlight over 150ms `ease-out`. No scale on most controls.
- **Press:** scale to `0.95` immediately (0ms — direct manipulation). Release
  returns to `1.0` via **Tight**.
- **Focus:** ring appears at 0ms, no animation on iOS. tvOS lifts `1 → 1.08`
  with deepening shadow over 200ms **Default**.
- **Loading:** rotary spinner 0.9s/revolution `linear`. Skeleton shimmer travels
  left→right over 1500ms `ease-in-out`, looping with a 400ms gap.

---

## 7. Apple UI Motion (when UI appears inside the video)

A composition often has to show a *real interface* — a button depressing, a
sheet sliding up, a dropdown opening, a toast arriving, a notification landing.
When it does, the motion must match **Apple's actual UI motion**, not a
cinematic approximation. This section is the exact-values layer for that, drawn
from Apple's WWDC design talks (*Designing Fluid Interfaces*, *The Details of UI
Typography*) by way of Emil Kowalski's animation skills.

**The critical reframing for video:** in a live app these behaviours are
*interactive* — driven by a finger, interruptible, velocity-aware. In a render
there is no finger. So you keep the **values and shapes** (the spring configs,
the curves, the enter/exit geometry) and drop the **input machinery** (see
[What is inert in a render](#what-is-inert-in-a-render) below). You are
reproducing the *result* of Apple's motion on a fixed timeline.

### Should this UI element animate? (the purpose gate)

Before adding UI motion, name its purpose in one word — **feedback**, **spatial
consistency**, **state indication**, **preventing a jarring change**, or
**explanation**. If you can't name it, don't animate it.

> The *frequency* and *hover* gates from interactive UI (— "no animation on a
> 100×/day action", "gate `:hover` behind `pointer: fine`" —) **do not apply in
> a render.** There is no repeat-use fatigue in a fixed video and no pointer to
> false-fire. Ignore those two gates here; keep the purpose gate.

### Apple UI springs — exact ships, translated to Remotion

Apple specifies UI springs as **damping ratio (ζ)** + **response (seconds)**.
Below are the three concrete configs Apple ships, each converted to Remotion's
`stiffness / damping / mass` (mass = 1) via
`k = (2π/response)²`, `c = 2ζ√k`, then **verified with `measureSpring`**:

| Apple interaction | ζ | response | → Remotion config | Settle @60fps | Overshoot |
|---|---|---|---|---|---|
| Move / reposition (PiP) | 1.0 | 0.4s | `{ stiffness: 247, damping: 31, mass: 1 }` | 28f (467ms) | none |
| Rotation | 0.8 | 0.4s | `{ stiffness: 247, damping: 25, mass: 1 }` | 28f (467ms) | 1.6% |
| Drawer / sheet | 0.8 | 0.3s | `{ stiffness: 439, damping: 34, mass: 1 }` | 21f (350ms) | 1.3% |

These live in `src/motion.ts` as `UI_SPRING.move` / `.rotate` / `.drawer`.

**The default-damping law (Apple + Emil agree):** start every UI spring
**critically damped, ζ = 1.0, no overshoot**. Add bounce (ζ ≈ 0.8, the ~1.5%
overshoot above) **only when the motion simulates something the user threw** — a
flicked card, a released drag, a drawer kicked closed. Overshoot on a menu that
merely faded in is wrong; overshoot on a flicked sheet is right. This is exactly
the [Spring Physics §5](#5-spring-physics) rule restated for UI, and the HIG
`SPRING.default` (300/30/1) is an equally valid critically-damped choice.

### UI-grade easing curves (stronger than the HIG set)

The five [HIG curves in §4](#4-easing-curves--graphs) are tuned for ambient and
cinematic motion. For *UI elements* the platform uses **stronger** ease-outs —
they leave the start faster and settle longer, which reads as more responsive on
a control. Use these when animating buttons, popovers, sheets, and toasts;
keep the HIG curves for camera, type reveals, and atmosphere.

```ts
// in src/motion.ts as UI_EASE
UI_EASE.out     = Easing.bezier(0.23, 1, 0.32, 1);     // strong ease-out for UI
UI_EASE.inOut   = Easing.bezier(0.77, 0, 0.175, 1);    // strong ease-in-out, on-screen moves
UI_EASE.drawer  = Easing.bezier(0.32, 0.72, 0, 1);     // iOS drawer curve (Ionic/Vaul)
```

`UI_EASE.out` — `cubic-bezier(0.23, 1, 0.32, 1)` — near-vertical launch, long tail:

```
                      ████████████████████████
                ███████
             ████
           ███
          ██
        ███
       ██
      ██
     ██
    ██
   ██
  ██
```

`UI_EASE.drawer` — `cubic-bezier(0.32, 0.72, 0, 1)` — the iOS sheet curve; a firm
pull with a soft arrival. Pair it with the drawer geometry below.

**Never `ease-in` on a UI element.** It starts slow and delays the exact moment
the viewer is watching the control respond. `UI_EASE.out` at 200ms *reads* faster
than `ease-in` at 200ms.

### UI component durations

| Element | Duration | @60fps |
|---|---|---|
| Button press feedback | 100–160ms | 6–10f |
| Tooltip, small popover | 125–200ms | 8–12f |
| Dropdown, select | 150–250ms | 9–15f |
| Modal, drawer | 200–500ms | 12–30f |

> **This is the one place inside a video where the "controls stay under 300ms"
> rule holds.** A rendered dropdown that takes 400ms reads as sluggish because
> the viewer's instinct still measures it against a real control. Cinematic beats
> (§3) are the opposite — there, 400–500ms is correct. Know which one you're
> animating.

### Component recipes → Remotion

Exact enter geometry. **Never `scale(0)`** — nothing appears from nothing; start
from `scale(0.95–0.97)` + `opacity 0`. Popovers/dropdowns/tooltips scale from
their **trigger's** anchor (`transformOrigin` at the source element); modals are
exempt and stay centered.

| Component | Enter | Exit | Curve / spring | Duration |
|---|---|---|---|---|
| Button press | `scale 1 → 0.97` | `→ 1` | `UI_EASE.out` | 160ms |
| Dropdown / menu | `opacity 0→1`, `scale 0.95→1`, origin = trigger | reverse | `UI_EASE.out` | 200ms |
| Tooltip | `opacity 0→1`, `scale 0.97→1`, origin = trigger | reverse | `UI_EASE.out` | 125ms |
| Modal | `opacity 0→1`, `scale 0.96→1`, centered + backdrop fade | reverse | `UI_EASE.out` | 250ms |
| Drawer / sheet | `translateY 100% → 0` | `→ 100%` | `UI_EASE.drawer` or `UI_SPRING.drawer` | 500ms |
| Toast | `opacity 0→1`, `translateY 100% → 0` | reverse (same path) | `EASE` (plain `ease`) | 400ms |
| Group stagger | items `opacity 0→1`, `translateY 8px→0` | — | `UI_EASE.out`, 50ms apart | 300ms each |

`translateY(100%)` is relative to the element's own height — it always travels
exactly its own size regardless of content. Prefer it to hardcoded pixels.

```tsx
// A dropdown opening at frame START, scaling out of its trigger.
const p = spring({ frame: frame - START, fps, config: UI_SPRING.move });
// or, for a curve-based control: interpolate(frame,[START,START+ms(200)],[0,1],{easing:UI_EASE.out,...CLAMP})

<div style={{
  opacity: p,
  transform: `scale(${interpolate(p, [0, 1], [0.95, 1])})`,
  transformOrigin: "top left",   // the trigger's anchor, not center
}} />
```

**Exit the way you entered.** A toast that arrives from the bottom leaves through
the bottom; a sheet that rose from below drops back down. Symmetric paths are
the whole reason swipe-to-dismiss reads as obvious — reproduce that symmetry
even though nothing is being swiped.

### What is inert in a render

Apple's fluid-interface machinery is *interactive*, and a rendered video has no
input. The following are **load-bearing in a live app but inert on a fixed
timeline** — reproduce their visible *result* by keyframing it, never by wiring
up the mechanism:

| Interactive concept | In a render |
|---|---|
| 1:1 pointer tracking, `setPointerCapture` | Animate the element along the path a finger *would* have dragged. |
| Velocity handoff (gesture → spring initial velocity) | Pick the spring so its opening speed matches the implied throw. |
| Momentum projection (flick → landing point) | Choose the landing frame yourself; there's no live velocity. |
| Interruptibility / reversal mid-flight | There is no user to interrupt. Author the one intended path. |
| Rubber-banding at boundaries | Only if you're *depicting* an over-scroll; keyframe the resistance. |
| `prefers-reduced-motion`, `@media (hover)` gating | No live media queries in a render. (Ship them if the deliverable is an actual component, not a video.) |

If a composition's *subject* is one of these behaviours — an explainer showing
how drag-to-dismiss feels — you animate the outcome on the timeline and may note
the deviation in the component's doc comment.

---

## 8. Stagger & Rhythm

| Content | Stagger | Cap |
|---|---|---|
| List rows | 25ms (1.5f @60) | 8 items — beyond that, appear together |
| Cards in a grid | 30ms (2f @60) | 6 cards |
| Nav items, tab bars, sidebars | **none** | Appear as a single unit |
| Icons / tiles | 20ms (1.2f @60) | Wave outward from the interaction origin |
| Words in a headline | 40–60ms (2.5–4f @60) | One line at a time |
| Characters (typewriter) | `linear` interpolation over the phrase | — |

**Rules:**
- Stagger communicates *grouping*. Elements that belong to one unit must not
  stagger against each other.
- Cap the count. Past ~8 items the stagger reads as lag, not rhythm.
- Stagger delay must be shorter than the item's own animation — otherwise the
  group reads as a queue instead of a wave.

---

## 9. Typography for Motion

### Family & weights
- **Inter**, self-hosted (`@fontsource/inter`) as the SF Pro substitute.
- Weights: **600** (display/headline), **500** (body), **400** (caption).
  Use as few weights as possible in one composition — two is usually right.
- Establish hierarchy with **size and weight, never color**.

### Display scale for 1080×1920 vertical

| Role | Size | Weight | Tracking | Line height |
|---|---|---|---|---|
| Hero display | 96px | 600 | −1.44px | 1.05 |
| Headline (large) | 82px | 600 | −1.50px | 1.0–1.1 |
| Headline | 64px | 600 | −1.20px | 1.1 |
| Subhead | 48px | 500 | −0.60px | 1.2 |
| Body | 34px | 500 | −0.28px | 1.35 |
| Caption | 24px | 400 | 0 | 1.4 |

### Tracking law

**Negative tracking scales with type size.** Large type set at default tracking
looks loose and amateurish; this is the single clearest tell of non-Apple
typography.

```
tracking ≈ −0.015em  for display (≥64px)
tracking ≈ −0.008em  for subhead (40–63px)
tracking ≈  0        for body and below (≤32px)
```

Never apply negative tracking below ~24px — it destroys legibility.

### Kinetic typography rules

1. **Animate the line, not the letters** — unless letterform motion *is* the
   idea. Per-character animation on a full sentence reads as noise.
2. **Reveal by mask, not by opacity**, when text should feel like it is being
   written or uncovered. Masked reveals preserve the letterforms' integrity.
3. **Typewriters run `linear`.** Human typing has no easing. Reveal whole
   glyphs — never fractional character widths, which cause sub-pixel jitter.
4. **Measure, don't guess.** Compute glyph advances with canvas
   `measureText()` and gate the render on `document.fonts.ready` via
   `delayRender()`. Layout that assumes a fallback font will shift on render.
5. **One line, one idea.** Lock font size so the phrase fits a single line
   inside the safe area; reflowing text mid-animation is never acceptable.
6. **Text enters with `deceleration` or a spring — never `linear`.**
7. **Hold the final state ≥ 400ms** before cutting so the phrase can be read.

---

## 10. Color, Surfaces & Depth

### Light system (Apple.com / product pages)

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#1d1d1f` | Primary text, headlines |
| `deepGray` | `#474747` | Medium-emphasis text |
| `midGray` | `#707070` | Secondary text, labels |
| `hairline` | `#d6d6d6` | Dividers |
| `canvas` | `#f5f5f7` | Alternating section band |
| `paper` | `#ffffff` | Primary background |
| `electricBlue` | `#0071e3` | Filled CTA — used sparingly |
| `linkBlue` | `#0066cc` | Inline links, chevrons |

### Dark cinematic system (keynote / hero video)

| Token | Hex | Usage |
|---|---|---|
| `void` | `#010208` | Top-of-frame deep black |
| `abyss` | `#04091a` | Upper-mid field |
| `deepBlue` | `#0d3172` | Lower-mid field |
| `vividBlue` | `#2f6ac2` | Lower field |
| `haze` | `#6ea6dd` | Bottom haze / horizon |
| `neon` | `#007fff` | Accent light source, cursors, rules |

### Color laws

- **Accent sparingly.** One accent per composition. When everything is
  emphasized, nothing is.
- **Never convey meaning by color alone.**
- **Contrast:** ≥ 4.5:1 for body, ≥ 3:1 for large type (≥18pt/24px).
- **No harsh borders.** Separate with spacing, grouping, and elevation — not
  outlines. If a border is unavoidable, 1px hairline at low contrast.
- **Depth comes from light, not lines** — gradients, blur, and glow.

---

## 11. Layer Stacking & Camera

### Canonical stack (back → front)

```
┌─ 6. Grain / vignette / letterbox      ← never animated, ≤4% opacity
├─ 5. Foreground occluders              ← parallax fastest
├─ 4. Primary content (type, product)   ← the subject
├─ 3. Light sources & glow              ← behind subject, additive
├─ 2. Atmospheric haze / radial bloom   ← gives the void volume
└─ 1. Background gradient               ← parallax slowest / static
```

Compose this with `<AbsoluteFill>` per layer. **One concern per layer** — a layer
that handles both background and content will fight you the moment the camera
moves.

### Parallax law

Layer velocity is inversely proportional to perceived depth:

```
v_layer = v_camera × (1 / depth)
```

Practical multipliers against camera movement: background `0.1–0.2×`,
mid-ground `0.4–0.6×`, subject `1.0×`, foreground `1.3–1.8×`.

### Camera moves

Wrap all layers in a single **camera** `<AbsoluteFill>` and transform *that*,
never the individual layers:

```tsx
<AbsoluteFill style={{
  transform: `translateX(${tx}px) translateY(${ty}px) scale(${scale})`,
  transformOrigin: "center center",
}}>
```

- **Order matters:** `translate` then `scale`. Translation is applied in screen
  px *after* scaling, so a pan computed for scale 1 must be multiplied by S.
- **To lock a content point to screen center at scale S:**
  `translateX = −(contentX − viewportCenterX) × S`
- **Push/pull** (scale) reads as emphasis. **Pan** reads as narrative — it says
  "there is more over here."
- **Never move the camera and the subject simultaneously** unless you are
  explicitly tracking; the eye can't resolve both.
- Camera moves use `Gentle`, `cinematicGlide`, or a `deceleration` curve. A
  camera that stops abruptly reads as a mistake unless it's a deliberate snap.

### Sequencing

Use `<Sequence>` / `<Series>` so each beat owns its own frame-zero — never
subtract offsets by hand across a long timeline.

```tsx
<Series>
  <Series.Sequence durationInFrames={ms(2500)}><Beat1 /></Series.Sequence>
  <Series.Sequence durationInFrames={ms(1500)}><Beat2 /></Series.Sequence>
</Series>
```

---

## 12. Glow, Gradient & Atmosphere

Apple's dark keynote look is built from **light**, not from strokes.

### Background gradient

Multi-stop vertical gradient plus a radial bloom behind the subject:

```css
background:
  radial-gradient(65% 45% at 50% 60%, rgba(42,112,222,0.35), transparent 72%),
  linear-gradient(180deg,
    #010208 0%, #04091a 42%, #0d3172 74%, #2f6ac2 90%, #6ea6dd 100%);
```

Use **4+ stops**. Two-stop gradients band visibly at 1080p and read as cheap.

### Text gradient (subtle internal fill)

```css
background-image: linear-gradient(180deg, #ffffff 0%, #eaf1fb 52%, #cdddf5 100%);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
```

The gradient should be *barely* perceptible — a hint of cooling toward the
baseline, not a rainbow.

### Neon glow — layered, never single

Real light falls off across multiple radii. Always stack a tight bright core
with a wide dim halo:

```css
/* Emissive object (light source) */
box-shadow:
  0 0 12px 2px rgba(0,127,255,0.8),   /* tight core  */
  0 0 24px 8px rgba(0,127,255,0.4);   /* wide halo   */

/* Illuminated text (receiving ambient light) */
filter:
  drop-shadow(0 0 18px rgba(150,190,255,0.45))
  drop-shadow(0 0 42px rgba(60,120,230,0.30));
```

**Glow laws:**
- Use `box-shadow` for rectangular emitters; `filter: drop-shadow()` for text and
  irregular shapes (it follows the alpha channel, `text-shadow` does not stack
  as cleanly).
- Opacity falls off as radius grows — a wide halo at high opacity reads as fog.
- The glow color should be *lighter and less saturated* than the emitter.
- **Never animate `blur()` radius.** Animate opacity or scale of a pre-blurred
  layer instead — blur is per-frame expensive and won't hit render budget.

---

## 13. Accessibility & Safety

- **Reduced motion:** when honoring `prefers-reduced-motion`, sliding transitions
  become **crossfades** (opacity only), parallax is removed, springs become
  250ms `ease-out` fades, and scale transforms are dropped. In interactive
  builds this is required for App Store compliance.
- **Flashing:** never exceed **3 flashes per second**. High-contrast strobing is
  a seizure risk and will fail platform review.
- **Contrast:** ≥ 4.5:1 body, ≥ 3:1 large type — check against the *brightest and
  darkest* frame the text appears over, not just one still.
- **Legibility hold:** any text the viewer must read needs ≥ 400ms fully
  on-screen and static. Reading speed does not scale with your edit.
- **Caption safety:** keep essential content out of the bottom 120px and top
  120px — platform chrome sits there.

---

## 14. Performance & Render Rules

- **Animate compositor properties only:** `transform` and `opacity`.
- **Never animate layout properties:** `width`, `height`, `top`, `left`,
  `margin`, `padding`. They force layout on every frame.
- **Never animate large `blur()` / `backdrop-filter` surfaces.** Pre-blur and
  animate opacity or scale.
- **Never apply `will-change` outside an active animation.**
- **Gate on fonts.** Use `delayRender()` / `continueRender()` around
  `document.fonts.ready` before any text measurement. Un-gated measurement
  silently measures the fallback font.
- **Round glyph counts.** Reveal whole characters; fractional widths jitter.
- **Never use `useEffect` for anything expressible as render logic.** In a
  frame-based renderer, every frame is a pure function of `frame` — state that
  persists across frames is a bug.

---

## 15. Anti-Patterns

**Motion**
- Bouncy overshoot on UI-like elements (Apple springs do not overshoot)
- Remotion's default spring config, shipped unchanged
- `linear` easing on entrances
- Un-clamped `interpolate` (invisible or blown-out frames)
- Two full-screen transitions at once
- Animating for decoration with no communicative purpose
- Mixed spatial metaphors (a sheet that arrives from the left)
- Stagger on elements that form a single unit

**Type**
- Default tracking on large display type
- Negative tracking on small text
- More than two weights in one composition
- Hierarchy expressed through color instead of size/weight
- Text reflowing mid-animation

**Visual**
- Two-stop gradients (visible banding at 1080p)
- Single-radius glow
- Harsh borders and outlines
- Neon or heavy gradients used as decoration rather than as light
- Dense, cluttered frames — more than one idea at a time

---

## 16. Copy-Paste Snippets

### `src/motion.ts` — the shared motion module

```ts
import { Easing } from "remotion";

/** Apple HIG duration scale, in milliseconds. */
export const DURATION = {
  instant: 0,
  fast: 150,
  snap: 200,
  default: 300,
  slow: 400,
  slower: 500,
} as const;

/** Apple HIG easing curves. */
export const EASE = {
  out:          Easing.bezier(0.33, 1, 0.68, 1),
  in:           Easing.bezier(0.32, 0, 0.67, 0),
  inOut:        Easing.bezier(0.65, 0, 0.35, 1),
  deceleration: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  linear:       Easing.linear,
} as const;

/** Apple HIG springs. None of these overshoot. */
export const SPRING = {
  default: { stiffness: 300, damping: 30, mass: 1 },
  snappy:  { stiffness: 500, damping: 40, mass: 1 },
  gentle:  { stiffness: 170, damping: 26, mass: 1 },
  tight:   { stiffness: 700, damping: 60, mass: 1 },
} as const;

/** House extension — camera only, deliberately underdamped. */
export const CAMERA_SPRING = {
  cinematicSnap:  { stiffness: 220, damping: 14, mass: 0.9 },
  cinematicGlide: { stiffness: 120, damping: 20, mass: 1 },
} as const;

/** Stagger delays, in milliseconds. */
export const STAGGER = {
  listRow: 25,
  gridCard: 30,
  icon: 20,
  word: 50,
} as const;

/** fps-independent timing: milliseconds → frames. */
export const msToFrames = (ms: number, fps: number) => Math.round((ms / 1000) * fps);
```

### Fade + slide entrance

```tsx
const enter = interpolate(frame, [0, ms(DURATION.default)], [0, 1], {
  easing: EASE.out,
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

<div style={{
  opacity: enter,
  transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
}} />
```

### Spring-driven hero move

```tsx
const p = spring({ frame: frame - START, fps, config: SPRING.gentle });

<div style={{
  transform: `translateY(${interpolate(p, [0, 1], [120, 0])}px) ` +
             `scale(${interpolate(p, [0, 1], [0.9, 1])})`,
}} />
```

### Word stagger

```tsx
{words.map((w, i) => {
  const p = spring({
    frame: frame - START - i * msToFrames(STAGGER.word, fps),
    fps,
    config: SPRING.default,
  });
  return (
    <span key={i} style={{
      display: "inline-block",
      opacity: p,
      transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)`,
    }}>{w}</span>
  );
})}
```

### Font-gated text measurement

```tsx
const [handle] = useState(() => delayRender("measure-font"));

useEffect(() => {
  document.fonts.load(`600 ${SIZE}px "Inter"`)
    .then(() => document.fonts.ready)
    .then(() => {
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.font = `600 ${SIZE}px Inter, sans-serif`;
      setWidth(ctx.measureText(TEXT).width + TRACKING * TEXT.length);
      continueRender(handle);
    });
}, [handle]);
```

---

## 17. Provenance & Deliberate Deviations

**Sources merged into this document:**

| Source | Contribution |
|---|---|
| *Apple HIG Motion System* (DesignMD) | Duration scale, easing curves, all four spring configs, stagger patterns, enter/exit patterns, interaction states, reduced-motion rules |
| *Apple Design Skill* (HIG/SwiftUI) | Clarity / Deference / Depth pillars, semantic type hierarchy, accessibility and contrast thresholds |
| *Apple UI Designer* role brief | Design philosophy, "motion explains hierarchy, not decorates", the avoid list, prefer-removal decision rules |
| *Apple UI Skills* token dump | Inter as the type family, compositor-props-only performance rules, focus/disabled state conventions |
| *Emil Kowalski — `apple-design` + `animate` skills* | §7 in full: Apple's exact damping/response UI springs, the stronger UI-grade easing curves, UI component durations and enter/exit geometry, the "name the purpose" gate, `scale(0.95)`-not-`scale(0)`, and the size-specific tracking/leading discipline folded into §9 |

Spring settle times, damping ratios, and easing graphs in §4–5 and §7 were
**computed directly** with Remotion's `measureSpring` and a cubic-bezier sampler
rather than copied — including the Apple damping/response → Remotion
stiffness/damping/mass conversions in §7, which are verified against this repo's
renderer.

### Why both a HIG set (§4–5) and a UI set (§7)

The two easing/spring families are kept **side by side on purpose**, not
reconciled into one. The HIG curves and springs (§4–5) are tuned for **cinematic
and ambient** motion — camera, type reveals, atmosphere. Emil's UI-grade curves
and Apple's damping/response springs (§7) are tuned for **rendered interface
elements** — a button, a sheet, a toast inside the frame. They agree on the
essentials (no overshoot by default; never `ease-in` on entrances;
`transform`/`opacity` only) and diverge only where the medium demands it (UI
controls stay < 300ms; cinematic beats run longer). Pick by what you're
animating, per the guidance at the top of §7.

### What was deliberately **not** carried over

The *Apple UI Skills* files (`SKILL2.md` / `SKILL3.md`, which are byte-identical
duplicates of one another) are auto-scraped token dumps and contain artifacts
that would actively damage this work. Excluded, with reasons:

| Excluded rule | Why |
|---|---|
| `text-primary: #808080`, `surface-raised: #0858DC` | Scraper artifacts. A mid-gray for headings fails contrast and is not Apple; a saturated blue for card surfaces is a mis-read. Apple's real ink is `#1d1d1f`. |
| "NEVER add animation unless explicitly requested" | A guardrail for UI agents. In a motion-graphics repo, animation *is* the deliverable. |
| "NEVER exceed 200ms for interaction feedback" | Correct for UI micro-feedback, wrong for cinematic transitions, which run 300–500ms by Apple's own scale. |
| "NEVER modify letter-spacing" | Directly contradicts Apple display typography, which depends on tight negative tracking on large type (see §9). |
| Light-mode-only palette; 1920px viewport; 21px radius scale | Web-page constraints. This repo renders 1080×1920 vertical video, frequently dark. |
| Fixed "51px/700 headings, 27px/500 body" | Scraped from one page at one breakpoint. §9 supplies a real scale for a 1080-wide vertical canvas. |
| Emil's gesture/interaction *machinery* — pointer capture, velocity handoff, momentum projection, interruptibility, rubber-banding, `backdrop-filter` materials, `prefers-reduced-motion` / `@media (hover)` gating | Load-bearing in a live app, **inert in a render** — there is no finger, no interrupt, no live media query. §7's "What is inert in a render" table keeps their *visible result* (keyframe it) and drops the mechanism. Ship the mechanism only when the deliverable is an actual component, not a video. |

The **4px spacing grid** was kept in spirit (all spacing on a 4px multiple,
8px preferred for larger gaps) since it survives the change of medium.

---

*Reference this file at the start of every motion iteration. If a composition
departs from it, say so explicitly and give the reason in the component's
doc comment.*
