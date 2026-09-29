// Visual identities for places outside the colony town layouts. The world still
// owns their positions, kinds and routes; these are schematic map cutouts only.
export const PLACE_SPRITES = Object.freeze({
  matamoros: 'town-mexican-river',
  laredo: 'town-mexican-river',
  'presidio-rio-grande': 'presidio-spanish',
  'san-patricio': 'village-irish-colony',
  'gaines-ferry': 'ferry-landing',
});

// stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the Mexican advance", item 4 - the advance's places (docs/MAP_ACCURACY.md
// §14), drawn by Claude ("Claude-drawn stand-ins", scripts/claude-art/areas/far-places.mjs) under the names the request asks
// for, so Astra's frames of those names replace them with no change here. Without the sheet they are named and not drawn,
// as before: drawSprite draws nothing for a frame it does not have.
export const STANDIN_PLACE_SPRITES = Object.freeze({
  staffords: 'plantation-sugar',
  'old-fort': 'blockhouse-village',
  'new-washington': 'townsite-bay',
  powells: 'tavern-house',
});

export const placeSprite = site => PLACE_SPRITES[site?.id] || STANDIN_PLACE_SPRITES[site?.id] || null;
