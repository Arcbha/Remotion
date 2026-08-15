import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../theme";

/**
 * A heavy black text cursor. It blinks on a steady ~2Hz cycle and is rendered
 * inline so it trails whatever text precedes it. There is no fade — it is
 * simply on or off, and (via the `visible` gate) it can vanish instantly.
 */
export const Cursor: React.FC<{ visible: boolean }> = ({ visible }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0;

  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: "0.78em",
        marginLeft: 8,
        backgroundColor: colors.ink,
        transform: "translateY(0.09em)",
        opacity: visible ? blink : 0,
        verticalAlign: "baseline",
      }}
    />
  );
};
