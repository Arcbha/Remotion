/**
 * Apple (España) style tokens — distilled from the DESIGN.md reference.
 * A near-monochrome system: ink on paper/canvas, a single blue accent,
 * and the signature chromatic-blue "primary ink" gradient used for emphasis.
 */

export const colors = {
  ink: "#1d1d1f", // Primary Ink — headlines, body
  midGray: "#707070", // Secondary text, muted labels
  deepGray: "#474747", // Nav text, medium emphasis
  hairline: "#d6d6d6", // Hairline borders
  canvas: "#f5f5f7", // Alternating gray band
  paper: "#ffffff", // Primary background, cards
  coolWash: "#e8e8ed", // Subtle button / dot fills
  quietDot: "#777779", // Inactive pagination dots
  electricBlue: "#0071e3", // Filled CTA accent — used sparingly
  linkBlue: "#0066cc", // Inline links, arrow chevrons
  ember: "#b64400", // Warm "Nuevo" badge accent
} as const;

/**
 * The chromatic "Primary Ink" gradient — dark ink fading through electric
 * blue. Reserved here for the emphasised words, the one place color is
 * allowed to bleed into the typography (mirrors the hero product gradient).
 */
export const inkGradient =
  "linear-gradient(184deg, #1d1d1f 20%, #0000f9 76%, #252525 95%)";

export const fonts = {
  // Inter is the DESIGN.md-specified substitute for SF Pro Display / Text.
  display: "Inter, system-ui, -apple-system, sans-serif",
};

// Tight negative tracking on huge type is the signature Apple headline feel.
export const tracking = {
  display: "-1.44px", // 96px display
  headingLg: "-1.2px", // 80px
  heading: "-0.28px", // 56px
} as const;
