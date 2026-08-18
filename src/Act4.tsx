import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CAMERA_SPRING,
  CLAMP,
  DURATION,
  EASE,
  STAGGER,
  UI_EASE,
  msToFrames,
  staggerFrames,
} from "./motion";
import { DISPLAY_WEIGHT, FONT_STACK, waitForDisplayFont } from "./fonts";
import {
  displayInk,
  displayScale,
  inertVoid,
  keynoteShadow,
  systemGray,
} from "./theme";

/**
 * Act 4 — "not enough", multiplying until it suffocates the frame.
 * 9:16 (1080×1920), 60fps, 516 frames (8.60s, dictated by the timing math below).
 *
 * A single seed phrase holds alone, then doubles across six phases
 * (1 → 2 → 4 → 8 → 16 → 32) with the gap between phases collapsing each time.
 * Copies stack downward, decaying in size and colour, until the frame is a wall
 * of the same sentence. The composition then damps into stillness.
 *
 * Everything here resolves from the local rule set — no invented curve, no
 * literal colour, no `Math.random()`:
 *
 * - **Ground** `inertVoid` (theme.ts), built only from the `cinematic` void
 *   palette. This act has no light source, so it carries no bloom, floor glow
 *   or accent.
 * - **Entrance curve** `UI_EASE.out` = `cubic-bezier(0.23, 1, 0.32, 1)`,
 *   imported from `src/motion.ts` as specified. Note this departs from
 *   CLAUDE.md's "type reveals → cinematic `EASE`" default; the brief names
 *   `UI_EASE` explicitly, and CLAUDE.md permits an explicit override.
 * - **Entrance geometry** opacity 0→1 with `translateY(−8px)→0` over 200ms
 *   (`DURATION.snap`), plus `scale(0.97)→1`. The 8px offset is
 *   `review-animations/STANDARDS.md` §Stagger; its sign is inverted so a copy
 *   is pulled down out of the row above rather than rising from below. Nothing
 *   pops from nothing — `animate` §4 and `improve-animations/AUDIT.md` both
 *   require `scale(0.9–0.97)` + `opacity: 0` rather than a 0-frame appearance.
 *   In `animation-vocabulary` terms this is *a stagger of scale-in entrances*.
 * - **Phase cadence** the `DURATION` scale walked downward —
 *   slower→slow→default→snap→fast — so each wave lands sooner than the last.
 * - **Row cadence** `STAGGER.gridCard` (30ms), applied to *every* child of a
 *   batch. This deliberately drops APPLE_MOTION.md §8's cap-at-8: with the cap,
 *   the eight tail rows of a 16-row batch share one delay and land together,
 *   which is the "everything-at-once" entrance `review-animations` blocks. The
 *   cap exists so a long list does not read as lag; here the overlapping waves
 *   are the subject, so the whole batch cascades.
 * - **Type** SF Pro Display Bold on the §9 ladder, decaying from the 96px Hero
 *   step down to the 24px Caption floor — §9 sets no smaller step. Row pitch is
 *   *solved* so the stack spans the safe area exactly, which lands it at 0.898:
 *   below the measured 0.9219em ink height of the phrase, so descenders graze
 *   the ascenders beneath them and the wall closes up with no visible gaps.
 * - **Tracking** the §9 tracking law applied *per row*: −0.015em at display
 *   sizes, −0.008em at subhead, 0 at body and below. `apple-design` §15 is
 *   explicit that "a fixed `letter-spacing` is wrong somewhere" — carrying the
 *   display value down to the 24px rows would wreck exactly the legibility this
 *   act depends on.
 * - **Depth** `keynoteShadow`, one ambient cast shadow over the whole stack.
 *   No bevel, emboss or inner shadow, and one filter pass rather than 32.
 * - **Settle** `CAMERA_SPRING.cinematicGlide` (ζ 0.91, no overshoot) damps the
 *   stack to rest, then a micro-drift keeps it breathing so the hold never
 *   dead-stops.
 *
 * Contrast is the hard constraint, verified rather than assumed: the dimmest,
 * smallest row is `systemGray` on `cinematic.void` at **5.72:1**, which clears
 * APPLE_MOTION.md §13's stricter 4.5:1 body bar (not merely the 3:1 large-type
 * bar). Decay is carried by colour alone — opacity settles to 1 — because
 * stacking a persistent opacity on top would composite the type toward the
 * ground and turn the bottom rows into the fog the brief forbids.
 */

const PHRASE = "not enough";

/* -- Layout ---------------------------------------------------------------- */

const ROWS = 32; // 2^5, the final phase
const PHASES = 6; // 1 → 2 → 4 → 8 → 16 → 32

/**
 * §9 display-ladder endpoints: Hero display down to the Caption floor.
 *
 * The seed sits on `hero` (96) because the row pitch is *solved*, not set — see
 * {@link PITCH}. Filling the safe area with 32 rows decaying 96 → 24 forces a
 * pitch of 0.898, which is the crushed leading this act needs. A smaller seed
 * leaves the same 32 rows spread over the same height, i.e. looser: 82 solves
 * to 0.989 and 64 to 1.147, both of which read as a list rather than a wall.
 */
const SEED_SIZE = displayScale.hero; // 96
const FLOOR_SIZE = displayScale.caption; // 24 — §9 sets no smaller step

/** Seed sits high in the frame; the stack grows down to the §13 safe margin. */
const STACK_TOP = 300;
const SAFE_BOTTOM = 120;

/**
 * Sizes decay geometrically from the seed to the floor. The ratio is solved
 * from the endpoints rather than picked, so changing either end re-derives the
 * whole stack.
 */
const DECAY = Math.pow(FLOOR_SIZE / SEED_SIZE, 1 / (ROWS - 1));
const SIZES = Array.from({ length: ROWS }, (_, i) => SEED_SIZE * Math.pow(DECAY, i));

/**
 * Row pitch as a multiple of each row's own size, solved so the stack spans the
 * safe area exactly. It lands just under 1.0 — tighter than the §9 leading of
 * 1.05 — which is what gives the wall its airless feel.
 */
const PITCH =
  (1920 - STACK_TOP - SAFE_BOTTOM) / SIZES.reduce((a, b) => a + b, 0);

/** Cumulative top offset per row. */
const TOPS = SIZES.reduce<number[]>((acc, size, i) => {
  acc.push(i === 0 ? STACK_TOP : acc[i - 1] + SIZES[i - 1] * PITCH);
  return acc;
}, []);

/** APPLE_MOTION.md §9 tracking law, resolved against each row's own size. */
const trackingEmFor = (size: number) =>
  size >= 64 ? -0.015 : size >= 40 ? -0.008 : 0;

/** The phase a row belongs to: row 0 is the seed, then each phase doubles. */
const phaseOf = (row: number) => (row === 0 ? 0 : Math.floor(Math.log2(row)) + 1);

/* -- Timing ---------------------------------------------------------------- */

/**
 * The gap before each successive phase, walked down the `DURATION` scale. The
 * cadence accelerates because the scale itself descends — no invented numbers.
 */
const PHASE_GAPS_MS = [
  DURATION.slower,
  DURATION.slow,
  DURATION.default,
  DURATION.snap,
  DURATION.fast,
];

/**
 * The seed holds alone for exactly as long as the entire cascade will take.
 * Self-referential rather than arbitrary, and it satisfies §3's "hold before
 * you cut" with room to spare — this is the act's only quiet beat.
 */
const ESTABLISH_MS = PHASE_GAPS_MS.reduce((a, b) => a + b, 0);

const ENTER_MS = DURATION.snap; // 200ms
const SETTLE_MS = 5000;

const phaseStartMs = (() => {
  const out = [0];
  for (let k = 1; k < PHASES; k++) {
    out.push(out[k - 1] + PHASE_GAPS_MS[k - 1] + (k === 1 ? ESTABLISH_MS : 0));
  }
  return out;
})();

/** The frame the last row of the last phase finishes arriving. */
export const wallCompleteMs =
  phaseStartMs[PHASES - 1] +
  (ROWS / 2 - 1) * STAGGER.gridCard +
  ENTER_MS;

export const ACT4_DURATION_MS = wallCompleteMs + SETTLE_MS;

/* -- Entrance -------------------------------------------------------------- */

/**
 * Entrance offset. Negative: a new copy is *pulled down out of* the row above
 * it rather than rising from below, so the wall reads as growing downward under
 * its own weight. `review-animations/STANDARDS.md` §Stagger specifies an 8px
 * offset; only its sign is inverted here to match the direction of growth.
 */
const RISE_PX = -8;
/** `animate` §4: start from 0.9–0.97, never 0. */
const ENTER_SCALE = 0.97;

/** The stack is fractionally pressurised while building, then damps to rest. */
const PRESSURE = 1.006;
/** A last, almost-subliminal creep so the hold never reads as a freeze-frame. */
const DRIFT_TO = 0.997;

/** Blocks the frame until the display face resolves. */
const useDisplayFont = () => {
  const [handle] = useState(() => delayRender("act4-display-face"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    waitForDisplayFont()
      .then(() => document.fonts.ready)
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
};

export const Act4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ready = useDisplayFont();

  if (!ready) return <AbsoluteFill style={{ background: inertVoid }} />;

  const ms = (v: number) => msToFrames(v, fps);
  const enterFrames = ms(ENTER_MS);
  const wallCompleteF = ms(wallCompleteMs);

  /* -- Settle: spring damp, then micro-drift ------------------------------- */
  const damp = spring({
    frame: frame - wallCompleteF,
    fps,
    config: CAMERA_SPRING.cinematicGlide,
  });
  const settleScale = interpolate(damp, [0, 1], [PRESSURE, 1], CLAMP);

  const driftStart = wallCompleteF + ms(600);
  const driftScale = interpolate(
    frame,
    [driftStart, ms(ACT4_DURATION_MS)],
    [1, DRIFT_TO],
    { easing: EASE.inOut, ...CLAMP }
  );

  const stackScale = settleScale * driftScale;

  return (
    <AbsoluteFill style={{ background: inertVoid }}>
      {/* One ambient cast shadow for the whole wall — a single filter pass
          rather than 32, per APPLE_MOTION.md §14. */}
      <AbsoluteFill
        style={{
          transform: `scale(${stackScale.toFixed(5)})`,
          transformOrigin: "center center",
          filter: keynoteShadow,
        }}
      >
        {SIZES.map((size, row) => {
          const phase = phaseOf(row);
          // Index of this row within its own phase drives the stagger.
          const indexInPhase = phase === 0 ? 0 : row - Math.pow(2, phase - 1);
          const startF =
            ms(phaseStartMs[phase]) +
            staggerFrames(indexInPhase, STAGGER.gridCard, fps, ROWS);

          const p = interpolate(frame, [startF, startF + enterFrames], [0, 1], {
            easing: UI_EASE.out,
            ...CLAMP,
          });

          // Decay is carried by colour, so the settled type never loses contrast.
          const decay = row / (ROWS - 1);
          const color = interpolateColors(
            decay,
            [0, 1],
            [displayInk, systemGray]
          );

          return (
            <div
              key={row}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: TOPS[row],
                textAlign: "center",
                fontFamily: FONT_STACK,
                fontWeight: DISPLAY_WEIGHT,
                fontSize: size,
                lineHeight: PITCH,
                letterSpacing: `${trackingEmFor(size)}em`,
                fontOpticalSizing: "auto",
                whiteSpace: "pre",
                color,
                opacity: p,
                transform:
                  `translateY(${interpolate(p, [0, 1], [RISE_PX, 0]).toFixed(3)}px) ` +
                  `scale(${interpolate(p, [0, 1], [ENTER_SCALE, 1]).toFixed(5)})`,
                willChange: p > 0 && p < 1 ? "transform, opacity" : undefined,
              }}
            >
              {PHRASE}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
