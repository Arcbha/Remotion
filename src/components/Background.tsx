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

  // The canvas eases into the quiet gray exactly as the setup lines recede,
  // deepening the white space the impact phrase then dominates.
  const grayMix = interpolate(
    frame,
    [78, 118, 180],
    [0, 0.7, 0.7],
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
