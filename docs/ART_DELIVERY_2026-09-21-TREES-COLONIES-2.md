# Art delivery — colony trees II — 21 September 2026

`trees-colonies-2.png` closes the highest-priority savanna-tree gap and adds three bottomland hardwood families in the same painted, elevated style and scale as `trees-colonies-1`.

## Delivered

- Post oak: `post-oak-pole`, `post-oak-log`, `post-oak-large`
- Blackjack oak: `blackjack-pole`, `blackjack-log`, `blackjack-large`
- Pecan: `pecan-pole`, `pecan-log`, `pecan-large`
- Hackberry: `hackberry-pole`, `hackberry-log`, `hackberry-large`
- Sweetgum: `sweetgum-pole`, `sweetgum-log`, `sweetgum-large`
- General felled timber: `log-fallen-hardwood`

The five standing-tree families each have pole, log-size, and large silhouettes, anchored at the trunk foot. Their one-frame `-wind` clips preserve the library's existing presentation contract; they do not imply simulation motion. The felled log is intentionally static state art.

## Source and handling

The atlas was generated with built-in `image_gen.imagegen`, using `trees-colonies-1.png` as the style and scale reference. The accepted RGBA original was copied unchanged to `public/assets/frontier-v1/atlases/trees-colonies-2.png`. The exact prompt, generated-source path, runtime path, and review are in `scripts/art-deliveries/trees-colonies-2.mjs`.

## Validation

The delivery is designed as a strict four-column by four-row atlas with genuine transparent gutters and sixteen occupied cells. Validation uses the production `buildManifest()` measurement path without writing the shared generated manifests. Central registration and the full `npm run build:art` remain for the integrating task.
