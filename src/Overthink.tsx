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
import { Background } from "./components/Background";
import { RevealWord } from "./components/RevealWord";
import { fonts, inkGradient, tracking } from "./theme";

const fontFamily = fonts.display;

/** The frame at which line 3 takes over and lines 1 & 2 are pushed back. */
const TAKEOVER = 108;

/**
 * "...overthink long enough, and the negative thoughts starts defining you."
 *
 * Two phases in a 9:16 cathedral of white space:
 *   1. Setup — lines 1 & 2 reveal word by word, anchored to the top third.
 *   2. Takeover — as line 3 fires, the setup lines recede into a soft blur at
 *      the back of the mind, and "starts defining you." snaps in dead-center
 *      from scale 1.5, fully saturated in the chromatic blue from the first
 *      frame, dominating the white.
 */
export const Overthink: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineHeight = 1.06;

  // Shared props for every setup word — one display size, one tracking.
  const word = {
    fontSize: 96,
    tracking: tracking.display,
    lineHeight,
  } as const;

  // Each line is a centered flex row so inter-word spacing never collapses.
  const lineStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "baseline",
    columnGap: 28,
    rowGap: 0,
    marginBottom: 8,
  };

  // --- Phase 2: the setup lines recede to the back of the mind ---------------
  const recedeScale = interpolate(frame, [TAKEOVER, TAKEOVER + 18], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const recedeBlur = interpolate(frame, [TAKEOVER, TAKEOVER + 18], [0, 12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const recedeOpacity = interpolate(
    frame,
    [TAKEOVER, TAKEOVER + 18],
    [1, 0.15],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // A whisper of upward drift on the setup block during phase 1.
  const setupDrift = interpolate(frame, [0, TAKEOVER], [10, 0], {
    extrapolateRight: "clamp",
  });

  // --- Phase 2: the impact phrase snaps in -----------------------------------
  // A stiff, high-damping spring: rapid arrival, no lingering bounce.
  const impact = spring({
    frame: frame - TAKEOVER,
    fps,
    config: { damping: 26, stiffness: 200, mass: 0.7 },
    durationInFrames: 22,
  });
  const impactScale = interpolate(impact, [0, 1], [1.5, 1]);
  // Fully saturated the millisecond it hits — a 2-frame cut, not a reveal.
  const impactOpacity = interpolate(
    frame,
    [TAKEOVER, TAKEOVER + 2],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />

      {/* Phase 1 — setup lines anchored to the top third, then receding */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 300,
          paddingLeft: 70,
          paddingRight: 70,
        }}
      >
        <div
          style={{
            textAlign: "center",
            transform: `translateY(${setupDrift}px) scale(${recedeScale})`,
            filter: `blur(${recedeBlur}px)`,
            opacity: recedeOpacity,
            willChange: "transform, filter, opacity",
          }}
        >
          {/* Line 1 — the setup */}
          <div style={lineStyle}>
            <RevealWord delay={8} {...word}>
              …overthink
            </RevealWord>
            <RevealWord delay={20} {...word}>
              long
            </RevealWord>
            <RevealWord delay={30} {...word}>
              enough,
            </RevealWord>
          </div>

          {/* Line 2 — the turn */}
          <div style={lineStyle}>
            <RevealWord delay={50} {...word}>
              and the
            </RevealWord>
            <RevealWord delay={62} {...word}>
              negative
            </RevealWord>
            <RevealWord delay={74} {...word}>
              thoughts
            </RevealWord>
          </div>
        </div>
      </AbsoluteFill>

      {/* Phase 2 — the impact phrase, dead-center, chromatic, snapping in */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: 96,
            lineHeight,
            letterSpacing: tracking.display,
            backgroundImage: inkGradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            transform: `scale(${impactScale})`,
            opacity: impactOpacity,
            willChange: "transform, opacity",
          }}
        >
          starts defining you.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
