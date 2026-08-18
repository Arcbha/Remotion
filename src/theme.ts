/**
 * Apple (España) style tokens — distilled from the DESIGN.md reference.
 * A near-monochrome system: ink on paper/canvas, a single blue accent,
 * and the signature chromatic-blue "primary ink" gradient used for emphasis.
 */

import { DISPLAY_WEIGHT, FONT_STACK } from "./fonts";

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
 * The atmospheric backdrop. The deep void owns ~85% of the frame; the blue
 * survives only as a faint floor reflection along the bottom edge, never as a
 * thick colour band. Six stops, because two-stop gradients band visibly at
 * 1080p and this field is almost entirely near-black.
 */
export const voidGradient =
  `linear-gradient(180deg, ${cinematic.void} 0%, #01030b 46%, #02050f 68%, ` +
  `#030916 84%, #0a2450 93%, #1e4f9e 100%)`;

/** The floor reflection — a wide, low bloom hugging the bottom edge. */
export const floorGlow =
  "radial-gradient(95% 26% at 50% 101%, rgba(47,106,194,0.50), transparent 72%)";

/** A very soft lift behind the subject so the centre of frame has volume. */
export const subjectBloom =
  "radial-gradient(58% 26% at 50% 50%, rgba(28,74,168,0.16), transparent 72%)";

/** Bloom over floor over field — assign straight to `background`. */
export const atmosphere = `${subjectBloom}, ${floorGlow}, ${voidGradient}`;

/**
 * An inert, accent-free ground for scenes with no light source in them.
 *
 * Composed only from the void palette: `abyss` lifts the top fractionally and
 * flattens into pure `void` across the lower half. Two reasons for the shape —
 * the ramp is kept short so its per-level step stays tight (a long, shallow
 * ramp is what bands at 1080p), and the flat lower region is where the densest,
 * dimmest type lands, so that text sits on the darkest ground available and
 * keeps its contrast headroom. Flat near-black also encodes cleanly in H.264,
 * where mosquito noise collects around busy, high-contrast regions.
 *
 * Deliberately carries no bloom, floor glow or accent — see `atmosphere` for
 * the lit variant.
 */
export const inertVoid =
  `linear-gradient(180deg, ${cinematic.abyss} 0%, ${cinematic.void} 45%, ` +
  `${cinematic.void} 100%)`;

/**
 * Full-intensity display ink on the dark field — the same white that opens
 * `textGradient`, named so type can be interpolated between it and
 * {@link systemGray} without a literal in the composition.
 */
export const displayInk = "#ffffff";

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

/**
 * Apple Ember — the keynote's warm accent, spent on a single emphasised word.
 * Vertical only, so it reads as one lit surface rather than a colour sweep.
 */
export const emberGradient = "linear-gradient(180deg, #ff9500 0%, #ff7a00 100%)";

/** Apple system gray — where an emphasised word settles once its beat is spent. */
export const systemGray = "#86868b";

/**
 * Ambient depth under display type.
 *
 * `apple-design` §12 gives one rule that bears on this: shadow is
 * context-aware — "heavier over busy/text content for separation, lighter over
 * plain backgrounds." This type sits on a plain, near-black void, so the
 * shadow is the light end of that scale; a heavy black shadow on a black field
 * does no work and only costs a filter pass.
 *
 * Strictly an ambient *cast* shadow. No bevel, emboss, inner shadow or
 * `inset` treatment appears anywhere in this system — depth comes from light
 * and layering, never from a fake edge on the glyph itself.
 */
export const keynoteShadow = "drop-shadow(0px 6px 14px rgba(0, 0, 0, 0.18))";

/**
 * Ambient bloom for the neon rod. Deliberately diffuse — a soft light source
 * bleeding into the void rather than a hard laser edge. Low opacity across two
 * wide radii is what reads as atmosphere.
 */
export const neonBloom =
  "0 0 20px 4px rgba(0, 127, 255, 0.25), 0 0 40px 10px rgba(0, 127, 255, 0.15)";

export const fonts = {
  /**
   * Re-exported from `src/fonts.ts`, which self-hosts the SF Pro Display
   * uprights. Every composition resolves the same stack — there is no second
   * family in the project.
   */
  display: FONT_STACK,
};

// Tight negative tracking on huge type is the signature Apple headline feel.
export const tracking = {
  display: "-1.44px", // 96px display
  headingLg: "-1.2px", // 80px
  headline: "-1.5px", // 82px headline — APPLE_MOTION.md §9 display scale
  heading: "-0.28px", // 56px
} as const;

/**
 * Display type scale for the 1080×1920 vertical canvas.
 *
 * Tracking and leading follow `apple-design` §15 (*The Details of UI
 * Typography*, WWDC 2020) rather than fixed pixels: "Tracking is size-specific
 * — never one value for all sizes… A fixed `letter-spacing` is wrong
 * somewhere", and spacing belongs in `em`, not `px`, so it scales with the
 * type. The skill's `.display` rule is `letter-spacing: -0.02em` with
 * `line-height: 1.05`, which is what is encoded here — at 82px that resolves to
 * −1.64px, satisfying APPLE_MOTION.md §9's "negative tracking that scales with
 * size" law for display ≥64px.
 */
/**
 * The APPLE_MOTION.md §9 display ladder for the 1080×1920 vertical canvas, as
 * discrete steps. `typeScale.headline` below is the large-headline step the
 * hero compositions are set in; this is the full ladder, for scenes that need
 * to travel between steps rather than sit on one.
 */
export const displayScale = {
  hero: 96,
  headlineLarge: 82,
  headline: 64,
  subhead: 48,
  body: 34,
  caption: 24,
} as const;

export const typeScale = {
  headline: {
    fontSize: 82,
    // SF Pro Display ships no upright Semibold — the bundled uprights are
    // Regular (400), Medium (500) and Bold (700) — so display headlines are set
    // in Bold. Requesting the unavailable 600 would make the browser pick 700
    // anyway; naming it keeps the intent explicit and avoids any faux-bold.
    fontWeight: DISPLAY_WEIGHT,
    lineHeight: 1.05,
    trackingEm: -0.02,
  },
} as const;
