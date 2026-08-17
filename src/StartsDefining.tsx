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
import { FONT_STACK, waitForDisplayFont } from "./fonts";
import {
  atmosphere,
  cinematic,
  emberGradient,
  keynoteShadow,
  neonBloom,
  systemGray,
  textGlow,
  textGradient,
  typeScale,
} from "./theme";

/**
 * "starts defining you." — cinematic dark-mode typewriter with a macro camera.
 * 9:16 (1080×1920), 60fps, 4.0s (240 frames).
 *
 * Phases:
 *   1 · 0–150   Camera holds at 5× macro. Each glyph enters individually —
 *               opacity 0→1 and an 8px rise on `EASE.out` — while the camera
 *               pans so the rod stays pinned to the 75% mark, leaving the left
 *               three-quarters of frame as readable runway.
 *   2 · 150     Violent snap — `CAMERA_SPRING.cinematicSnap` slams scale 5 → 1
 *               and translateX → 0, with optical blur tracking the camera's
 *               instantaneous velocity. "defining" turns ember on this frame,
 *               inside the blur peak, so the colour change reads as impact.
 *   3 · 150–240 The rod blinks on a 5-frame cadence; "defining" settles from
 *               ember to system gray over 175–185 as the spring's kinetic
 *               energy dies; from frame 180 the camera creeps 1.0 → 0.98 so
 *               the scene never dead-stops.
 *
 * Sourcing — every value below is taken from the local rule set, not invented:
 * - **Entering curve** `EASE.out` = `cubic-bezier(0.33, 1, 0.68, 1)`.
 *   APPLE_MOTION.md §4 designates it for "Non-spring elements entering";
 *   `animate` §5 and `review-animations/STANDARDS.md` both give "Entering or
 *   exiting → ease-out" and ban `ease-in` on entrances. CLAUDE.md routes type
 *   reveals to the cinematic family, which is why this is `EASE.out` and not
 *   the UI-grade `UI_EASE.out`.
 * - **Reveal geometry** `opacity 0→1` + `translateY(8px)→0`, lifted verbatim
 *   from `review-animations/STANDARDS.md` §Stagger.
 * - **Typography** `apple-design` §15 `.display`: tracking −0.02em (size-
 *   relative, never fixed px), leading 1.05, `font-optical-sizing: auto`.
 * - **Depth** `apple-design` §12: context-aware shadow, "lighter over plain
 *   backgrounds". Ambient cast shadow only — no bevel, emboss or inner shadow.
 *
 * Deviations from APPLE_MOTION.md:
 * - §5: the snap uses the deliberately underdamped `CAMERA_SPRING.cinematicSnap`
 *   (ζ 0.50) rather than a HIG spring — the sanctioned house extension for
 *   camera moves, and the source of the slam.
 * - §5: that spring peaks at 1.165, so across the 5→1 scale range its raw
 *   overshoot would collapse scale to 0.34. `CLAMP` is spread into the camera
 *   interpolations so the slam keeps the violent rise and stops at its target.
 * - §9 rule 3 ("typewriters run linear") applies to the *cadence*, which is
 *   still linear — glyphs are scheduled at a constant rate and revealed whole.
 *   Each glyph's own entrance eases, per the entering rule above.
 * - §14 ("never animate blur() radius"): the snap animates `filter: blur()` on
 *   the subject to fake optical motion blur. Deliberate — a 5× zoom-out with no
 *   smear reads as a jump-cut. Scoped to the ~10 frames of the snap.
 */

const TEXT = "starts defining you.";

const {
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  lineHeight: LINE_HEIGHT,
  trackingEm: TRACKING_EM,
} = typeScale.headline;

/** −0.02em resolved against the 82px display size (apple-design §15). */
const LETTER_SPACING = TRACKING_EM * FONT_SIZE;

const CURSOR_HEIGHT = FONT_SIZE * LINE_HEIGHT;
const CURSOR_WIDTH = 6;
const GAP = 14; // gap between the text's trailing edge and the rod

// The emphasised word — TEXT.slice(7, 15) === "defining".
const DEFINING_START = 7;
const DEFINING_END = 15;
const COLOR_SNAP_START = 175;
const COLOR_SNAP_END = 185;

// Phase boundaries, in frames (authored at a fixed 240f/60fps).
const TYPE_START = 0;
const SNAP_FRAME = 150;
const DRIFT_START = 180;
const DRIFT_END = 240;

const MACRO_SCALE = 5;
const CURSOR_ANCHOR = 0.75; // fraction of the width the rod is pinned to
const DRIFT_SCALE = 0.98; // the creeping breath of Phase 3
const BLINK_PERIOD = 5; // rapid 5-frame cadence during the hold
const CHAR_REVEAL = 8; // frames a glyph takes to enter
const CHAR_RISE = 8; // px — review-animations/STANDARDS.md §Stagger
const SNAP_BLUR_PEAK = 12; // px, at the camera's maximum velocity

/**
 * Scale of the camera's snap at a given frame past {@link SNAP_FRAME}.
 * Pure, so it doubles as the source for the motion-blur derivative below.
 */
const snapScaleAt = (framesPastSnap: number, fps: number) =>
  interpolate(
    spring({ frame: framesPastSnap, fps, config: CAMERA_SPRING.cinematicSnap }),
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
 * Glyph metrics, gated on the display face resolving *and* `document.fonts.ready`
 * so advances are never measured against a fallback that is about to be swapped.
 *
 * Advances are measured per character and summed, and every glyph is then
 * positioned absolutely from this table. That makes layout independent of
 * inline text shaping entirely — kerning, ligatures and the fact that a
 * `transform` is inert on a non-replaced inline box all stop mattering, and the
 * ember overlay lands glyph-for-glyph on the base run.
 */
const useTextMetrics = () => {
  const [handle] = useState(() => delayRender("measure-display-face"));
  const [prefixes, setPrefixes] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const build = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      ctx.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_STACK}`;
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

    waitForDisplayFont()
      .then(() => document.fonts.ready)
      .then(build)
      .catch(build);

    return () => {
      cancelled = true;
    };
  }, [handle]);

  return prefixes;
};

/** Shared glyph styling. Optical sizing per apple-design §15. */
const glyphBase: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontWeight: FONT_WEIGHT,
  fontSize: FONT_SIZE,
  lineHeight: LINE_HEIGHT,
  whiteSpace: "pre",
  fontKerning: "none",
  fontVariantLigatures: "none",
  fontOpticalSizing: "auto",
};

/** The white display fill — a vertical gradient clipped to the glyph. */
const clippedFill = (image: string): React.CSSProperties => ({
  backgroundImage: image,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
});

export const StartsDefining: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const ms = useMs();
  const prefixes = useTextMetrics();

  // Hold the frame while the face and its metrics resolve.
  if (!prefixes) {
    return <AbsoluteFill style={{ background: atmosphere }} />;
  }

  const fullWidth = prefixes[TEXT.length];
  const lineWidth = fullWidth + GAP + CURSOR_WIDTH;

  /* -- Phase 1: the glyph reveal ------------------------------------------- */
  // The cadence stays linear — glyphs are scheduled at a constant rate and
  // revealed whole (APPLE_MOTION.md §9). Only each glyph's own entrance eases.
  const perChar = (SNAP_FRAME - TYPE_START) / TEXT.length;
  const typedCount = Math.round(
    interpolate(frame, [TYPE_START, SNAP_FRAME], [0, TEXT.length], {
      easing: EASE.linear,
      ...CLAMP,
    })
  );
  const cursorX = prefixes[typedCount]; // trailing edge of the typed text

  // A glyph crosses into the count at (i + 0.5) · perChar and enters from there.
  // CHAR_REVEAL slightly exceeds the cadence, so neighbours overlap and the line
  // reads as a flowing wave rather than a row of discrete pops.
  const charProgress = (i: number) => {
    const start = TYPE_START + (i + 0.5) * perChar;
    return interpolate(frame, [start, start + CHAR_REVEAL], [0, 1], {
      easing: EASE.out,
      ...CLAMP,
    });
  };

  /* -- Camera -------------------------------------------------------------- */
  // The camera scales about its centre, so `lockToCenterX` solves for the centre
  // only. Shifting the lock to the 75% mark is a plain screen-space offset added
  // *after* scaling — feeding the anchor in as the origin instead would inflate
  // it by the scale factor and throw the rod (S−1)·(anchor−centre) = 1080px off
  // the right edge at 5×.
  const anchorOffset = (CURSOR_ANCHOR - 0.5) * width;
  const stageLeft = width / 2 - lineWidth / 2;
  const macroX =
    lockToCenterX(
      stageLeft + cursorX + GAP + CURSOR_WIDTH / 2,
      width / 2,
      MACRO_SCALE
    ) + anchorOffset;

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
  const macroXAtSnap =
    lockToCenterX(
      stageLeft + fullWidth + GAP + CURSOR_WIDTH / 2,
      width / 2,
      MACRO_SCALE
    ) + anchorOffset;
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
  const reveal = interpolate(frame, [0, ms(UI_DURATION.dropdown)], [0, 1], {
    easing: UI_EASE.out,
    ...CLAMP,
  });
  const blinkOn = Math.floor(pastSnap / BLINK_PERIOD) % 2 === 0;
  const cursorOpacity = frame >= SNAP_FRAME ? (blinkOn ? 1 : 0) : reveal;

  /* -- The "defining" colour snap ------------------------------------------ */
  // Gray is stacked over a fully opaque ember rather than the two being
  // dissolved in opposite directions: two half-opaque copies of the same glyphs
  // composite to ~0.75 alpha at the midpoint, letting the void through and
  // dimming the word. Holding ember at 1 and fading gray in keeps it solid.
  const emphasised = frame >= SNAP_FRAME;
  const settle = interpolate(frame, [COLOR_SNAP_START, COLOR_SNAP_END], [0, 1], {
    easing: EASE.inOut,
    ...CLAMP,
  });

  const glyphs = TEXT.split("");
  const isEmphasised = (i: number) => i >= DEFINING_START && i < DEFINING_END;
  const emphasisedGlyphs = glyphs
    .map((c, i) => ({ c, i }))
    .filter(({ i }) => isEmphasised(i));

  return (
    <AbsoluteFill style={{ background: atmosphere, fontFamily: FONT_STACK }}>
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
              gives the display type visual mass in the void once the camera
              pulls out. Static blur; only transform and opacity animate. */}
          <span
            style={{
              ...glyphBase,
              position: "absolute",
              left: 0,
              top: "50%",
              letterSpacing: `${LETTER_SPACING}px`,
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
            {/* Text layer — ambient glow plus the cast shadow. Every glyph is
                absolutely placed from the measured prefix table. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                width: fullWidth,
                height: CURSOR_HEIGHT,
                transform: "translateY(-50%)",
                filter: `${textGlow} ${keynoteShadow}`,
              }}
            >
              {glyphs.map((c, i) => {
                const p = charProgress(i);
                return (
                  <span
                    key={i}
                    style={{
                      ...glyphBase,
                      ...clippedFill(textGradient),
                      position: "absolute",
                      left: prefixes[i],
                      top: 0,
                      // The base run yields "defining" to the colour layers the
                      // moment the camera fires.
                      opacity: emphasised && isEmphasised(i) ? 0 : p,
                      transform: `translateY(${interpolate(
                        p,
                        [0, 1],
                        [CHAR_RISE, 0]
                      ).toFixed(3)}px)`,
                    }}
                  >
                    {c}
                  </span>
                );
              })}

              {/* "defining", ember — held solid beneath the settling gray. */}
              {emphasisedGlyphs.map(({ c, i }) => (
                <span
                  key={`ember-${i}`}
                  style={{
                    ...glyphBase,
                    ...clippedFill(emberGradient),
                    position: "absolute",
                    left: prefixes[i],
                    top: 0,
                    opacity: emphasised ? 1 : 0,
                  }}
                >
                  {c}
                </span>
              ))}

              {/* "defining", system gray — fades in over the ember as the
                  spring's last kinetic energy dies. */}
              {emphasisedGlyphs.map(({ c, i }) => (
                <span
                  key={`gray-${i}`}
                  style={{
                    ...glyphBase,
                    position: "absolute",
                    left: prefixes[i],
                    top: 0,
                    color: systemGray,
                    opacity: emphasised ? settle : 0,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>

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
