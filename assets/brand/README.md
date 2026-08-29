# MoiCheck brand assets

## Colour

| Token | Hex | Use |
|---|---|---|
| Green | `#009639` | Primary. Pantone 355 — the green the province specifies for its flag, taken from the city's own green-and-white. |
| Green deep | `#00662A` | Pressed states, links on light backgrounds. |
| Green soft | `#8ED9AC` | Secondary strokes, resting states. |
| Mint | `#B6F2CE` | The tick on a green ground. |
| Ink | `#0E1A13` | Text. A near-black pulled slightly green so it sits with the accent. |

## Files

| File | Use |
|---|---|
| `lockup.svg` | Primary lockup, for light backgrounds. |
| `lockup-dark.svg` | Same, for dark backgrounds. |
| `moi-mark.svg` | The `moi` wordmark alone, no "check". |
| `favicon.svg` `favicon-32.png` `favicon-16.png` | Browser tab. Uses the **m** tile, not the full wordmark. |
| `apple-touch-icon.png` | 180×180, iOS home screen. |
| `icon-192.png` `icon-512.png` | PWA / manifest. |
| `icon-maskable-512.png` | Android maskable, content inside the 80% safe zone. |
| `oauth-logo-120.png` | Google OAuth consent screen. Everything sits inside the round crop. |
| `og-image.png` | 1200×630 share image. |

## Rules

- **Below 48px the icon drops to the `m` alone.** Three letters do not survive favicon sizes. Same tile, same green, one letter.
- **The tick is the dot on the i.** It is not a separate element and should not be enlarged or detached.
- The wordmark letterforms are drawn, not typeset. There is no font to install — use the SVGs. `check` is Outfit 600.
- Do not put the lockup on a mid-green background; use `lockup-dark.svg` on `#0E1A13` or on the primary green.
