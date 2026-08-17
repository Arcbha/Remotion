import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "@fontsource/inter/600.css";
import {
  CAMERA_SPRING,
  CLAMP,
  EASE,
  UI_DURATION,
  UI_EASE,
  cameraTransform,
  lockToCenterX,
  useMs,
} from "./motion";
import {
  atmosphere,
  cinematic,
  fonts,
  neonBloom,
  textGlow,
  textGradient,
  tracking,
  typeScale,
} from "./theme";

/**
 * "starts defining you." — cinematic dark-mode typewriter with a macro camera.
 * 9:16 (1080×1920), 60fps, 4.0s (240 frames).
 *
 * Three phases:
 *   1 · 0–150   Camera holds at 5× macro. The phrase types out and the camera
 *               pans left so the neon rod stays locked to the exact centre of
 *               the viewport (`lockToCenterX`).
 *   2 · 150     Violent snap — `CAMERA_SPRING.cinematicSnap` slams scale 5 → 1
 *               and translateX → 0.
 *   3 · 150–240 Static hold at scale 1, rod blinking on a 5-frame cadence.
 *
 * All easing, springs and durations come from `src/motion.ts`; all colour,
 * gradient and glow tokens from `src/theme.ts`. No values are authored here.
 *
 * Deviations from APPLE_MOTION.md (§5):
 * - The camera snap uses the deliberately underdamped `CAMERA_SPRING.cinematicSnap`
 *   (ζ 0.50) rather than a HIG spring, which never overshoots. This is the
 *   sanctioned house extension for camera moves and is the source of the slam.
 * - That spring peaks at 1.165, so across the 5→1 scale range its raw overshoot
 *   would undershoot to scale 0.34 — the phrase visibly shrinking to a third
 *   before recovering. `CLAMP` is therefore spread into the camera interpolations
 *   (the repo convention): the slam keeps the spring's violent rise and stops
 *   dead at its target instead of collapsing past it.
 */

const TEXT = "starts defining you.";

const { fontSize: FONT_SIZE, fontWeight: FONT_WEIGHT, lineHeight: LINE_HEIGHT } =
  typeScale.headline;
const LETTER_SPACING = parseFloat(tracking.headline); // −1.5px, applied per glyph

const CURSOR_HEIGHT = FONT_SIZE * LINE_HEIGHT;
const CURSOR_WIDTH = 6;
const GAP = 14; // gap between the text's trailing edge and the rod

// Phase boundaries, in frames (this composition is authored at a fixed 240f/60fps).
const TYPE_START = 0;
const SNAP_FRAME = 150;
const MACRO_SCALE = 5;
const BLINK_PERIOD = 5; // rapid 5-frame cadence during the hold

/**
 * Font-aware glyph metrics. Gated on `document.fonts.ready` via `delayRender`
 * so the advances are measured against Inter 600 and not the fallback face.
 * Builds a cumulative prefix table: `prefix[k]` is the rendered width of the
 * first k characters, including the letter-spacing the browser adds after each.
 */
const useTextMetrics = () => {
  const [handle] = useState(() => delayRender("measure-inter-600"));
  const [prefixes, setPrefixes] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const build = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      ctx.font = `${FONT_WEIGHT} ${FONT_SIZE}px Inter, sans-serif`;
      const table: number[] = [];
      for (let k = 0; k <= TEXT.length; k++) {
        table.push(ctx.measureText(TEXT.slice(0, k)).width + LETTER_SPACING * k);
      }
      if (!cancelled) {
        setPrefixes(table);
        continueRender(handle);
      }
    };

    document.fonts
      .load(`${FONT_WEIGHT} ${FONT_SIZE}px "Inter"`)
      .then(() => document.fonts.ready)
      .then(build)
      .catch(build);

    return () => {
      cancelled = true;
    };
  }, [handle]);

  return prefixes;
};

export const StartsDefining: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ms = useMs();
  const prefixes = useTextMetrics();

  // Hold the frame while glyph metrics resolve (delayRender is still open).
  if (!prefixes) {
    return <AbsoluteFill style={{ background: atmosphere }} />;
  }

  const fullWidth = prefixes[TEXT.length];
  const lineWidth = fullWidth + GAP + CURSOR_WIDTH;

  /* -- Phase 1: the typewriter ------------------------------------------- */
  // Linear reveal — human typing has no easing (APPLE_MOTION.md §9). Whole
  // glyphs only, so the rod lands exactly on the rendered text edge.
  const typedCount = Math.round(
    interpolate(frame, [TYPE_START, SNAP_FRAME], [0, TEXT.length], {
      easing: EASE.linear,
      ...CLAMP,
    })
  );
  const typed = TEXT.slice(0, typedCount);
  const cursorX = prefixes[typedCount]; // trailing edge of the typed text

  /* -- Camera ------------------------------------------------------------- */
  // The stage is centred, so at translateX 0 / scale 1 the full phrase reads
  // dead-centre (Phase 3). During Phase 1 the camera pans so the rod's centre
  // maps onto the viewport centre.
  const stageLeft = width / 2 - lineWidth / 2;
  const cursorCentre = stageLeft + cursorX + GAP + CURSOR_WIDTH / 2;
  const macroX = lockToCenterX(cursorCentre, width / 2, MACRO_SCALE);

  // Phase 2: the violent snap. See the deviation note above for why this is
  // clamped — un-clamped, the spring's 16.5% overshoot collapses scale to 0.34.
  const snap = spring({
    frame: frame - SNAP_FRAME,
    fps,
    config: CAMERA_SPRING.cinematicSnap,
  });

  const scale = interpolate(snap, [0, 1], [MACRO_SCALE, 1], CLAMP);

  // At the snap the phrase is fully typed, so the pan starts from its end position.
  const cursorCentreAtSnap = stageLeft + fullWidth + GAP + CURSOR_WIDTH / 2;
  const macroXAtSnap = lockToCenterX(cursorCentreAtSnap, width / 2, MACRO_SCALE);
  const translateX =
    frame < SNAP_FRAME
      ? macroX
      : interpolate(snap, [0, 1], [macroXAtSnap, 0], CLAMP);

  /* -- The rod ------------------------------------------------------------ */
  // Reveals with the UI ease (it is a rendered interface element), stays solid
  // through the type, then blinks rapidly once the camera settles.
  const reveal = interpolate(frame, [0, ms(UI_DURATION.dropdown)], [0, 1], {
    easing: UI_EASE.out,
    ...CLAMP,
  });
  const blinking = frame >= SNAP_FRAME;
  const blinkOn = Math.floor((frame - SNAP_FRAME) / BLINK_PERIOD) % 2 === 0;
  const cursorOpacity = blinking ? (blinkOn ? 1 : 0) : reveal;

  return (
    <AbsoluteFill style={{ background: atmosphere, fontFamily: fonts.display }}>
      {/* Camera viewport — translate then scale, per APPLE_MOTION.md §11 */}
      <AbsoluteFill
        style={{
          transform: cameraTransform({ x: translateX, scale }),
          transformOrigin: "center center",
        }}
      >
        {/* The full-line stage, centred in the viewport */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: lineWidth,
            height: CURSOR_HEIGHT,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Typed text — clipped internal gradient + ambient neon bleed */}
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              fontWeight: FONT_WEIGHT,
              fontSize: FONT_SIZE,
              lineHeight: LINE_HEIGHT,
              letterSpacing: tracking.headline,
              whiteSpace: "pre",
              backgroundImage: textGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter: textGlow,
            }}
          >
            {typed}
          </span>

          {/* The hero — a thick, illuminated neon rod trailing the text */}
          <div
            style={{
              position: "absolute",
              left: cursorX + GAP,
              top: "50%",
              transform: "translateY(-50%)",
              width: CURSOR_WIDTH,
              height: CURSOR_HEIGHT,
              borderRadius: 2,
              backgroundColor: cinematic.neon,
              opacity: cursorOpacity,
              boxShadow: neonBloom,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
