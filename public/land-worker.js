// Smoothed pictures, made off the page's main thread (2026-09-17, docs/PERFORMANCE_RENDER.md, docs/PERFORMANCE_LOAD.md).
//
// The first draw of the real land smooths each grid of land classes and hillshade into a picture (`landPictureData`,
// public/map-base.js), and the woods' cover is smoothed from its tiles (public/woods-view.js). On a Chromebook-slow CPU the
// land was one task of about two seconds with the page frozen straight after the map first appeared, and each woods cover a
// third of a second. Here they are the worker's; the page's side is public/smooth-worker.js.
//
// `land`:  { grid, palette, upscale } → { pictures: { wash, shade } }
// `cover`: { columns, rows, colours (Float32Array, r g b a a cell, a 0 for none), upscale } → { picture }

import { landPictureData, smoothCover } from './map-base.js';

self.onmessage = event => {
  const { id, kind } = event.data;
  if (kind === 'cover') {
    const { columns, rows, colours, upscale } = event.data;
    const picture = smoothCover(columns, rows, (column, row) => {
      const at = (row * columns + column) * 4;
      return colours[at + 3] > 0 ? [colours[at], colours[at + 1], colours[at + 2], colours[at + 3]] : null;
    }, { upscale });
    self.postMessage({ id, picture }, [picture.data.buffer]);
    return;
  }
  const { grid, palette, upscale } = event.data;
  const pictures = landPictureData(grid, palette, upscale);
  const transfer = [pictures.wash.data.buffer, ...(pictures.shade ? [pictures.shade.data.buffer] : [])];
  self.postMessage({ id, pictures }, transfer);
};
