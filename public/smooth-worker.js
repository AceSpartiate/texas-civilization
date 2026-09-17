// Smoothing pictures off the page's main thread (2026-09-17, docs/PERFORMANCE_LOAD.md).
//
// The land's classes and hillshade (public/app.js `landPicture`) and the woods' cover (public/woods-view.js `coverRaster`)
// are grids blurred into soft pictures by `smoothCover` (public/map-base.js). On a Chromebook-slow CPU each was a task of a
// third of a second to two seconds with the page frozen. One worker (public/land-worker.js) does them all; this is the
// page's side of it.

let worker = null, job = 0;
const waiting = new Map();

/** Whether this page can smooth off the main thread: a browser with workers, not a test in node. */
export const canSmoothOffThread = () => typeof Worker === 'function' && typeof document !== 'undefined';

/** Send one job to the worker; resolves with its answer. `transfer` lists buffers handed over rather than copied. */
export function smoothOffThread(message, transfer = []) {
  if (!worker) {
    worker = new Worker('/land-worker.js', { type: 'module' });
    worker.onmessage = event => { const done = waiting.get(event.data.id); waiting.delete(event.data.id); done?.(event.data); };
  }
  const id = ++job;
  return new Promise(resolve => { waiting.set(id, resolve); worker.postMessage({ id, ...message }, transfer); });
}

/** A smoothed `{ width, height, data }` as a bitmap the canvas can draw, decoded off the main thread too. */
export const toBitmap = picture => picture ? createImageBitmap(new ImageData(picture.data, picture.width, picture.height)) : Promise.resolve(null);
