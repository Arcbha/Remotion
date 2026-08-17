import { continueRender, delayRender, staticFile } from "remotion";

/**
 * SF Pro Display — Apple's native display face, self-hosted from `public/fonts`.
 *
 * `apple-design` §15: "Default to the platform's system font before a custom
 * face; it already ships optical sizing, tracking tables, and legibility
 * tuning." SF Pro *is* that font for this design language. `-apple-system`
 * resolves to it natively on Apple hardware, but these compositions render in
 * headless Chromium on Linux where it does not exist, so the faces are bundled
 * to keep renders deterministic.
 *
 * Only the upright weights are registered. The display type is set in **Bold
 * (700)** — SF Pro Display ships no upright Semibold, so 700 is the weight the
 * asset set actually provides for headline work.
 */
export const SF_PRO_DISPLAY = "SF Pro Display";

/** Upright faces, mapped to their true CSS weights. */
const FACES = [
  { file: "SFPRODISPLAYREGULAR.OTF", weight: "400" },
  { file: "SFPRODISPLAYMEDIUM.OTF", weight: "500" },
  { file: "SFPRODISPLAYBOLD.OTF", weight: "700" },
] as const;

/**
 * Family stack. Each face is registered at its real weight so the browser
 * selects rather than synthesises — a faux-bold is exactly the kind of fake
 * thickening this design language rejects.
 */
export const FONT_STACK =
  `"${SF_PRO_DISPLAY}", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

/** The weight the display scale is set in. */
export const DISPLAY_WEIGHT = 700;

let loadPromise: Promise<boolean> | null = null;

/** Registers every upright face once per bundle. */
export const loadSFProDisplay = (): Promise<boolean> => {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (typeof FontFace === "undefined") return false;
    const loaded = await Promise.all(
      FACES.map(async ({ file, weight }) => {
        try {
          const face = new FontFace(
            SF_PRO_DISPLAY,
            `url(${staticFile(`fonts/${file}`)}) format("opentype")`,
            { weight, style: "normal", display: "block" }
          );
          await face.load();
          document.fonts.add(face);
          return true;
        } catch {
          return false;
        }
      })
    );
    return loaded.every(Boolean);
  })();

  return loadPromise;
};

/**
 * Blocks the frame until every face has resolved, so text is never measured or
 * painted against a fallback that is about to be replaced.
 */
export const waitForDisplayFont = (): Promise<boolean> => {
  const handle = delayRender("load-sf-pro-display");
  return loadSFProDisplay().then((ok) => {
    continueRender(handle);
    return ok;
  });
};
