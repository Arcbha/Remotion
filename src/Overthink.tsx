import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { Cursor } from "./components/Cursor";
import { colors, fonts, inkGradient, tracking } from "./theme";

const fontFamily = fonts.display;

const LINE1 = "...overthink long enough,";
const LINE2 = "and the negative thoughts";
const LINE3 = "starts defining you.";

// Phase boundaries (frames @ 30fps).
const L1_START = 15;
const L1_END = 42; // line 1 types 15 → 42 (mechanical)
const L2_START = 42;
const L2_END = 75; // line 2 types 42 → 75 (slower — mental friction)
const TAKEOVER = 105; // the kill switch + the slam

/**
 * "The Takeover" — a 9:16 typewriter that turns on itself.
 *
 * Void → the cursor blinks alone, dead-center. Friction → two lines type out,
 * the second slower than the first. Hold → the text sits, the cursor blinks.
 * Takeover → at frame 105 the cursor is killed instantly, the two lines are
 * shoved to the back of the mind (0.8 scale, 15% opacity), and
 * "starts defining you." slams in from scale 1.5 while the Apple primary-ink
 * gradient sweeps its blue across the words.
 */
export const Overthink: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Typewriter counts -----------------------------------------------------
  const l1 = Math.floor(
    interpolate(frame, [L1_START, L1_END], [0, LINE1.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const l2 = Math.floor(
    interpolate(frame, [L2_START, L2_END], [0, LINE2.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const line2Visible = frame >= L2_START;
  // The cursor trails the active line: line 1 until line 2 begins, then line 2.
  const cursorOnLine1 = frame < L2_START;
  const cursorAlive = frame < TAKEOVER;

  // --- Phase 4: the setup lines recede to the back of the mind ---------------
  const recede = spring({
    frame: frame - TAKEOVER,
    fps,
    config: { damping: 18, stiffness: 150, mass: 0.8 },
    durationInFrames: 18,
  });
  const recedeScale = interpolate(recede, [0, 1], [1, 0.8]);
  const recedeOpacity = interpolate(recede, [0, 1], [1, 0.15]);

  // --- Phase 4: the impact line slams in -------------------------------------
  const impact = spring({
    frame: frame - TAKEOVER,
    fps,
    config: { damping: 24, stiffness: 240, mass: 0.6 },
    durationInFrames: 20,
  });
  const impactScale = interpolate(impact, [0, 1], [1.5, 1]);
  const impactOpacity = interpolate(frame, [TAKEOVER, TAKEOVER + 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The blue sweeps across the words right after the slam and then settles
  // blue-dominant. The specified 184deg gradient is all but vertical, so the
  // vertical position drives the color (dark #1d1d1f edges → #0000f9 mid-band)
  // while a horizontal drift gives the left-to-right read. It resolves at the
  // blue band so the final hold stays saturated blue.
  const sweepProg = interpolate(frame, [TAKEOVER + 1, TAKEOVER + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepX = interpolate(sweepProg, [0, 1], [0, 100]);
  const sweepY = interpolate(sweepProg, [0, 1], [100, 52]);

  const textBlock: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 96,
    lineHeight: 1.04,
    letterSpacing: tracking.display,
    textAlign: "center",
    color: colors.ink,
    margin: 0,
    maxWidth: 960,
    // pre-wrap keeps the typed spaces yet lets the oversized 96px lines wrap
    // instead of overflowing the 1080px canvas.
    whiteSpace: "pre-wrap",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px",
      }}
    >
      {/* Setup block — typewriter lines 1 & 2, later shoved to the back */}
      <div
        style={{
          transform: `scale(${recedeScale})`,
          opacity: recedeOpacity,
          transformOrigin: "center center",
          willChange: "transform, opacity",
        }}
      >
        <div style={textBlock}>
          {LINE1.slice(0, l1)}
          {cursorOnLine1 && <Cursor visible={cursorAlive} />}
        </div>
        {line2Visible && (
          <div style={textBlock}>
            {LINE2.slice(0, l2)}
            {!cursorOnLine1 && <Cursor visible={cursorAlive} />}
          </div>
        )}
      </div>

      {/* Impact line — slams in dead-center below, blue sweeping across */}
      {frame >= TAKEOVER && (
        <div
          style={{
            ...textBlock,
            marginTop: 24,
            color: "transparent",
            WebkitTextFillColor: "transparent",
            backgroundImage: inkGradient,
            backgroundSize: "320% 320%",
            backgroundPosition: `${sweepX}% ${sweepY}%`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            transform: `scale(${impactScale})`,
            opacity: impactOpacity,
            willChange: "transform, background-position",
          }}
        >
          {LINE3}
        </div>
      )}
    </AbsoluteFill>
  );
};
