import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sampleClip } from '../public/art.js';
import { ProjectionMotion, entityClip, visualVariant, travelDirection } from '../public/motion.js';
import { buildAnimations, buildManifest, root } from '../scripts/build-atlas-manifest.mjs';
import { buildRegistry } from '../scripts/art-registry.mjs';

test('all animation references and timings match the shipped art; authored clips contain distinct poses', () => {
  const atlas = buildManifest(), animation = buildAnimations(atlas);
  assert.deepEqual(animation, JSON.parse(readFileSync(root + 'animation.json', 'utf8')));
  assert.deepEqual(buildRegistry(atlas,animation),JSON.parse(readFileSync(root+'manifest.json','utf8')));
  assert.ok(Object.values(animation.clips).filter(c => c.authored).length >= 30);
  for (const clip of Object.values(animation.clips)) {
    const duration = clip.frames.reduce((n, f) => n + f.duration, 0);
    assert.equal(sampleClip(clip, 0).sprite, clip.frames[0].sprite);
    assert.equal(sampleClip(clip, duration).sprite, clip.frames[clip.loop ? 0 : clip.frames.length - 1].sprite);
    assert.deepEqual(sampleClip(clip, 120, true), sampleClip(clip, 50000, true));
    assert.deepEqual(sampleClip(clip, 120, false, true), sampleClip(clip, 50000, false, true));
    assert.ok(clip.frames.every(f => atlas.frames[f.sprite]));
    if (clip.authored && /walk|march|carry|work/.test(clip.frames[0].sprite)) {
      assert.equal(new Set(clip.frames.map(f => atlas.frames[f.sprite].logicalHeight)).size, 1, 'pose scale stays registered');
    }
  }
});

test('display interpolation follows known bends, drops concealed actors, and snaps across time jumps', () => {
  const view = new ProjectionMotion();
  const entity = progress => ({ id: 'person-a', location: { x: progress < 1 ? progress : 1, y: Math.max(0, progress - 1), siteId:null }, travel: { from:'a',to:'b',progress,distance:2,points:[{x:0,y:0},{x:1,y:0},{x:1,y:1}] } });
  const snapshot = (tick, entities) => ({sessionId:'test',revision:tick,world:{tick,status:'running',entities}});
  view.accept(snapshot(1,[entity(.5)]), 1000); view.accept(snapshot(2,[entity(1.5)]), 2000);
  assert.deepEqual(view.position(entity(1.5),2250), {x:.75,y:0});
  assert.deepEqual(view.position(entity(1.5),2750), {x:1,y:.25});
  assert.deepEqual(view.position(entity(1.5),9000), {x:1,y:.5});
  view.accept(snapshot(50,[entity(1.7)]),3000);
  assert.deepEqual(view.position(entity(1.7),3000), entity(1.7).location);
  view.accept(snapshot(51,[]),4000); assert.equal(view.records.size,0);
  view.accept({...snapshot(52,[entity(1.8)]),sessionId:'new'},5000);
  assert.equal(view.records.get('person-a').previous, null);
  view.accept({...snapshot(60,[entity(.5)]),world:{...snapshot(60,[entity(.5)]).world,minute:20}},6000);
  view.accept({...snapshot(61,[entity(1.5)]),world:{...snapshot(61,[entity(1.5)]).world,minute:14420}},7000);
  assert.equal(view.records.get('person-a').previous,null,'adjacent ticks still snap across compressed minutes');
});

test('animation reflects only permitted work and retains an identity through travel and care', () => {
  const base = {id:'hh-1-person',kind:'person',health:{condition:'well'},task:'work'};
  const variant = visualVariant(base.id);
  assert.equal(entityClip({...base,chore:{doing:'breaking the rows'}}).id, `${variant}-work`);
  assert.equal(entityClip({...base,chore:{doing:'mending the hoe'}}).id, `${variant}-repair`);
  assert.equal(entityClip({...base,chore:{doing:'carrying the crop in'}},true).id, `${variant}-idle-s`);
  assert.equal(entityClip({...base,travel:{},health:{condition:'injured'}}).frozen,true);
  assert.equal(entityClip({...base,travel:{}}).id,`${variant}-walk`);
  assert.deepEqual(entityClip(base),entityClip(structuredClone(base)));
  assert.equal(travelDirection({travel:{progress:1,points:[{x:0,y:0},{x:-2,y:0},{x:10,y:0}]}}),'w');
});
