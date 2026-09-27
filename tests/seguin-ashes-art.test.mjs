import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const scene = read('../public/assets/frontier-v1/seguin-ashes-cutscene.json');
const atlas = read('../public/assets/frontier-v1/atlas.json');
const animation = read('../public/assets/frontier-v1/animation.json');

test('Seguín remembrance storyboard has complete registered art and explicit claim labels', () => {
  assert.equal(scene.historicalWindow, '1837-02-25');
  let end = 0;
  for (const beat of scene.beats) {
    assert.equal(beat.seconds[0], end, `gap or overlap before ${beat.id}`);
    assert.ok(beat.seconds[1] > end);
    end = beat.seconds[1];
    assert.ok(['documented', 'dramatized', 'later-account', 'disputed'].includes(beat.claim));
    assert.ok(beat.caption && beat.camera);
    for (const sprite of beat.sprites) assert.ok(atlas.frames[sprite], `missing ${sprite}`);
    if (beat.clip) assert.ok(animation.clips[beat.clip], `missing ${beat.clip}`);
  }
  assert.ok(scene.beats.find(one => one.id === 'quiet-gathering')?.claim === 'dramatized');
  assert.ok(scene.beats.find(one => one.id === 'later-church-account')?.claim === 'later-account');
  assert.ok(scene.beats.find(one => one.id === 'discovery-1936')?.claim === 'disputed');
  assert.equal(animation.clips['seguin-ashes-collect'].loop, false);
  assert.deepEqual(animation.clips['seguin-ashes-collect'].frames.map(one => one.sprite), ['seguin-ashes-stand', 'seguin-ashes-kneel', 'seguin-ashes-gather', 'seguin-ashes-rise']);
});
