/**
 * Shared motion tokens — Apple Human Interface Guidelines.
 *
 * The canonical reference for every value here is `APPLE_MOTION.md` at the repo
 * root. Import from this module rather than re-typing magic numbers, so a
 * change to the system propagates to every composition.
 *
 * Spring settle times and damping ratios quoted below were measured with
 * Remotion's `measureSpring` against this renderer — see APPLE_MOTION.md §5.
 */

import { Easing, useVideoConfig } from "remotion";

/* -------------------------------------------------------------------------- */
/* Timing                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Apple's duration scale, in milliseconds. Durations are authored in ms (not
 * frames) so a composition survives an fps change — convert with `msToFrames`.
 */
export const DURATION = {
  /** Direct manipulation, state changes that follow a finger. */
  instant: 0,
  /** Small icon transitions, badge updates, tooltips — and most exits. */
  fast: 150,
  /** Popovers, context menus, scale-pop entrances. */
  snap: 200,
  /** Standard push/pop, modal present, sheet dismiss. The workhorse. */
  default: 300,
  /** Full-screen transitions, hero/magic-move, splash fade. */
  slow: 400,
  /** Hero zooms, onboarding sequences, title cards. */
  slower: 500,
} as const;

/** Milliseconds → frames. Round-trips cleanly at any fps. */
export const msToFrames = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

/**
 * Hook form of {@link msToFrames}, bound to the current composition's fps.
 *
 * ```ts
 * const ms = useMs();
 * const enter = interpolate(frame, [0, ms(DURATION.default)], [0, 1], ...);
 * ```
 */
export const useMs = () => {
  const { fps } = useVideoConfig();
  return (ms: number) => msToFrames(ms, fps);
};

/* -------------------------------------------------------------------------- */
/* Easing                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Apple's five easing curves. Reserve these for non-interactive or ambient
 * motion — anything that reads as touched, dragged or thrown should use a
 * spring from {@link SPRING} instead.
 */
export const EASE = {
  /** Non-spring elements entering — alerts, static overlays. */
  out: Easing.bezier(0.33, 1, 0.68, 1),
  /** Elements exiting — UI the viewer is leaving behind. */
  in: Easing.bezier(0.32, 0, 0.67, 0),
  /** Repositioning, crossfades between states of one element. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Entering from off-screen. Apple's preferred entrance — a physical throw. */
  deceleration: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  /** Progress, spinners, marquees, typewriter character reveals. */
  linear: Easing.linear,
} as const;

/**
 * Default `interpolate` options. Un-clamped interpolation overshoots off the
 * ends of its range and is the most common cause of invisible or blown-out
 * frames — spread this into every call.
 */
export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/* -------------------------------------------------------------------------- */
/* Springs                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Apple's four canonical springs.
 *
 * None of these overshoot — every config sits at or past critical damping
 * (ζ ≥ 0.87). Apple motion is fast and authoritative, never bouncy. If an
 * animation visibly rebounds past its target, it is not Apple-like.
 *
 * Do **not** fall back to Remotion's default config (100/10/1): it is ζ = 0.50,
 * overshoots 16.3%, and takes 933ms to settle.
 */
export const SPRING = {
  /** ζ 0.87 · 90% in 12f, settles 17f @60fps. Push/pop, modals. The workhorse. */
  default: { stiffness: 300, damping: 30, mass: 1 },
  /** ζ 0.89 · 90% in 10f, settles 15f @60fps. Gesture-matched, interactive dismiss. */
  snappy: { stiffness: 500, damping: 40, mass: 1 },
  /** ζ 1.00 · 90% in 18f, settles 34f @60fps. Large elements, hero/magic-move. */
  gentle: { stiffness: 170, damping: 26, mass: 1 },
  /** ζ 1.13 · 90% in 9f, settles 17f @60fps. Button press release, haptic-paired. */
  tight: { stiffness: 700, damping: 60, mass: 1 },
} as const;

/**
 * House extension — deliberately underdamped, for the **camera only**.
 *
 * HIG has no concept of a camera, so these are not Apple values. Never use them
 * for UI-like content inside the frame; a composition that reaches for one
 * should say so in its doc comment.
 */
export const CAMERA_SPRING = {
  /** ζ 0.50 · violent slam with visible overshoot. Macro-to-wide reveals. */
  cinematicSnap: { stiffness: 220, damping: 14, mass: 0.9 },
  /** ζ 0.91 · slow authoritative push, no bounce. Ambient drift. */
  cinematicGlide: { stiffness: 120, damping: 20, mass: 1 },
} as const;

/* -------------------------------------------------------------------------- */
/* Apple UI motion — for interface elements rendered inside a video (§7)        */
/* -------------------------------------------------------------------------- */

/**
 * UI-grade easing curves — stronger than the HIG set in {@link EASE}. Use these
 * when animating a rendered *control* (button, dropdown, sheet, toast); keep
 * {@link EASE} for camera, type reveals, and atmosphere. Never `ease-in` on a
 * UI entrance — it delays the moment the viewer is watching the control respond.
 */
export const UI_EASE = {
  /** Strong ease-out for UI — near-vertical launch, long settle. */
  out: Easing.bezier(0.23, 1, 0.32, 1),
  /** Strong ease-in-out for on-screen moves (tab indicators, repositions). */
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  /** The iOS drawer/sheet curve (Ionic/Vaul) — firm pull, soft arrival. */
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
} as const;

/**
 * Apple's concrete UI springs, given by Apple as (damping ratio, response) and
 * converted here to Remotion's stiffness/damping/mass via
 * `k = (2π/response)²`, `c = 2ζ√k`. Settle times verified with `measureSpring` —
 * see APPLE_MOTION.md §7.
 *
 * Default to `move` (critically damped, no overshoot). Reach for `rotate` /
 * `drawer` (ζ 0.8, ~1.5% overshoot) only when the motion simulates something the
 * user threw — a flicked card, a released drag.
 */
export const UI_SPRING = {
  /** ζ 1.0, response 0.4s → settles 28f (467ms) @60fps, no overshoot. Move/reposition. */
  move: { stiffness: 247, damping: 31, mass: 1 },
  /** ζ 0.8, response 0.4s → settles 28f @60fps, 1.6% overshoot. Rotation, momentum. */
  rotate: { stiffness: 247, damping: 25, mass: 1 },
  /** ζ 0.8, response 0.3s → settles 21f (350ms) @60fps, 1.3% overshoot. Drawers/sheets. */
  drawer: { stiffness: 439, damping: 34, mass: 1 },
} as const;

/**
 * UI component durations, in milliseconds. Rendered controls stay < 300ms — a
 * dropdown that takes 400ms reads as sluggish because the viewer measures it
 * against a real control. (Cinematic beats are the opposite; see DURATION.)
 */
export const UI_DURATION = {
  buttonPress: 160,
  tooltip: 125,
  dropdown: 200,
  modal: 250,
  drawer: 500,
  toast: 400,
} as const;

/**
 * Enter geometry for common UI components. Never `scale(0)` — start from
 * `scaleFrom` + opacity 0. Popovers/dropdowns/tooltips scale from their
 * trigger's anchor (`transformOrigin` at the source), not center; modals are
 * exempt and stay centered.
 */
export const UI_ENTER = {
  buttonPress: { scaleFrom: 0.97 },
  dropdown: { scaleFrom: 0.95, transformOrigin: "trigger" },
  tooltip: { scaleFrom: 0.97, transformOrigin: "trigger" },
  modal: { scaleFrom: 0.96, transformOrigin: "center" },
  /** Sheets translate by their own height — `translateY(100%) → 0`. */
  drawer: { translateY: "100%" },
  toast: { translateY: "100%" },
  /** Per-item entrance offset for a group; pair with STAGGER.word-ish 50ms. */
  staggerItem: { translateY: 8, staggerMs: 50 },
} as const;

/* -------------------------------------------------------------------------- */
/* Stagger                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Stagger delays, in milliseconds. Stagger communicates *grouping* — elements
 * belonging to one unit (a tab bar, a sidebar) must not stagger against each
 * other. Respect the caps: past ~8 items a stagger reads as lag, not rhythm.
 */
export const STAGGER = {
  /** 25ms, max 8 rows. Beyond that, appear together. */
  listRow: 25,
  /** 30ms, max 6 cards. */
  gridCard: 30,
  /** 20ms, waves outward from the interaction origin. */
  icon: 20,
  /** 40–60ms. One line at a time. */
  word: 50,
} as const;

/** Per-item stagger offset in frames, capped so long lists stop lagging. */
export const staggerFrames = (
  index: number,
  delayMs: number,
  fps: number,
  max = 8
) => msToFrames(Math.min(index, max) * delayMs, fps);

/* -------------------------------------------------------------------------- */
/* Camera                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Screen-space X translation that locks a point in content space to the centre
 * of the viewport at a given scale.
 *
 * Translation is applied *after* scaling, so a pan computed at scale 1 must be
 * multiplied by S — that factor is what this helper exists to get right.
 *
 * @param contentX     the point to lock, in unscaled content coordinates
 * @param viewportCenterX  usually `width / 2`
 * @param scale        the camera's current scale
 */
export const lockToCenterX = (
  contentX: number,
  viewportCenterX: number,
  scale: number
) => -(contentX - viewportCenterX) * scale;

/**
 * Builds a camera transform string. Order matters: translate, then scale.
 * Pair with `transformOrigin: "center center"` on the same element.
 */
export const cameraTransform = ({
  x = 0,
  y = 0,
  scale = 1,
}: {
  x?: number;
  y?: number;
  scale?: number;
}) => `translateX(${x}px) translateY(${y}px) scale(${scale})`;

/**
 * Parallax multipliers against camera movement — layer velocity is inversely
 * proportional to perceived depth.
 */
export const PARALLAX = {
  background: 0.15,
  midground: 0.5,
  subject: 1,
  foreground: 1.5,
} as const;

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type SpringConfig = (typeof SPRING)[keyof typeof SPRING];
export type EasingToken = keyof typeof EASE;
export type DurationToken = keyof typeof DURATION;
