import { continueRender, delayRender, staticFile } from "remotion";

/**
 * SF Pro Display — Apple's native display face.
 *
 * `apple-design` §15 is explicit that the platform's system font is the default
 * and a custom face needs a reason: "Default to the platform's system font
 * before a custom face; it already ships optical sizing, tracking tables, and
 * legibility tuning." SF Pro *is* that font for this design language, so it is
 * loaded from the repo rather than substituted.
 *
 * The OTF is a licensed Apple asset and is not redistributable, so it is not
 * committed. Drop it at `public/fonts/SFPRODISPLAYBOLD.OTF` and it is picked up
 * on the next render with no code change.
 *
 * If the file is absent the load fails softly and {@link FONT_STACK} falls
 * through to Inter, so a render never hangs on a missing asset and never
 * silently degrades to a random system sans.
 */
export const SF_PRO_DISPLAY = "SF Pro Display";

export const SF_PRO_PATH = "fonts/SFPRODISPLAYBOLD.OTF";

/**
 * Family stack. SF Pro Display first, Inter as the documented substitute, then
 * the platform faces. Ordering is the whole safety net: whichever is present
 * wins, and glyph metrics are measured against the same stack that renders.
 */
export const FONT_STACK =
  `"${SF_PRO_DISPLAY}", Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

let loadPromise: Promise<boolean> | null = null;

/**
 * Registers the face once per bundle. Declared across the full weight range so
 * a single static OTF satisfies any requested weight without the browser
 * synthesising a faux-bold — synthetic weight is exactly the "skeuomorphic
 * thickening" the design language rejects.
 */
export const loadSFProDisplay = (): Promise<boolean> => {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (typeof FontFace === "undefined") return false;
    try {
      const face = new FontFace(
        SF_PRO_DISPLAY,
        `url(${staticFile(SF_PRO_PATH)}) format("opentype")`,
        { weight: "100 900", style: "normal", display: "block" }
      );
      await face.load();
      document.fonts.add(face);
      return true;
    } catch {
      // Asset absent or unreadable — fall through to Inter.
      return false;
    }
  })();

  return loadPromise;
};

/**
 * Blocks the frame until the face has resolved either way, so text is never
 * measured or painted against a fallback that is about to be replaced.
 */
export const waitForDisplayFont = (): Promise<boolean> => {
  const handle = delayRender("load-sf-pro-display");
  return loadSFProDisplay().then((ok) => {
    continueRender(handle);
    return ok;
  });
};
