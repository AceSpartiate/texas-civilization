// Every family row a student can see, on one line inside its column, with the whole name in its box (owner, 2026-09-30: "Move
// Idle and House off", then "Move age off the row"; docs/FAMILY_PANEL.md, amendment 2026-09-30). Read in the page, at the size it
// is at. A row folded to its face (a phone's closed rows, Hide names) has no name drawn and is not counted.
//
// One line: every tool beside the name (a baby's word, Auto, the star) stands level with it. Whole: the name's box scrolls nothing.
// Returns the rows that fail, with what was measured, and the room each row's name had, so a proof can say what fits.
export const rowsFit = page => page.evaluate(() => {
  const panel = document.querySelector('#family-panel').getBoundingClientRect();
  const right = Math.min(panel.right, innerWidth);
  const rows = [...document.querySelectorAll('#family-rows .panel-row')].filter(row => {
    const body = row.querySelector('.panel-body');
    return body && body.getClientRects().length && getComputedStyle(body).display !== 'none';
  }).map(row => {
    const input = row.querySelector('.panel-name'), name = input.getBoundingClientRect(), middle = (name.top + name.bottom) / 2;
    const style = getComputedStyle(input);
    const tools = [...row.querySelectorAll('.panel-tools > *')].filter(one => one.getClientRects().length).map(one => one.getBoundingClientRect());
    return {
      id: row.dataset.entityId, label: row.querySelector('.panel-label')?.textContent || '', name: input.value,
      right: Math.round(row.getBoundingClientRect().right), column: Math.round(right),
      oneLine: tools.every(one => one.top <= middle && one.bottom >= middle),
      box: input.clientWidth, needs: input.scrollWidth,
      // The width a name's letters have in this box: the box less its padding.
      room: Math.round(input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)),
      tools: tools.length,
    };
  });
  return { rows, out: rows.filter(row => row.right > row.column + 1 || !row.oneLine || row.needs > row.box + 1) };
});
