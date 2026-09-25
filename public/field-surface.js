// Field surfaces are native canvas art, drawn from the already-permitted field state.
// All variation is rooted in plot identity, never screen position or the render clock.
const layouts = new Map();
let grain = null;
function soilGrain(ctx) {
  if (grain) return grain;
  grain = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(256, 256) : ctx.canvas.ownerDocument.createElement('canvas');
  grain.width = grain.height = 256;
  const g = grain.getContext('2d'), pixels = g.createImageData(256, 256);
  let seed = 1735;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const light = seed >>> 31;
    pixels.data[i] = light ? 238 : 43; pixels.data[i + 1] = light ? 213 : 32; pixels.data[i + 2] = light ? 157 : 20;
    pixels.data[i + 3] = ((seed >>> 17) & 127) * .3;
  }
  g.putImageData(pixels, 0, 0);
  return grain;
}
export function fieldLayout(identity = 'field') {
  const key = String(identity);
  if (layouts.has(key)) return layouts.get(key);
  let seed = 2166136261;
  for (const letter of key) seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619) >>> 0;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const edge = [];
  for (let side = 0; side < 4; side++) for (let i = 0; i < 24; i++) {
    const t = .03 + (i / 24) * .94, inset = .025 + random() * .014;
    edge.push(side === 0 ? [t, inset] : side === 1 ? [1 - inset, t] : side === 2 ? [1 - t, 1 - inset] : [inset, 1 - t]);
  }
  const clods = Array.from({ length: 220 }, () => ({ x: random(), y: random(), size: .0015 + random() * .005, light: random() > .55 }));
  const rows = Array.from({ length: 14 }, (_, row) => ({ y: .13 + row * .057, bend: (random() - .5) * .016, inset: .055 + random() * .025 }));
  const plants = rows.flatMap((row, r) => Array.from({ length: 15 }, (_, col) => ({
    x: .075 + col * .06 + (random() - .5) * .012, y: row.y + (random() - .5) * .009,
    size: .82 + random() * .24, variant: (r + col) % 3,
  })));
  const result = { edge, clods, rows, plants };
  // A long classroom can survey arbitrarily many plots without growing this cache forever.
  if (layouts.size >= 256) layouts.delete(layouts.keys().next().value);
  layouts.set(key, result);
  return result;
}

/** Rough margins stay inside the surveyed rectangle. This does not change acreage or hit testing. */
export function drawFieldSurface(ctx, bounds, { identity, growing = null, figure = 24, drawSprite = () => false, clearing = false } = {}) {
  const { left, top, right, bottom } = bounds, w = right - left, h = bottom - top;
  if (!(w > 0 && h > 0)) return;
  const detail = Math.min(w, h), layout = fieldLayout(identity);
  const trace = () => {
    ctx.beginPath();
    layout.edge.forEach(([x, y], i) => i ? ctx.lineTo(left + x * w, top + y * h) : ctx.moveTo(left + x * w, top + y * h));
    ctx.closePath();
  };
  ctx.save();
  // Turf lip, earth shadow and sunlit cut edge soften the survey-square silhouette.
  trace(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1, detail * .025); ctx.strokeStyle = '#637644'; ctx.stroke();
  ctx.lineWidth = Math.max(.8, detail * .009); ctx.strokeStyle = '#434b2c'; ctx.stroke();
  const soil = ctx.createLinearGradient(left, top, right, bottom);
  soil.addColorStop(0, '#a18758'); soil.addColorStop(.45, '#947448'); soil.addColorStop(1, '#80633e');
  ctx.fillStyle = soil; ctx.fill(); ctx.clip();
  if (detail > 18) {
    // Broad patches break up the uniform fill before small clods and the plough ridges.
    for (let i = 0; i < 24; i++) {
      const c = layout.clods[i];
      ctx.fillStyle = c.light ? '#c0a37018' : '#513d2615';
      ctx.beginPath(); ctx.ellipse(left + c.x * w, top + c.y * h, w * .10, h * .035, -.12, 0, Math.PI * 2); ctx.fill();
    }
    if (!clearing) for (const row of layout.rows) {
      const line = offset => {
        ctx.beginPath(); ctx.moveTo(left + row.inset * w, top + row.y * h + offset);
        ctx.bezierCurveTo(left + w * .33, top + (row.y + row.bend) * h + offset,
          left + w * .68, top + (row.y - row.bend) * h + offset, right - row.inset * w, top + row.y * h + offset);
      };
      ctx.lineCap = 'round';
      line(-h * .005); ctx.strokeStyle = '#b49a622b'; ctx.lineWidth = Math.max(1, h * .035); ctx.stroke();
      line(0); ctx.strokeStyle = '#62472f70'; ctx.lineWidth = Math.max(.7, h * .011); ctx.stroke();
      line(-h * .008); ctx.strokeStyle = '#c2a16a88'; ctx.lineWidth = Math.max(.5, h * .004); ctx.stroke();
      line(h * .009); ctx.strokeStyle = '#73523244'; ctx.lineWidth = Math.max(.5, h * .004); ctx.stroke();
    }
    if (detail > 60) ctx.drawImage(soilGrain(ctx), left, top, w, h);
    for (const c of layout.clods) {
      ctx.fillStyle = c.light ? '#dac08b55' : '#48372255';
      ctx.beginPath(); ctx.ellipse(left + c.x * w, top + c.y * h, Math.max(.35, w * c.size), Math.max(.25, h * c.size * .45), -.2, 0, Math.PI * 2); ctx.fill();
    }
    if (growing && growing.state !== 'bare' && !clearing) {
      const ripe = growing.state === 'ripe', cotton = growing.crop === 'cotton';
      const crop = `${growing.crop}-${ripe ? 'mature' : 'young'}`;
      const height = Math.min(figure * (ripe ? .8 : .55), detail * (ripe ? .078 : .055));
      if (detail < 70) {
        // At settlement scale, resolve rows instead of hundreds of subpixel leaves.
        ctx.strokeStyle = ripe ? (cotton ? '#dcd9ab' : '#829049') : '#637b3e';
        ctx.lineWidth = Math.max(.6, h * .022);
        for (const row of layout.rows) {
          ctx.beginPath(); ctx.moveTo(left + w * row.inset, top + h * row.y);
          ctx.lineTo(right - w * row.inset, top + h * row.y); ctx.stroke();
        }
      } else {
      // At close range use the game's existing crop art; fine rows still read as plants when zoomed out.
      for (const p of layout.plants) {
        const x = left + p.x * w, y = top + p.y * h, size = height * p.size;
        ctx.fillStyle = '#3b39234d'; ctx.beginPath(); ctx.ellipse(x + size * .1, y, size * .28, size * .10, 0, 0, Math.PI * 2); ctx.fill();
        if (size > 7 && drawSprite(ctx, crop, x, y, size)) continue;
        ctx.strokeStyle = ripe && !cotton ? '#798441' : '#3f6334'; ctx.lineWidth = Math.max(.7, size * .12);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - size * .8); ctx.stroke();
        ctx.fillStyle = ripe && !cotton ? '#9da457' : '#779747';
        ctx.beginPath(); ctx.ellipse(x - size * .18, y - size * .4, size * .3, size * .11, .5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + size * .18, y - size * .58, size * .3, size * .11, -.5, 0, Math.PI * 2); ctx.fill();
        if (ripe) {
          ctx.fillStyle = cotton ? '#eee2bd' : '#d3b15e';
          ctx.beginPath(); ctx.ellipse(x, y - size * .75, size * (cotton ? .23 : .08), size * .18, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      }
    }
  }
  ctx.restore();
  // Grass teeth on the rim, not a solid green border, blend into the surrounding ground.
  if (detail > 35) {
    ctx.save(); ctx.lineWidth = Math.max(.55, detail * .002);
    layout.edge.forEach(([x, y], i) => {
      if (i % 2) return;
      const px = left + x * w, py = top + y * h, blade = detail * (.008 + layout.clods[i].size);
      ctx.strokeStyle = i % 4 ? '#8b9b53' : '#536b3b';
      ctx.beginPath(); ctx.moveTo(px - blade * .6, py); ctx.lineTo(px - blade, py - blade); ctx.moveTo(px, py + blade * .2); ctx.lineTo(px + blade * .3, py - blade * 1.1); ctx.stroke();
    });
    ctx.restore();
  }
}
