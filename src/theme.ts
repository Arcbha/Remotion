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

/* -------------------------------------------------------------------------- */
/* Dark cinematic system — keynote / hero video (APPLE_MOTION.md §10, §12)      */
/* -------------------------------------------------------------------------- */

/**
 * The atmospheric void palette. Depth here comes from light, never from
 * strokes — these stops are the field the bloom and glow sit inside.
 */
export const cinematic = {
  void: "#010208", // Top-of-frame deep black
  abyss: "#04091a", // Upper-mid field
  deepBlue: "#0d3172", // Lower-mid field
  vividBlue: "#2f6ac2", // Lower field
  haze: "#6ea6dd", // Bottom haze / horizon
  neon: "#007fff", // Accent light source — cursors, rules
} as const;

/**
 * The full atmospheric backdrop: a radial bloom behind the subject over a
 * five-stop vertical field. Four-plus stops are mandatory — two-stop gradients
 * band visibly at 1080p.
 */
export const voidBloom =
  "radial-gradient(65% 45% at 50% 60%, rgba(42,112,222,0.35), transparent 72%)";

export const voidGradient =
  `linear-gradient(180deg, ${cinematic.void} 0%, ${cinematic.abyss} 42%, ` +
  `${cinematic.deepBlue} 74%, ${cinematic.vividBlue} 90%, ${cinematic.haze} 100%)`;

/** Bloom over field — assign straight to `background`. */
export const atmosphere = `${voidBloom}, ${voidGradient}`;

/**
 * The subtle internal fill for display type on the dark field — barely
 * perceptible cooling toward the baseline, never a rainbow. Pair with
 * `-webkit-background-clip: text` + transparent fill.
 */
export const textGradient =
  "linear-gradient(180deg, #ffffff 0%, #eaf1fb 52%, #cdddf5 100%)";

/**
 * Ambient light bleed off illuminated glyphs. Layered because real light falls
 * off across multiple radii — a tight core plus a wide, dimmer halo.
 */
export const textGlow =
  "drop-shadow(0 0 18px rgba(150,190,255,0.45)) drop-shadow(0 0 42px rgba(60,120,230,0.30))";

/** Emissive bloom for the neon rod — tight bright core, wide dim halo. */
export const neonBloom =
  "0 0 12px 2px rgba(0, 127, 255, 0.8), 0 0 24px 8px rgba(0, 127, 255, 0.4)";

export const fonts = {
  // Inter is the DESIGN.md-specified substitute for SF Pro Display / Text.
  display: "Inter, system-ui, -apple-system, sans-serif",
};

// Tight negative tracking on huge type is the signature Apple headline feel.
export const tracking = {
  display: "-1.44px", // 96px display
  headingLg: "-1.2px", // 80px
  headline: "-1.5px", // 82px headline — APPLE_MOTION.md §9 display scale
  heading: "-0.28px", // 56px
} as const;

/** Display type scale for the 1080×1920 vertical canvas (APPLE_MOTION.md §9). */
export const typeScale = {
  headline: { fontSize: 82, fontWeight: 600, lineHeight: 1.0 },
} as const;
