// The land's pictures, made off the page's main thread (2026-09-17, docs/PERFORMANCE_RENDER.md).
//
// The first draw of the real land smooths each grid of land classes and hillshade into a picture (`landPictureData`,
// public/map-base.js). On a Chromebook-slow CPU that was one task of about two seconds with the page frozen, straight after
// the map first appeared. Here it is the worker's: the page lays the ground down without the land's wash until the pictures
// come back, then draws them in.

import { landPictureData } from './map-base.js';

self.onmessage = event => {
  const { id, grid, palette, upscale } = event.data;
  const pictures = landPictureData(grid, palette, upscale);
  const transfer = [pictures.wash.data.buffer, ...(pictures.shade ? [pictures.shade.data.buffer] : [])];
  self.postMessage({ id, pictures }, transfer);
};
