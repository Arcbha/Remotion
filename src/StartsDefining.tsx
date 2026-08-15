import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { fonts } from "./theme";

const fontFamily = fonts.display;

const TEXT = "starts defining you.";

// Type metrics — the cursor height is locked to the text's line-height. Sized
// to sit on a single centered line in the 1080-wide vertical frame.
const FONT_SIZE = 82;
const LINE_HEIGHT = 1.0;
const CURSOR_HEIGHT = FONT_SIZE * LINE_HEIGHT;

/**
 * "starts defining you." — cinematic dark-mode typewriter (9:16, 60fps).
 *
 * A neon-blue glowing rod blinks dead-center on an atmospheric gradient (deep
 * void up top bleeding into a foggy blue wash at the bottom). The phrase types
 * out linearly, the rod tracking the leading edge, then holds centered with the
 * rod blinking rapidly at the end. The timeline is expressed in seconds so it
 * holds at any fps: type from 0.5s → 2.5s, hold 2.5s → 4.0s.
 */
export const StartsDefining: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typeStart = Math.round(fps * 0.5);
  const typeEnd = Math.round(fps * 2.5);

  // Linear typewriter: map frame → string length.
  const typedCount = Math.round(
    interpolate(frame, [typeStart, typeEnd], [0, TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typed = TEXT.slice(0, typedCount);

  // Rapid blink before typing and after it finishes; solid while typing.
  // ~0.17s on/off (the 5-frame @30fps cadence scaled to this fps).
  const blinkPeriod = Math.max(1, Math.round(fps / 6));
  const isTyping = frame >= typeStart && frame < typeEnd;
  const blinkOn = Math.floor(frame / blinkPeriod) % 2 === 0;
  const cursorOpacity = isTyping ? 1 : blinkOn ? 1 : 0;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        // Deep void up top bleeding into a bright, foggy blue wash at the bottom.
        background:
          "linear-gradient(180deg, #020205 0%, #0a0e27 60%, #1a3b7c 90%, #6fa6df 100%)",
      }}
    >
      {/* Absolute-center line: typed text + trailing neon rod */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 50px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: FONT_SIZE,
              lineHeight: LINE_HEIGHT,
              letterSpacing: "-1.5px",
              color: "#ffffff",
              whiteSpace: "pre",
            }}
          >
            {typed}
          </span>

          {/* The hero element — a thick, illuminated glowing rod */}
          <div
            style={{
              width: 6,
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
