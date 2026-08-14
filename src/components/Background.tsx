import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

/**
 * Apple establishes rhythm by alternating #ffffff and #f5f5f7 bands rather
 * than with dividers. Here that band-shift is played out in time: the canvas
 * eases from paper-white into the quiet gray exactly as the thought turns.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  // Two calm crossfades: settle into gray as "negative thoughts" lands,
  // then a whisper back toward paper for the final line's clarity.
  const grayMix = interpolate(
    frame,
    [70, 118, 150, 178],
    [0, 1, 1, 0.55],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <AbsoluteFill
        style={{ backgroundColor: colors.canvas, opacity: grayMix }}
      />
    </AbsoluteFill>
  );
};
