// Visual identities for places outside the colony town layouts. The world still
// owns their positions, kinds and routes; these are schematic map cutouts only.
export const PLACE_SPRITES = Object.freeze({
  matamoros: 'town-mexican-river',
  laredo: 'town-mexican-river',
  'presidio-rio-grande': 'presidio-spanish',
  'san-patricio': 'village-irish-colony',
  'gaines-ferry': 'ferry-landing',
});

export const placeSprite = site => PLACE_SPRITES[site?.id] || null;
