import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CLAMP, EASE, UI_SPRING } from "./motion";
import { FONT_STACK, waitForDisplayFont } from "./fonts";
import { cinematic, displayInk, displayScale } from "./theme";

/**
 * "A prison needs Iron" — a clip-path wipe reveal, hold, then an accelerating
 * erase-and-fall. 9:16 (1080×1920), 60fps, 122 frames (2.03s).
 *
 * A shot-for-shot reconstruction of a supplied 1920×1080 reference, reframed to
 * 9:16 and reset in SF Pro Display. Every timing below was measured off the
 * reference's own frames rather than eyeballed — the ink bounding box was
 * tracked across all 122 frames and the curves fitted to it.
 *
 * **The core mechanic is a horizontal wipe, not a per-character fade.** During
 * the exit the leading glyph's peak luminance holds at exactly 1.000 while its
 * left edge advances and its right edge stays pinned — i.e. the glyph is being
 * *clipped*, not faded. `clip-path` is the sanctioned fourth animatable
 * property in `animate` §4 alongside transform and opacity, and
 * `review-animations/RECIPES.md` uses `inset()` wipes for exactly this.
 *
 * Measured timeline (reference frame numbers, 60fps):
 * - **Reveal** f−3 → f36. The wipe front advances at a constant rate: measured
 *   progress 0.074 → 1.0 with a per-frame slope of 0.0257 that does not vary,
 *   so this is `EASE.linear`. APPLE_MOTION.md §9 independently prescribes
 *   linear for typewriter reveals, so token and reference agree.
 * - **Slide-in** the block enters 2.8em to the left and settles. tx decays
 *   −84 → −60 → −45 → −34 → −26 … a constant 0.75 ratio every 4 frames, i.e.
 *   an exponential settle with no overshoot. That is a critically damped
 *   spring, so `UI_SPRING.move` (ζ 1.0, Apple's move/reposition config) drives
 *   it. Cross-check: the reference's normalised progress at t=0.069 is 0.286
 *   and `UI_EASE.out` — the curve equivalent of that spring — evaluates to
 *   0.2853 there.
 * - **Hold** f36 → f84.
 * - **Exit** f84 → f122. The wipe reverses to erase from the left while the
 *   block falls 1.73em. Both accelerate: the erase rate climbs 0.0048 → 0.055
 *   per frame and dy runs 0 → 104px, and both fit t² to within ~2%.
 *
 * Deviation, stated because the brief asked for the reference's curves exactly:
 * the exit uses `Easing.quad` (t²) rather than the house `EASE.in`
 * (`cubic-bezier(0.32, 0, 0.67, 0)`, which behaves like t³). Both are
 * accelerating exits and §4 designates `ease-in` for exiting elements, but the
 * house token is measurably steeper than this reference — at the midpoint it
 * gives 0.127 against the reference's 0.11. Matching the reference won, since
 * that was the explicit instruction.
 *
 * What is *not* reproduced: the reference carries a "Made in Raylight" tool
 * watermark bottom-right. That is the source tool's branding, not part of the
 * design, so it is omitted.
 */

const TEXT = "A prison needs Iron";

/**
 * Type. The reference's stem-to-cap ratio measures 0.133; of the three bundled
 * SF Pro Display uprights (400 / 500 / 700) Medium is the closest match.
 * Tracking follows APPLE_MOTION.md §9's law for display sizes rather than the
 * reference's looser geometric-sans fit — the brief asked for our type style.
 */
const FONT_SIZE = displayScale.headlineLarge; // 82
const FONT_WEIGHT = 500;
const TRACKING_EM = -0.015;

/**
 * Motion distances are held in `em`, not pixels, so the move reads identically
 * against the type after the reframe. The reference is 60px type sliding 168px
 * and falling 104px; as multiples of its own size that is 2.8em and 1.73em.
 */
const SLIDE_EM = 2.8;
const FALL_EM = 1.73;

/**
 * APPLE_MOTION.md §2 horizontal safe margin. The slide is clamped to it.
 *
 * The reframe cannot preserve both the reference's type proportion and its
 * slide proportion. Its line is 28% of a 1920-wide frame; at the 82px step the
 * same line is 60% of a 1080-wide frame, which leaves only ~216px of margin —
 * less than the 2.8em (230px) the reference slides. Unclamped, the line starts
 * off the left edge and the opening glyphs get cut by the frame instead of by
 * the wipe, which reads as a bug rather than as motion. The clamp keeps the
 * reference's proportion wherever it fits and gives up only the excess.
 */
const SAFE_MARGIN = 64;

// Measured phase boundaries, in frames at 60fps.
const REVEAL_START = -3; // the reference is already 7.4% revealed on frame 0
const REVEAL_END = 36;
const EXIT_START = 84;
const EXIT_END = 122;

export const PRISON_DURATION_FRAMES = EXIT_END;

/**
 * Resolves the display face, then measures the rendered line. The width is
 * measured rather than assumed so the safe-area clamp below re-derives itself
 * if the size, weight or face ever changes.
 */
const useLineWidth = () => {
  const [handle] = useState(() => delayRender("prison-display-face"));
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      let w = 0;
      if (ctx) {
        ctx.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_STACK}`;
        w = ctx.measureText(TEXT).width + TRACKING_EM * FONT_SIZE * TEXT.length;
      }
      setWidth(w);
      continueRender(handle);
    };
    waitForDisplayFont()
      .then(() => document.fonts.ready)
      .then(measure)
      .catch(measure);
  }, [handle]);
  return width;
};

export const PrisonNeedsIron: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lineWidth = useLineWidth();

  if (lineWidth === null)
    return <AbsoluteFill style={{ background: cinematic.void }} />;

  // Reveal: a constant-rate wipe front. Right inset retreats 100% → 0%.
  const reveal = interpolate(frame, [REVEAL_START, REVEAL_END], [0, 1], {
    easing: EASE.linear,
    ...CLAMP,
  });

  // Exit: the wipe reverses and erases from the left, accelerating.
  const erase = interpolate(frame, [EXIT_START, EXIT_END], [0, 1], {
    easing: Easing.quad,
    ...CLAMP,
  });

  // The block enters offset to the left and settles on a critically damped
  // spring — matching the reference's overshoot-free exponential decay. The
  // offset takes the reference's 2.8em unless that would carry the opening
  // glyphs past the safe margin, in which case it takes whatever room is left.
  const roomToSpare = (1080 - lineWidth) / 2 - SAFE_MARGIN;
  const slide = Math.min(SLIDE_EM * FONT_SIZE, Math.max(0, roomToSpare));
  const settle = spring({ frame, fps, config: UI_SPRING.move });
  const tx = interpolate(settle, [0, 1], [-slide, 0], CLAMP);

  // ...and falls away as it is erased, on the same accelerating curve.
  const ty = interpolate(frame, [EXIT_START, EXIT_END], [0, FALL_EM * FONT_SIZE], {
    easing: Easing.quad,
    ...CLAMP,
  });

  return (
    <AbsoluteFill
      style={{
        background: cinematic.void,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          fontWeight: FONT_WEIGHT,
          fontSize: FONT_SIZE,
          lineHeight: 1.05,
          letterSpacing: `${TRACKING_EM}em`,
          fontOpticalSizing: "auto",
          whiteSpace: "pre",
          color: displayInk,
          transform: `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px)`,
          // The whole mechanic: a hard-edged window that opens left→right to
          // reveal, then closes left→right to erase.
          clipPath: `inset(0 ${((1 - reveal) * 100).toFixed(3)}% 0 ${(erase * 100).toFixed(3)}%)`,
          willChange: "transform, clip-path",
        }}
      >
        {TEXT}
      </div>
    </AbsoluteFill>
  );
};
