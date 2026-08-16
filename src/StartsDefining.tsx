import React, { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { fonts } from "./theme";

const fontFamily = fonts.display;

const TEXT = "starts defining you.";

// ── Strict typographic parameters ───────────────────────────────────────────
// 82px is the locked size that keeps the phrase on a single line inside the
// 1080px-wide frame at rest (scale 1).
const FONT_SIZE = 82;
const LINE_HEIGHT = 1.0;
const LETTER_SPACING = -1.5; // px
const CURSOR_WIDTH = 6;
const CURSOR_HEIGHT = FONT_SIZE * LINE_HEIGHT;
const GAP = 8; // px between the trailing edge of the text and the cursor

// ── Timeline (60fps, 240 frames = 4.0s) ─────────────────────────────────────
const TYPE_START = 0; //  0.0s
const TYPE_END = 150; //  2.5s  — Phase 1 ends, snap fires
const SNAP_FRAME = 150; //  2.5s

// ── Camera ───────────────────────────────────────────────────────────────────
const MACRO_SCALE = 5; // Phase 1 macro zoom
const REST_SCALE = 1; // Phase 3 resting frame

// Extracted background: deep void up top bleeding into a vibrant, hazy blue
// wash with a soft bloom at the very base of the frame.
const BACKGROUND =
  "radial-gradient(120% 80% at 50% 118%, rgba(120,175,240,0.55) 0%, rgba(30,95,205,0) 55%), " +
  "linear-gradient(180deg, #010206 0%, #02040f 26%, #061634 50%, #0d3c88 71%, #1f6ad6 85%, #62a4ec 94%, #bcd8f5 100%)";

// Extracted internal text gradient — bright white cooling to a faint blue.
const TEXT_GRADIENT =
  "linear-gradient(180deg, #ffffff 0%, #eaf1ff 55%, #cfe0ff 100%)";

// Extracted neon glow — soft blue-white bleed that hugs the glyph shapes.
const TEXT_GLOW =
  "drop-shadow(0 0 2px rgba(190,218,255,0.6)) " +
  "drop-shadow(0 0 20px rgba(90,150,255,0.38)) " +
  "drop-shadow(0 0 44px rgba(50,120,235,0.22))";

const glyphStyle: React.CSSProperties = {
  fontFamily,
  fontWeight: 600,
  fontSize: FONT_SIZE,
  lineHeight: LINE_HEIGHT,
  letterSpacing: `${LETTER_SPACING}px`,
  whiteSpace: "pre",
};

/**
 * "starts defining you." — cinematic dark-mode typewriter with a dynamic
 * macro-camera (9:16, 1080×1920, 60fps, 240 frames).
 *
 * Phase 1 (0–150):  camera locked at scale 5. The phrase types out; the neon
 *                   rod is anchored to the exact centre of the frame by layout
 *                   (cursor pinned at 50%, text growing leftward past it) so the
 *                   macro tracking is pixel-perfect at 5× with no per-frame
 *                   width math to amplify. Relative to the fixed rod the type
 *                   streams right-to-left — i.e. the camera pans left.
 * Phase 2 (@150):   a violent spring slams scale 5 → 1 while translateX drives
 *                   from 0 to the measured recentre offset, sliding the finished
 *                   phrase from cursor-centred to fully centred.
 * Phase 3 (150–240): static hold at scale 1, full phrase centred, rod blinking
 *                   on a rapid 5-frame cadence.
 */
export const StartsDefining: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Exact glyph metrics ────────────────────────────────────────────────────
  // Measure the full-phrase width once, off-screen, from the real self-hosted
  // Inter glyphs. Only used for the Phase-2 recentre (at scale 1, so error is
  // 1:1). `delayRender` makes `remotion render` wait for a real measurement.
  const measureRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState<number | null>(null);
  const [handle] = useState(() => delayRender("measure-inter-phrase"));

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    setTextWidth(el.getBoundingClientRect().width);
    continueRender(handle);
  }, [handle]);

  // Offset that slides the finished phrase from "cursor at centre" to
  // "phrase centred": half the phrase's text span plus its gap.
  const recentrePan =
    textWidth != null ? (textWidth + GAP) / 2 : (TEXT.length * FONT_SIZE * 0.5 + GAP) / 2;

  // ── Typewriter ─────────────────────────────────────────────────────────────
  const typedCount = Math.round(
    interpolate(frame, [TYPE_START, TYPE_END], [0, TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typed = TEXT.slice(0, typedCount);

  // ── Camera transform ───────────────────────────────────────────────────────
  let scale: number;
  let panX: number;

  if (frame < SNAP_FRAME) {
    // Phase 1 — macro tracking. Cursor is centred by layout; no pan needed.
    scale = MACRO_SCALE;
    panX = 0;
  } else {
    // Phase 2/3 — the violent snap, then hold. High stiffness, low damping,
    // light mass → a fast overshoot-and-settle slam (DesignMD substitute).
    const snap = spring({
      frame: frame - SNAP_FRAME,
      fps,
      config: { stiffness: 200, damping: 14, mass: 0.8 },
    });
    scale = interpolate(snap, [0, 1], [MACRO_SCALE, REST_SCALE]);
    panX = interpolate(snap, [0, 1], [0, recentrePan]);
  }

  // ── Cursor blink ───────────────────────────────────────────────────────────
  // Solid while typing (Phase 1); rapid 5-frame on/off cadence during the hold.
  let cursorOpacity = 1;
  if (frame >= SNAP_FRAME) {
    cursorOpacity = Math.floor((frame - SNAP_FRAME) / 5) % 2 === 0 ? 1 : 0;
  }

  return (
    <AbsoluteFill style={{ background: BACKGROUND, fontFamily }}>
      {/* Off-screen phrase measurer — never composited into the shot. */}
      <span
        ref={measureRef}
        aria-hidden
        style={{
          ...glyphStyle,
          position: "absolute",
          left: -99999,
          top: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        {TEXT}
      </span>

      {/* The dynamic camera viewport. */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translateX(${panX}px)`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* Vertically-centred stage. The rod is pinned to horizontal centre; the
            text hangs off its left edge and grows leftward as it types. */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "relative", width: "100%", height: CURSOR_HEIGHT }}>
            {/* Text — right edge anchored just left of the centred rod. */}
            <span
              style={{
                ...glyphStyle,
                position: "absolute",
                right: "50%",
                top: 0,
                height: CURSOR_HEIGHT,
                display: "flex",
                alignItems: "center",
                marginRight: GAP + CURSOR_WIDTH / 2,
                textAlign: "right",
                backgroundImage: TEXT_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                filter: TEXT_GLOW,
              }}
            >
              {typed}
            </span>

            {/* Hero element — the illuminated blue rod, locked at dead centre. */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: "translateX(-50%)",
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
    </AbsoluteFill>
  );
};
