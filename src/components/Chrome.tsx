import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../theme";

/**
 * A quiet eyebrow label — the Apple "Nuevo"-style punctuation that sits above
 * a hero headline. Mid-gray, tiny, wide-set: it frames the type without
 * competing for attention.
 */
export const Eyebrow: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame - delay, [0, 18], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: 500,
        fontSize: 22,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: colors.midGray,
        opacity,
        transform: `translateY(${y}px)`,
        marginBottom: 44,
      }}
    >
      {text}
    </div>
  );
};

/**
 * Dot pagination indicator, straight from the reference: ~small circles, the
 * active one in ink, the rest in the quiet gray. It steps forward as each
 * line of the thought resolves.
 */
export const Pagination: React.FC<{
  count: number;
  activeStops: number[];
}> = ({ count, activeStops }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let active = 0;
  activeStops.forEach((stop, i) => {
    if (frame >= stop) active = i;
  });

  const appear = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200 },
    durationInFrames: 24,
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        opacity: appear,
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <div
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: isActive ? colors.ink : colors.quietDot,
              opacity: isActive ? 1 : 0.55,
              transition: "none",
            }}
          />
        );
      })}
    </div>
  );
};
