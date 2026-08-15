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

// Manually balanced line breaks — no auto-wrap. Four lines that form an
// intentional, architectural block instead of jagged wrapping.
//   ...overthink
//   long enough,
//   and the negative
//   thoughts
const SETUP = "...overthink\nlong enough,\nand the negative\nthoughts";
const LINE3 = "starts defining you.";

// The friction point sits at the start of line 3 ("and the negative"): the
// first two lines type at a steady mechanical pace, the last two slower.
const FRICTION_INDEX = SETUP.indexOf("and the");

// Phase boundaries (frames @ 30fps).
const TYPE_START = 15;
const FRICTION_FRAME = 42;
const TYPE_END = 75;
const TAKEOVER = 105; // the kill switch + the slam

// A single physics engine for the takeover: the setup receding and the final
// phrase slamming in are driven by the *same* stiff, high-damping spring, so
// the recede reads as a direct physical reaction to the impact.
const SLAM_CONFIG = { damping: 26, stiffness: 220, mass: 0.7 } as const;
const SLAM_DURATION = 20;

/**
 * "The Takeover" — a 9:16 typewriter that turns on itself.
 *
 * Void → the cursor blinks alone, dead-center. Friction → four balanced lines
 * type out, the last two slower. Hold → the text sits, the cursor blinks.
 * Takeover → at frame 105 the cursor is killed instantly, the setup is shoved
 * to the back of the mind (0.8 scale, 15% opacity), and "starts defining you."
 * slams in from scale 1.2 while the Apple primary-ink gradient sweeps its blue
 * across and settles, permanently, on the vibrant #0000f9.
 */
export const Overthink: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Typewriter: one continuous count over the manually-broken string ------
  const typed = Math.floor(
    interpolate(
      frame,
      [TYPE_START, FRICTION_FRAME, TYPE_END],
      [0, FRICTION_INDEX, SETUP.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )
  );
  const cursorAlive = frame < TAKEOVER;

  // --- The takeover, both halves on one shared spring ------------------------
  const slam = spring({
    frame: frame - TAKEOVER,
    fps,
    config: SLAM_CONFIG,
    durationInFrames: SLAM_DURATION,
  });

  // The setup recedes to the back of the mind.
  const recedeScale = interpolate(slam, [0, 1], [1, 0.8]);
  const recedeOpacity = interpolate(slam, [0, 1], [1, 0.15]);

  // The impact phrase slams in — capped at 1.2 so it never clips the frame.
  const impactScale = interpolate(slam, [0, 1], [1.2, 1]);
  const impactOpacity = interpolate(frame, [TAKEOVER, TAKEOVER + 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The blue sweeps across the words right after the slam. The specified
  // 184deg gradient is all but vertical, so the vertical position drives the
  // color (dark #1d1d1f/#252525 edges → #0000f9 mid-band) while a horizontal
  // drift gives the left-to-right read. Both axes resolve on the blue band so
  // the final hold stays permanently, vibrantly #0000f9 — never the dark edge.
  const sweepProg = interpolate(frame, [TAKEOVER + 1, TAKEOVER + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepX = interpolate(sweepProg, [0, 1], [0, 45]);
  const sweepY = interpolate(sweepProg, [0, 1], [100, 60]);

  const textBlock: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 96,
    lineHeight: 1.04,
    letterSpacing: tracking.display,
    textAlign: "center",
    color: colors.ink,
    margin: 0,
    // `pre` honours the manual line breaks and never auto-wraps.
    whiteSpace: "pre",
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
        padding: "0 40px",
      }}
    >
      {/* Setup block — the typewriter lines, later shoved to the back */}
      <div
        style={{
          transform: `scale(${recedeScale})`,
          opacity: recedeOpacity,
          transformOrigin: "center center",
          willChange: "transform, opacity",
        }}
      >
        {/* The full block is always laid out so line 1 never moves — the
            untyped remainder is transparent but still reserves its space, and
            characters simply fill in below as they are "typed". */}
        <div style={textBlock}>
          <span>{SETUP.slice(0, typed)}</span>
          <Cursor visible={cursorAlive} />
          <span style={{ color: "transparent" }}>{SETUP.slice(typed)}</span>
        </div>
      </div>

      {/* Impact line — slams in dead-center below, blue sweeping across */}
      {frame >= TAKEOVER && (
        <div
          style={{
            ...textBlock,
            marginTop: 28,
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
