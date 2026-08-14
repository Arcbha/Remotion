import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, inkGradient } from "../theme";

type RevealWordProps = {
  children: React.ReactNode;
  /** Frame (relative to the enclosing Sequence) at which this word begins. */
  delay?: number;
  fontSize: number;
  weight?: number;
  tracking?: string;
  lineHeight?: number;
  /** Emphasised words wear the chromatic ink gradient. */
  emphasis?: boolean;
  color?: string;
  /** Springy overshoot on the rise. Apple reveals are calm, so keep it low. */
  damping?: number;
};

/**
 * The canonical Apple product-page reveal: a word rises a few pixels while a
 * blur resolves into focus and opacity climbs from 0 to 1. Nothing scales, no
 * shadow — the type simply comes into being out of the white space.
 */
export const RevealWord: React.FC<RevealWordProps> = ({
  children,
  delay = 0,
  fontSize,
  weight = 700,
  tracking = "-1.44px",
  lineHeight = 1.05,
  emphasis = false,
  color = colors.ink,
  damping = 200,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping, mass: 0.9, stiffness: 120 },
    durationInFrames: 34,
  });

  const translateY = interpolate(progress, [0, 1], [26, 0]);
  const blur = interpolate(progress, [0, 1], [14, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(progress, [0, 0.85], [0, 1], {
    extrapolateRight: "clamp",
  });

  const gradientStyle: React.CSSProperties = emphasis
    ? {
        backgroundImage: inkGradient,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }
    : { color };

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: fonts.display,
        fontWeight: weight,
        fontSize,
        lineHeight,
        letterSpacing: tracking,
        transform: `translateY(${translateY}px)`,
        filter: `blur(${blur}px)`,
        opacity,
        willChange: "transform, filter, opacity",
        ...gradientStyle,
      }}
    >
      {children}
    </span>
  );
};
