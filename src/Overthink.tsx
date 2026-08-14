import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { Background } from "./components/Background";
import { Eyebrow, Pagination } from "./components/Chrome";
import { RevealWord } from "./components/RevealWord";
import { colors, fonts, tracking } from "./theme";

const fontFamily = fonts.display;

/**
 * "...overthink long enough, and the negative thoughts starts defining you."
 *
 * A cathedral of white space: three lines of weight-700 Inter rise out of the
 * paper one word at a time, the canvas eases into gray as the thought darkens,
 * and the single chromatic-blue moment is spent on "defining you." — the one
 * place color is allowed to touch the type.
 */
export const Overthink: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Barely-there rise of the whole stack — keeps the type "floating".
  const drift = interpolate(frame, [0, durationInFrames], [8, -8]);

  // A soft settle-in and a gentle fade-to-white on the last beat.
  const outro = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0.86],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const lineHeight = 1.06;

  // Shared props for every headline word — one display size, one tracking.
  const word = {
    fontSize: 96,
    tracking: tracking.display,
    lineHeight,
  } as const;

  // Each line is a centered flex row so inter-word spacing is explicit and
  // never collapses, while words still wrap gracefully.
  const lineStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "baseline",
    columnGap: 30,
    rowGap: 0,
    marginBottom: 4,
  };

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 120px",
        }}
      >
        <div
          style={{
            transform: `translateY(${drift}px)`,
            opacity: outro,
            textAlign: "center",
            maxWidth: 1400,
          }}
        >
          <Eyebrow text="A thought" delay={4} />

          {/* Line 1 — the setup */}
          <div style={lineStyle}>
            <RevealWord delay={12} {...word}>
              …overthink
            </RevealWord>
            <RevealWord delay={24} {...word}>
              long
            </RevealWord>
            <RevealWord delay={34} {...word}>
              enough,
            </RevealWord>
          </div>

          {/* Line 2 — the turn */}
          <div style={lineStyle}>
            <RevealWord delay={60} {...word}>
              and the
            </RevealWord>
            <RevealWord delay={72} {...word}>
              negative
            </RevealWord>
            <RevealWord delay={84} {...word}>
              thoughts
            </RevealWord>
          </div>

          {/* Line 3 — the thesis; the single chromatic moment */}
          <div style={lineStyle}>
            <RevealWord delay={116} {...word}>
              starts
            </RevealWord>
            <RevealWord delay={132} {...word} emphasis>
              defining you.
            </RevealWord>
          </div>
        </div>
      </AbsoluteFill>

      {/* Apple-system chrome: pagination dots pinned low, stepping per line */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 72,
        }}
      >
        <Pagination count={3} activeStops={[12, 60, 116]} />
      </AbsoluteFill>

      {/* A single hairline at the very foot — a whisper of the Apple grid */}
      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "stretch" }}
      >
        <div
          style={{
            height: 1,
            margin: "0 120px 40px",
            backgroundColor: colors.hairline,
            opacity: interpolate(frame, [24, 48], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
