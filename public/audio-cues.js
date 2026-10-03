// What the page hears, read off what it was sent and what it drew (docs/AUDIO.md §4). Pure: no Web Audio and no DOM, so
// every mapping from an event in the game to a sound is a unit test (tests/audio-cues.test.mjs).
//
// A sound is only ever made of something this page was already given. The bell is rung for a family whose own person
// heard it at Béxar (FIC-GONZ-622: the report's source is that person, "at Béxar") or that is watching the Alamo's first
// phase; a family told of it later by a rider gets the rider's news, not the bell. Nothing here asks the server for
// anything, so no sound can carry knowledge the page did not have.
import { galeForce, weatherMix } from './weather-art.js';
import { hearShots, placeSound } from './audio-mix.js';

/** A small fixed generator, so a page's rhythms (and a test's) are the same run to run. */
function generator(seed = 0x5eed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}

export function createCueState(seed) {
  return {
    first: true, random: generator(seed), reports: new Set(), alerts: new Set(), encounters: new Set(), requests: new Set(), asks: new Set(),
    pressing: new Set(), lines: new Set(), captions: new Set(), bell: false, crying: new Set(), shots: new Set(), felling: new Map(), chores: new Set(),
    next: new Map(), thunderAt: null,
  };
}

const AXE_WORK = new Set(['fell-trees', 'fetch-logs', 'clear-plot', 'fence-plot']);
const RAISING = new Set(['build-house', 'help-raise']);
const HENS = new Set(['child-hens', 'child-eggs']);
const bugleCall = text => /parley/i.test(text) ? 'parley' : /retreat/i.test(text) ? 'assembly' : 'attack';
const pointOf = thing => thing && Number.isFinite(thing.x) && Number.isFinite(thing.y) ? { x: thing.x, y: thing.y } : null;

/** Everybody the page may hear working: a student's own family, or every person on the Host's map. */
export function peopleHeard(world) {
  return world?.role === 'host' ? [...(world.others || [])] : [...(world?.entities || [])];
}

/**
 * The sounds a new snapshot brings: things that happen once (a question, the bell, a bugle, the baby starting to cry).
 * The first snapshot a page is given only remembers what is already there - a page opened in the middle of a class does
 * not play every question and report it arrives to.
 * Returns `[{ id, opts?, entity?, point? }]`: `entity` an id to place the sound at (where it is drawn), `point` a place on
 * the map in miles.
 */
export function snapshotCues(state, snapshot) {
  const world = snapshot?.world;
  if (!world) return [];
  const cues = [];
  const quiet = state.first;
  const add = cue => { if (!quiet) cues.push(cue); };
  // News: a report new to this page. One sound however many came at once.
  let news = false;
  for (const report of world.reports || []) {
    const key = `${report.topicId}:${report.receivedMinute}:${report.source || ''}`;
    if (state.reports.has(key)) continue;
    state.reports.add(key);
    if (report.topicId === 'bexar-arrival' && /at B[ée]xar/i.test(report.source || '')) { if (!state.bell) { state.bell = true; add({ id: 'bell', opts: { strikes: 10, apart: 0.6 } }); } } else news = true;
  }
  const alert = world.battleAlert;
  if (alert?.id && !state.alerts.has(alert.id)) {
    state.alerts.add(alert.id);
    if (/\bbell\b/i.test(alert.title || '')) { if (!state.bell) { state.bell = true; add({ id: 'bell', opts: { strikes: 10, apart: 0.6 } }); } } else news = true;
  }
  if (news) add({ id: 'news' });
  // The battle's own words: the bell at the Alamo's first minute, a bugler's calls, and a drum only where the history
  // puts one (no drum line exists yet: HIST-TEX-480, docs/ART_REQUESTS.md "a bugler and a drummer").
  const battle = world.battle?.sides ? world.battle : null;
  if (battle) {
    const mexican = pointOf(battle.sides.find(side => side.side === 'mexican')) || pointOf(battle.sides[0]);
    for (const line of battle.lines || []) {
      const key = `${battle.id}:${line.id}`;
      if (state.lines.has(key)) continue;
      state.lines.add(key);
      if (line.id === 'a-bell') { if (!state.bell) { state.bell = true; add({ id: 'bell', opts: { strikes: 10, apart: 0.6 } }); } } else if (line.role === 'bugler') add({ id: 'bugle', opts: { call: bugleCall(line.text) }, point: mexican });
      else if (/\bdrum/i.test(line.text || '')) add({ id: 'drum', opts: { pattern: 'roll' }, point: pointOf(battle.sides.find(side => side.side === line.side)) || mexican });
    }
    const key = `${battle.id}:${battle.phase}`;
    if (!state.captions.has(key)) {
      state.captions.add(key);
      if (/\bbugles? (?:sound|sounding)/i.test(battle.caption || '') && !(battle.lines || []).some(line => line.role === 'bugler')) add({ id: 'bugle', opts: { call: bugleCall(battle.caption) }, point: mexican });
    }
  }
  // A question put to the family: a rider's meeting, a call, the road's ask. ¡Alto! is its own sound.
  const encounter = world.encounter;
  if (encounter?.id && encounter.status === 'open' && !state.encounters.has(encounter.id)) { state.encounters.add(encounter.id); add({ id: 'question' }); }
  const request = world.request;
  const requestKey = request && (request.id || `${request.kind}:${request.openedMinute ?? ''}`);
  if (request && !request.lapsed && requestKey && !state.requests.has(requestKey)) { state.requests.add(requestKey); add({ id: 'question' }); }
  const ask = world.flight?.ask;
  if (ask?.id) {
    const key = `${ask.id}:${ask.openedMinute ?? ''}`;
    if (!state.asks.has(key)) { state.asks.add(key); add(ask.id === 'alto' ? { id: 'alto', point: pointOf(world.flight.chase) } : { id: 'question' }); }
  }
  // A question about to lapse: said once, when it first turns pressing.
  const pressingNow = new Set();
  if (request?.pressing) pressingNow.add(`request:${requestKey}`);
  if (encounter?.pressing) pressingNow.add(`encounter:${encounter.id}`);
  const people = peopleHeard(world);
  for (const person of people) {
    if (person.pressing) pressingNow.add(`person:${person.id}`);
    const chore = person.chore;
    if (chore?.ask) {
      const key = `${person.id}:${chore.id}:${chore.ask.id || chore.ask.text || ''}`;
      if (!state.asks.has(key)) { state.asks.add(key); add({ id: 'question' }); }
    }
  }
  if ([...pressingNow].some(key => !state.pressing.has(key))) add({ id: 'lapse' });
  state.pressing = pressingNow;
  // The family's own: a baby crying (while it cries, the mixer lets it be heard again every so often), a shot at a hunt, a
  // tree that has gone over (the felling moves on to the next tree).
  const crying = new Set();
  for (const person of people) {
    if (person.baby?.state === 'cry') { crying.add(person.id); add({ id: 'baby', entity: person.id }); }
    const chore = person.chore;
    if (!chore) continue;
    // A shot the student aimed was heard on their own page when they fired it (public/hunt-aim.js), not again a tick later.
    if (chore.doing === 'the shot' && !(chore.flags || []).includes('aimed')) {
      const key = `${person.id}:${world.tick ?? world.minute}`;
      if (!state.shots.has(key)) { state.shots.add(key); add({ id: 'musket', entity: person.id }); }
    }
    if (chore.id === 'fell-trees' || chore.id === 'fetch-logs') {
      const was = state.felling.get(person.id);
      if (was && was !== chore.doing && /fell/i.test(was)) add({ id: 'tree-fall', entity: person.id });
      state.felling.set(person.id, chore.doing);
    } else state.felling.delete(person.id);
  }
  state.crying = crying;
  if (state.shots.size > 200) state.shots = new Set([...state.shots].slice(-100));
  state.first = false;
  return cues;
}

/** Whether `key`'s turn has come, and when it next comes: every `every` ms, give or take a quarter. */
function due(state, key, now, every) {
  const next = state.next.get(key);
  if (next !== undefined && now < next) return false;
  // A rhythm starting up is not all heard on the same frame: its first turn lands somewhere in its first interval.
  if (next === undefined) { state.next.set(key, now + state.random() * every); return false; }
  state.next.set(key, now + every * (0.8 + 0.4 * state.random()));
  return true;
}

/**
 * The sounds of one drawn frame: the shots the battle and a chase drew, the order a chase called, and - four times a second
 * at most, the caller decides - the rhythm of work and travel near the camera and the level of each lasting sound.
 * `input`: `{ world, camera, size, drawnAt, battle, chase, ambient }`, where `camera` has `toScreen` and `figure`, `size`
 * is the canvas, `drawnAt` a Map of entity id to where it was drawn this frame, `battle` and `chase` what their views
 * returned. Returns `{ cues: [{ id, gain, pan, far, opts }], beds: { rain, wind, river, fire } | null }`.
 */
export function frameCues(state, input, now) {
  const { world, camera, size, drawnAt, battle, chase, ambient = true } = input;
  const figure = camera?.figure ?? 24;
  const cues = [];
  for (const shot of hearShots([...(battle?.heard || []), ...(chase?.heard || [])], size, figure)) cues.push(shot);
  for (const said of chase?.spoken || []) if (said.id === 'alto') cues.push({ id: 'alto', ...placeSound(said, size, figure) });
  if (!ambient || !world || !camera?.toScreen) return { cues, beds: null };
  const placedAt = spot => ({ ...placeSound(spot, size, figure) });
  // Work and travel: each person, animal and wagon drawn this frame with something to be heard, nearest first, a few of each.
  const heard = [];
  for (const one of peopleHeard(world)) {
    const spot = drawnAt?.get?.(one.id);
    if (!spot) continue;
    const place = placedAt(spot);
    if (place.gain < 0.05) continue;
    heard.push({ one, place });
  }
  heard.sort((a, b) => b.place.gain - a.place.gain);
  const seen = new Set(), counts = {};
  const emit = (key, id, every, place, opts, limit = 2) => {
    if ((counts[id] || 0) >= limit) return;
    counts[id] = (counts[id] || 0) + 1;
    if (due(state, key, now, every)) cues.push({ id, ...place, ...(opts && { opts }) });
  };
  for (const { one, place } of heard) {
    if (seen.has(one.id)) continue;
    seen.add(one.id);
    const chore = one.chore, doing = chore?.doing || '', moving = one.travel && !one.travel.halted;
    if (chore && AXE_WORK.has(chore.id) && /fell|chop|split|grub|clearing|timber/i.test(doing)) emit(`axe:${one.id}`, 'axe', 1250, place);
    else if (chore && RAISING.has(chore.id)) emit(`hammer:${one.id}`, 'hammer', 950, place);
    else if (chore && HENS.has(chore.id)) emit(`hens:${one.id}`, 'hens', 16000, place, null, 1);
    if (!moving) continue;
    if (one.kind === 'wagon') emit(`wagon:${one.id}`, 'wagon', 2300, place, null, 1);
    else if (one.kind === 'animal' && (one.species === 'horse' || one.species === 'mule')) emit(`hoof:${one.id}`, 'hoof', 520, place, { gait: one.travel.speed > 5 ? 'gallop' : 'trot' });
    else if (one.kind === 'animal' && one.species === 'ox') emit(`ox:${one.id}`, 'ox', 22000, place, null, 1);
    else if (one.kind === 'person' && (one.travel.mode === 'horse' || one.travel.mode === 'mule') && one.travel.saddle) emit(`hoof:${one.id}`, 'hoof', 520, place, { gait: 'trot' });
    else if (one.kind === 'person' && (one.travel.mode === 'foot' || one.travel.afoot) && !one.travel.carried && figure >= 30) emit(`step:${one.id}`, 'step', 560, { ...place, gain: place.gain * 0.8 }, { vary: state.random() }, 1);
  }
  // The family's cattle, grazing by the house (drawn there, public/app.js; the herd is not an entity yet).
  const home = homeOf(world);
  if (home && (world.role === 'host' ? false : world.household?.stock && !world.land?.arriving)) {
    const place = placedAt(camera.toScreen(home));
    if (place.gain > 0.08 && due(state, 'cattle', now, 38000)) cues.push({ id: 'cattle', ...place });
  }
  // The lasting sounds, at the middle of what the camera shows.
  const centre = { x: camera.cx, y: camera.cy };
  const mix = world.weather ? weatherMix(world.weather, centre.x, world.minute) : null;
  const zoom = Math.max(0.35, Math.min(1, figure / 26));
  const onRoad = world.flight && ['fled', 'refuged'].includes(world.flight.status) ? world.flight.weather : null;
  const rain = Math.max(mix ? Math.min(1, mix.rain) : 0, onRoad === 'rain' || onRoad === 'storm' ? 0.8 : 0);
  const windForce = mix ? Math.max(galeForce(mix), Math.hypot(mix.wind.x, mix.wind.y) * 0.6) : 0;
  const wind = Math.max(0, Math.min(1, (windForce - 0.2) / 0.7));
  const storm = Math.max(mix?.storm || 0, onRoad === 'storm' ? 0.8 : 0);
  if (storm > 0.25) {
    state.thunderAt ??= now + 4000 + state.random() * 8000;
    if (now >= state.thunderAt) { cues.push({ id: 'thunder', gain: Math.min(1, 0.4 + storm * 0.6), pan: (state.random() - 0.5) * 0.8, far: storm < 0.6 ? 1 : 0, opts: { far: storm < 0.6 } }); state.thunderAt = now + 12000 + state.random() * 16000; }
  } else state.thunderAt = null;
  const river = riverLevel(world, camera, size) * zoom;
  const fire = fireLevel(world, camera, size, home);
  return { cues, beds: { rain: +rain.toFixed(3), wind: +wind.toFixed(3), river: +river.toFixed(3), fire: +fire.toFixed(3) } };
}

function sitesOf(world) {
  const sites = world?.map?.sites;
  return Array.isArray(sites) ? sites : sites ? Object.values(sites) : [];
}
/** Where this family's house stands, in miles, or null. */
export function homeOf(world) {
  const id = world?.household?.homeSiteId;
  return id ? pointOf(sitesOf(world).find(site => site.id === id)) : null;
}
/**
 * How loud the water is: the nearest river or creek line, or a ford, ferry or bridge, to the middle of the screen.
 * ceiling: the map's own water lines and crossings only - on the fine land the rivers the page draws come from the land's
 * levels (public/land-levels.js), which this does not read; a crossing is where a family meets the water anyway.
 */
export function riverLevel(world, camera, size) {
  if (!camera?.toScreen || !size?.width) return 0;
  const cx = size.width / 2, cy = size.height / 2, reach = Math.hypot(cx, cy) * 0.6;
  let best = Infinity;
  for (const line of world?.map?.terrain || []) {
    if (!['river', 'creek'].includes(line.kind) || !Array.isArray(line.points)) continue;
    const pts = line.points.map(p => camera.toScreen(Array.isArray(p) ? { x: p[0], y: p[1] } : p));
    for (let i = 1; i < pts.length; i++) best = Math.min(best, segmentDistance({ x: cx, y: cy }, pts[i - 1], pts[i]) * (line.kind === 'creek' ? 1.6 : 1));
  }
  for (const site of sitesOf(world)) if (['ford', 'ferry', 'bridge'].includes(site.kind)) {
    const p = camera.toScreen(site);
    best = Math.min(best, Math.hypot(p.x - cx, p.y - cy));
  }
  return best === Infinity ? 0 : Math.max(0, 1 - best / reach);
}
function segmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
/** How loud fire is: a burning town or farm, the family's camp fire, the road camp. */
export function fireLevel(world, camera, size, home = homeOf(world)) {
  if (!camera?.toScreen || !size?.width) return 0;
  const figure = camera.figure ?? 24;
  let level = 0;
  for (const fire of world?.fires || []) level = Math.max(level, placeSound(camera.toScreen(fire), size, figure).gain * (fire.kind === 'town' ? 1 : 0.8));
  if (home && world?.land?.shelter === 'camp') level = Math.max(level, placeSound(camera.toScreen(home), size, figure).gain * 0.6);
  if (world?.flight?.camp && ['fled', 'refuged'].includes(world.flight.status)) level = Math.max(level, 0.45);
  return Math.max(0, Math.min(1, level));
}

/**
 * Which music a page plays (public/audio-music.js `MOODS`): the ending once the class has ended with its story; the title
 * in the lobby and while a family is being made; a battle while one is fought in front of the page; the Scrape while the
 * family is on the road east; war while the war has reached this family (a call to arms, a man with the army, the alarm);
 * the farm otherwise. The Host follows the class's war by its date, not any one family's.
 */
export function moodFor(world, { creating = false, wedding = false } = {}) {
  if (!world) return 'title';
  if (world.status === 'ended' && world.ending && (world.ending.family || world.ending.host)) return 'ending';
  if (world.status === 'lobby' || creating) return 'title';
  // The lone parent's wedding and the family by its new house (public/courtship.js marks the page while those scenes are shown).
  if (wedding) return 'wedding';
  const battle = world.battle?.sides ? world.battle : null;
  if (battle && !battle.over) return 'battle';
  if (world.role === 'host') {
    const date = world.historicalDate || '';
    if (date >= '1836-03-11' && date <= '1836-04-22') return 'scrape';
    if (date >= '1835-10-01') return 'war';
    return 'farm';
  }
  if (world.flight && ['fled', 'refuged'].includes(world.flight.status)) return 'scrape';
  if (world.army || world.battleAlert || ['call', 'march'].includes(world.request?.kind)) return 'war';
  return 'farm';
}
