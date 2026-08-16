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
