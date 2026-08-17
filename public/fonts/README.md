# Fonts

## SF Pro Display

Self-hosted and loaded by [`src/fonts.ts`](../../src/fonts.ts) through
`staticFile()` + the CSS Font Loading API, gated with `delayRender` so no frame
is measured or painted against a fallback.

| File | Registered weight |
|---|---|
| `SFPRODISPLAYREGULAR.OTF` | 400 |
| `SFPRODISPLAYMEDIUM.OTF` | 500 |
| `SFPRODISPLAYBOLD.OTF` | 700 |

Each face is registered at its **true** weight so the browser selects rather
than synthesises — a faux-bold is exactly the fake thickening this design
language rejects.

SF Pro Display ships no upright Semibold, so display headlines are set in
**Bold (700)** via `DISPLAY_WEIGHT`.

The italic cuts are not bundled; nothing in the project sets italic type. They
remain on `claude/remotion-motion-graphics-2ua2qf` under `public/fontss/` if
ever needed.

`-apple-system` resolves to SF Pro natively on Apple hardware, but these
compositions render in headless Chromium on Linux where it does not exist —
hence the bundled faces, which keep renders deterministic.

## Licensing

SF Pro is an Apple asset governed by Apple's font licence
(<https://developer.apple.com/fonts/>). It is committed here for rendering only;
check the licence before redistributing this repository publicly.
