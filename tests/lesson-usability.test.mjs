import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { lessonRefusal, ALWAYS } from '../sim/lesson.mjs';
import { pointedKey } from '../public/lesson.js';

test('tutorial gate accepts the actual chore commands needed to finish each map step', () => {
  const world = createGonzalesWorld('lesson-usability', 5);
  world.status = 'running';
  const family = world.households['hh-1'];
  family.played = true;
  for (const [step, chore] of [['house','fell-trees'], ['survey','survey-plot'], ['clear','clear-plot'], ['clear','fence-plot'], ['harvest','fence-plot'], ['hunt','hunt-land']]) {
    family.lesson = { step };
    assert.equal(lessonRefusal(world, family, { action: 'chore', chore, entityId: family.principalId }), null, `${step}: ${chore}`);
    assert.ok(lessonRefusal(world, family, { action: 'chore', chore: 'practise-shooting', entityId: family.principalId }));
  }
});

test('tutorial highlights the objective rather than travel, rest or an unrelated permitted chore', () => {
  const icons = ['travel-home','rest','visit-shop','fence-plot','harvest-field'].map(key => ({ key, kind: ['rest','travel-home'].includes(key) ? 'order' : 'chore', can: true }));
  const lesson = { step: 'harvest', allow: [...ALWAYS, 'chore:visit-shop', 'chore:fence-plot','chore:harvest-field'] };
  assert.equal(pointedKey(lesson, icons), 'harvest-field');
  assert.equal(pointedKey(lesson, icons.map(i => ({ ...i, can: i.key !== 'harvest-field' }))), 'fence-plot');
  assert.equal(pointedKey(lesson, icons.filter(i => i.kind === 'order')), null);
});
