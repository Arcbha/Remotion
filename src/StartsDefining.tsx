import React, { useEffect, useMemo, useState } from "react";
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

/**
 * "starts defining you." — cinematic dark-mode typewriter with a macro camera.
 * 9:16 (1080x1920), 60fps, 4.0s (240 frames).
 *
 * Colors, glows and the background gradient are lifted directly from the neon-rod
 * reference stills: a deep void up top bleeding into a hazy blue floor, a subtle
 * internal text gradient, and an ambient blue-white bleed off the glyphs.
 *
 * The camera lives at scale 5 while the phrase types, panning left so the glowing
 * cursor stays pinned to the exact center of the viewport. At frame 150 a violent
 * spring slams scale 5 -> 1 and translateX -> 0, revealing the full centered
 * phrase, which then holds while the cursor blinks on a rapid 5-frame cadence.
 */

const TEXT = "starts defining you.";

// Typography — locked per spec. 82px keeps the phrase on one line inside 1080px.
const FONT_SIZE = 82;
const LINE_HEIGHT = 1.0;
const LETTER_SPACING = -1.5; // px, between/after every glyph
const CURSOR_HEIGHT = FONT_SIZE * LINE_HEIGHT;
const CURSOR_WIDTH = 6;
const GAP = 14; // space between the text's trailing edge and the rod

const FONT_FAMILY = 'Inter, system-ui, -apple-system, sans-serif';

// Timeline (frames @ 60fps)
const TYPE_START = 30; // 0.5s
const TYPE_END = 150; // 2.5s — Phase 1 ends
const SNAP_FRAME = 150; // Phase 2 trigger

const MACRO_SCALE = 5;

// Vision-extracted background — deep void -> vibrant hazy blue floor, plus a
// soft central bloom where the rod glows.
const BACKGROUND =
  "radial-gradient(65% 45% at 50% 60%, rgba(42,112,222,0.35), transparent 72%)," +
  "linear-gradient(180deg, #010208 0%, #04091a 42%, #0d3172 74%, #2f6ac2 90%, #6ea6dd 100%)";

// Vision-extracted internal text gradient (brighter at the top).
const TEXT_GRADIENT =
  "linear-gradient(180deg, #ffffff 0%, #eaf1fb 52%, #cdddf5 100%)";

// Vision-extracted ambient neon bleed off the glyphs.
const TEXT_GLOW =
  "drop-shadow(0 0 18px rgba(150,190,255,0.45)) drop-shadow(0 0 42px rgba(60,120,230,0.30))";

/**
 * Font-aware width measurement. Runs once the Inter 600 face is loaded so glyph
 * advances are exact, then builds a cumulative prefix-width table: prefix[k] is
 * the rendered width of the first k characters, including CSS letter-spacing
 * (which the browser applies after every glyph, hence LETTER_SPACING * k).
 */
const useTextMetrics = () => {
  const [handle] = useState(() => delayRender("measure-inter-600"));
  const [prefixes, setPrefixes] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const build = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = `600 ${FONT_SIZE}px Inter, sans-serif`;
      const table: number[] = [];
      for (let k = 0; k <= TEXT.length; k++) {
        const slice = TEXT.slice(0, k);
        table.push(ctx.measureText(slice).width + LETTER_SPACING * k);
      }
      if (!cancelled) {
        setPrefixes(table);
        continueRender(handle);
      }
    };

    if (document.fonts && document.fonts.load) {
      document.fonts
        .load(`600 ${FONT_SIZE}px "Inter"`)
        .then(() => document.fonts.ready)
        .then(build)
        .catch(build);
    } else {
      build();
    }
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return prefixes;
};

export const StartsDefining: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prefixes = useTextMetrics();

  // Hold the frame until glyph metrics are ready (delayRender is active).
  if (!prefixes) {
    return <AbsoluteFill style={{ background: BACKGROUND }} />;
  }

  const fullWidth = prefixes[TEXT.length];
  const lineWidth = fullWidth + GAP + CURSOR_WIDTH;

  // Discrete typewriter: whole glyphs only, so the cursor sits exactly on the
  // rendered text edge and the pan advances in glyph steps.
  const typedCount = Math.round(
    interpolate(frame, [TYPE_START, TYPE_END], [0, TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typed = TEXT.slice(0, typedCount);
  const cursorX = prefixes[typedCount]; // trailing edge of the typed text

  // --- Camera transform -----------------------------------------------------
  // The line is centered in the viewport, so at translateX 0 / scale 1 the full
  // phrase reads dead-center (Phase 3). During Phase 1 we translate (in screen
  // px, applied after scale) so the cursor's center maps onto 540:
  //   screen_x = 540 + (content_x - 540)*S + TX  ->  TX = -(content_x - 540)*S
  // The cursor center in content space, relative to viewport center, resolves to
  //   (cursorX + GAP/2 - fullWidth/2), giving the pan below.
  const macroTX =
    MACRO_SCALE * (fullWidth / 2 - GAP / 2 - cursorX);

  // --- Phase 2: the violent snap (spring) -----------------------------------
  // High stiffness / low damping for a punchy, slightly-overshooting slam.
  const snap = spring({
    frame: frame - SNAP_FRAME,
    fps,
    config: { stiffness: 220, damping: 14, mass: 0.9 },
  });

  const scale = interpolate(snap, [0, 1], [MACRO_SCALE, 1]);
  const macroTXAtSnap =
    MACRO_SCALE * (fullWidth / 2 - GAP / 2 - fullWidth); // typedCount === len
  const translateX =
    frame < SNAP_FRAME
      ? macroTX
      : interpolate(snap, [0, 1], [macroTXAtSnap, 0]);

  // --- Cursor visibility ----------------------------------------------------
  // Solid while typing; rapid 5-frame on/off cadence once the snap fires.
  const cursorOpacity =
    frame < SNAP_FRAME ? 1 : Math.floor((frame - SNAP_FRAME) / 5) % 2 === 0 ? 1 : 0;

  return (
    <AbsoluteFill style={{ background: BACKGROUND, fontFamily: FONT_FAMILY }}>
      {/* Camera viewport */}
      <AbsoluteFill
        style={{
          transform: `translateX(${translateX}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* The full-line stage, centered in the viewport */}
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
          {/* Typed text — left-anchored, clipped internal gradient + neon bleed */}
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
              fontSize: FONT_SIZE,
              lineHeight: LINE_HEIGHT,
              letterSpacing: `${LETTER_SPACING}px`,
              whiteSpace: "pre",
              backgroundImage: TEXT_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter: TEXT_GLOW,
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
              backgroundColor: "#007fff",
              opacity: cursorOpacity,
              boxShadow:
                "0 0 12px 2px rgba(0, 127, 255, 0.8), 0 0 24px 8px rgba(0, 127, 255, 0.4)",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
