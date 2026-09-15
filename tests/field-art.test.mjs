import test from 'node:test';
import assert from 'node:assert/strict';
import {plotArt} from '../public/field-art.js';
test('clearing art preserves ground history and work bounds without inventing fire',()=>{
  const p={id:'plot-7',ground:'timber',state:'cleared'};
  assert.equal(plotArt(p).length,7);assert.deepEqual(plotArt(p),plotArt({...p}));
  assert.deepEqual(plotArt({...p,ground:'prairie'}),[]);
  assert.deepEqual(plotArt({...p,state:'staked'}),[]);
  const brush=plotArt({...p,state:'staked',work:1,spells:16});
  assert.equal(brush.length,3);assert.ok(brush.every(a=>a.sprite==='clearing-brush-dry'&&Math.abs(a.x-.5)<.125&&Math.abs(a.y-.5)<.125));
});
