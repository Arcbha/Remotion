# Fonts

## SF Pro Display

`src/fonts.ts` loads **`SFPRODISPLAYBOLD.OTF`** from this directory via
`staticFile("fonts/SFPRODISPLAYBOLD.OTF")`.

The file is **not committed** — SF Pro is a licensed Apple asset and is not
redistributable. Download it from
<https://developer.apple.com/fonts/> and place it here:

```
public/fonts/SFPRODISPLAYBOLD.OTF
```

No code change is needed; the next render picks it up.

### Until then

The load fails softly and the family stack in `src/fonts.ts` falls through to
**Inter** (the substitute documented in `APPLE_MOTION.md` §9). Renders keep
working and stay on-brand rather than dropping to an arbitrary system sans.

Remotion serves static assets from `public/`, which is why the font lives here
rather than in a top-level `fonts/`.
