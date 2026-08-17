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
 *   1 · 0–150   Camera holds at 5× macro. Characters reveal with a 3-frame
 *               micro-fade while the camera pans so the neon rod stays locked
 *               to the exact centre of the viewport (`lockToCenterX`).
 *   2 · 150     Violent snap — `CAMERA_SPRING.cinematicSnap` slams scale 5 → 1
 *               and translateX → 0, with optical blur tracking the camera's
 *               instantaneous velocity.
 *   3 · 150–240 The rod blinks on a 5-frame cadence; from frame 180 the camera
 *               creeps 1.0 → 0.98 so the scene never dead-stops.
 *
 * All easing, springs and durations come from `src/motion.ts`; all colour,
 * gradient and glow tokens from `src/theme.ts`.
 *
 * Deviations from APPLE_MOTION.md:
 * - §5: the snap uses the deliberately underdamped `CAMERA_SPRING.cinematicSnap`
 *   (ζ 0.50) rather than a HIG spring. This is the sanctioned house extension
 *   for camera moves and is the source of the slam.
 * - §5: that spring peaks at 1.165, so across the 5→1 scale range its raw
 *   overshoot would collapse scale to 0.34 — the phrase visibly shrinking to a
 *   third before recovering. `CLAMP` is spread into the camera interpolations so
 *   the slam keeps the spring's violent rise and stops dead at its target.
 * - §14 ("never animate blur() radius"): the snap animates a `filter: blur()` on
 *   the subject to fake optical motion blur. Deliberate — a 5× zoom-out with no
 *   optical smear reads as a digital jump-cut rather than a camera move. Scoped
 *   to the ~10 frames of the snap and to one small element, so the per-frame
 *   cost stays bounded. The ghost layer's blur is static (transform/opacity only).
 */

const TEXT = "starts defining you.";

const { fontSize: FONT_SIZE, fontWeight: FONT_WEIGHT, lineHeight: LINE_HEIGHT } =
  typeScale.headline;
const LETTER_SPACING = parseFloat(tracking.headline); // −1.5px, applied per glyph

const CURSOR_HEIGHT = FONT_SIZE * LINE_HEIGHT;
const CURSOR_WIDTH = 6;
const GAP = 14; // gap between the text's trailing edge and the rod

// Phase boundaries, in frames (authored at a fixed 240f/60fps).
const TYPE_START = 0;
const SNAP_FRAME = 150;
const DRIFT_START = 180;
const DRIFT_END = 240;

const MACRO_SCALE = 5;
const DRIFT_SCALE = 0.98; // the creeping breath of Phase 3
const BLINK_PERIOD = 5; // rapid 5-frame cadence during the hold
const CHAR_FADE = 3; // frames for a character's micro-fade
const SNAP_BLUR_PEAK = 12; // px, at the camera's maximum velocity

/**
 * Scale of the camera's snap at a given frame past {@link SNAP_FRAME}.
 * Pure, so it doubles as the source for the motion-blur derivative below.
 */
const snapScaleAt = (framesPastSnap: number, fps: number) =>
  interpolate(
    spring({
      frame: framesPastSnap,
      fps,
      config: CAMERA_SPRING.cinematicSnap,
    }),
    [0, 1],
    [MACRO_SCALE, 1],
    CLAMP
  );

/**
 * The largest per-frame scale change across the whole snap, used to normalise
 * the motion blur so it peaks at exactly {@link SNAP_BLUR_PEAK}. Cached per fps
 * — it is a property of the spring, not of the current frame.
 */
let maxDeltaCache: { fps: number; value: number } | null = null;
const maxSnapDelta = (fps: number) => {
  if (maxDeltaCache?.fps === fps) return maxDeltaCache.value;
  let max = 0;
  for (let f = 1; f <= 120; f++) {
    const d = Math.abs(snapScaleAt(f, fps) - snapScaleAt(f - 1, fps));
    if (d > max) max = d;
  }
  maxDeltaCache = { fps, value: max };
  return max;
};

/**
 * Font-aware glyph metrics, gated on `document.fonts.ready` via `delayRender`
 * so advances are measured against Inter 600 and not the fallback face.
 *
 * Advances are measured **per character** and summed, rather than measuring the
 * whole string: the micro-fade renders each glyph in its own `<span>`, which
 * suppresses cross-glyph kerning and ligatures. Measuring the same way the text
 * is rendered keeps the rod exactly on the text's trailing edge — measuring the
 * full run would leave the cursor drifting a few px off as the phrase grows.
 * The rendered spans set `fontKerning`/`fontVariantLigatures` to none to match.
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
      const table: number[] = [0];
      let run = 0;
      for (let i = 0; i < TEXT.length; i++) {
        run += ctx.measureText(TEXT[i]).width;
        table.push(run + LETTER_SPACING * (i + 1));
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

/** Shared glyph styling — the ghost layer and the live text must match exactly. */
const glyphRun: React.CSSProperties = {
  fontWeight: FONT_WEIGHT,
  fontSize: FONT_SIZE,
  lineHeight: LINE_HEIGHT,
  letterSpacing: tracking.headline,
  whiteSpace: "pre",
  fontKerning: "none",
  fontVariantLigatures: "none",
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

  /* -- Phase 1: the typewriter -------------------------------------------- */
  // Linear reveal — human typing has no easing (APPLE_MOTION.md §9). Whole
  // glyphs only, so the rod lands exactly on the rendered text edge.
  const perChar = (SNAP_FRAME - TYPE_START) / TEXT.length;
  const typedCount = Math.round(
    interpolate(frame, [TYPE_START, SNAP_FRAME], [0, TEXT.length], {
      easing: EASE.linear,
      ...CLAMP,
    })
  );
  const cursorX = prefixes[typedCount]; // trailing edge of the typed text

  // Each glyph crosses into the count at (i + 0.5) · perChar; the micro-fade
  // runs from there so a character brightens in rather than popping.
  const charOpacity = (i: number) =>
    interpolate(
      frame,
      [TYPE_START + (i + 0.5) * perChar, TYPE_START + (i + 0.5) * perChar + CHAR_FADE],
      [0, 1],
      { easing: EASE.out, ...CLAMP }
    );

  /* -- Camera -------------------------------------------------------------- */
  // The stage is centred, so at translateX 0 / scale 1 the full phrase reads
  // dead-centre. During Phase 1 the camera pans so the rod's centre maps onto
  // the viewport centre.
  const stageLeft = width / 2 - lineWidth / 2;
  const macroX = lockToCenterX(
    stageLeft + cursorX + GAP + CURSOR_WIDTH / 2,
    width / 2,
    MACRO_SCALE
  );

  const pastSnap = frame - SNAP_FRAME;
  const snapScale = snapScaleAt(pastSnap, fps);

  // Phase 3: a continuous creep so the scene never dead-stops. Multiplied onto
  // the snap's scale, so it is a no-op until DRIFT_START.
  const drift = interpolate(frame, [DRIFT_START, DRIFT_END], [1, DRIFT_SCALE], {
    easing: EASE.inOut,
    ...CLAMP,
  });
  const scale = snapScale * drift;

  // At the snap the phrase is fully typed, so the pan starts from its end position.
  const macroXAtSnap = lockToCenterX(
    stageLeft + fullWidth + GAP + CURSOR_WIDTH / 2,
    width / 2,
    MACRO_SCALE
  );
  const translateX =
    frame < SNAP_FRAME
      ? macroX
      : interpolate(
          spring({ frame: pastSnap, fps, config: CAMERA_SPRING.cinematicSnap }),
          [0, 1],
          [macroXAtSnap, 0],
          CLAMP
        );

  /* -- Phase 2: optical motion blur ---------------------------------------- */
  // Driven by the camera's instantaneous velocity — the per-frame change in
  // scale — so it peaks exactly at the spring's fastest moment and is back to
  // zero the instant the snap reaches 1×.
  const snapBlur =
    frame < SNAP_FRAME
      ? 0
      : (Math.abs(snapScaleAt(pastSnap, fps) - snapScaleAt(pastSnap - 1, fps)) /
          maxSnapDelta(fps)) *
        SNAP_BLUR_PEAK;

  /* -- The rod ------------------------------------------------------------- */
  // Reveals with the UI ease (it is a rendered interface element), stays solid
  // through the type, then blinks rapidly once the camera settles.
  const reveal = interpolate(frame, [0, ms(UI_DURATION.dropdown)], [0, 1], {
    easing: UI_EASE.out,
    ...CLAMP,
  });
  const blinkOn = Math.floor(pastSnap / BLINK_PERIOD) % 2 === 0;
  const cursorOpacity = frame >= SNAP_FRAME ? (blinkOn ? 1 : 0) : reveal;

  const glyphs = TEXT.split("");

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
          {/* Optical anchor — a ghosted, heavily blurred copy of the phrase that
              gives the 82px type visual mass in the void once the camera pulls
              out. Static blur; only its transform and opacity are animated. */}
          <span
            style={{
              ...glyphRun,
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%) scale(1.2)",
              color: "#ffffff",
              opacity: 0.05,
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          >
            {TEXT.slice(0, typedCount)}
          </span>

          {/* Subject — carries the snap's optical blur */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              filter: snapBlur > 0.01 ? `blur(${snapBlur.toFixed(2)}px)` : undefined,
            }}
          >
            {/* Typed text — per-glyph micro-fade over the clipped gradient fill.
                The gradient is clipped on each glyph rather than on the run: a
                child with opacity < 1 gets its own compositing layer, which the
                parent's background-clip:text mask does not reach, so the glyph
                would paint with its inherited transparent fill and vanish until
                opacity hit exactly 1 — turning the fade into a delayed pop.
                The fill is purely vertical and every glyph shares the line box,
                so per-glyph clipping is visually identical to clipping the run. */}
            <span
              style={{
                ...glyphRun,
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                filter: textGlow,
              }}
            >
              {glyphs.map((c, i) => (
                <span
                  key={i}
                  style={{
                    opacity: charOpacity(i),
                    backgroundImage: textGradient,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                  }}
                >
                  {c}
                </span>
              ))}
            </span>

            {/* The hero — a soft, illuminated neon pill trailing the text */}
            <div
              style={{
                position: "absolute",
                left: cursorX + GAP,
                top: "50%",
                transform: "translateY(-50%)",
                width: CURSOR_WIDTH,
                height: CURSOR_HEIGHT,
                borderRadius: 9999,
                backgroundColor: cinematic.neon,
                opacity: cursorOpacity,
                boxShadow: neonBloom,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
