// The teacher's class controls on the Host's page (2026-09-28, docs/audits/2026-09-28-classroom.md B1, B2 and B6, and the
// owner's "Plan for several class days"): how many class days a game takes and where the class is; how many families it
// has, set in the lobby; which family a late student is given; and the classes kept on this computer, each opened again or
// a new one started with a name and a size. It draws what the server sends (server/app.mjs, the Host's snapshot and
// `/api/classes`) and sends Host commands; it decides nothing.

const PACE_NAMES = Object.freeze({ study: 'Study', brisk: 'Brisk', quick: 'Quick' });
const span = ([low, high]) => low === high ? `${low}` : `${low}–${high}`;
const dayWord = ([, high]) => high === 1 ? 'class day' : 'class days';

/**
 * The words of the class-days line. `whole` before Start and always; `left` and `where` once the class has begun. `tickMs`
 * picks out the pace the class is at now.
 */
export function classDaysWords(schedule, { status, tickMs, paces = { study: 9500, brisk: 4000, quick: 1000 } } = {}) {
  if (!schedule) return null;
  const current = Object.entries(paces).find(([, ms]) => ms === tickMs)?.[0];
  const list = part => Object.keys(PACE_NAMES).filter(name => part[name])
    .map((name, index) => `${span(part[name].days)}${index ? '' : ` ${dayWord(part[name].days)}`} at ${PACE_NAMES[name]}${name === current ? ' (now)' : ''}`).join(' · ');
  const whole = `A whole game takes about ${list(schedule.whole)}, counting ${schedule.playMinutesADay} minutes of play a day.`;
  if (status === 'lobby') return { whole, where: null, left: null };
  const done = schedule.left.study.days[1] === 0;
  const where = done
    ? 'The war is over: the class has reached its ending.'
    : `Now: ${schedule.season} (period ${schedule.period} of ${schedule.periods}), about ${Math.round(schedule.share * 100)}% of the way through${status === 'ended' ? ', waiting to go on' : ''}.`;
  const left = done ? null : `Left: about ${list(schedule.left)}.`;
  return { whole, where, left };
}

/** The label of one family in the late students' list. */
export function seatLabel(seat) {
  if (seat.kind === 'free') return `${seat.family} (nobody's)`;
  return `${seat.family} (${seat.student}, ${seat.presence === 'absent' ? 'absent' : seat.presence === 'away' ? 'away' : 'not here'})`;
}

/** What the teacher is told when a kept class is deleted: that it was moved, not destroyed, and where to (server `deleted`). */
export function deletedWords(name, deleted) {
  if (!deleted?.save) return `${name} was taken off the list.`;
  return `${name} was taken off the list and kept: its save is now ${deleted.save}${deleted.flashbacks ? ` and its flashbacks ${deleted.flashbacks}` : ''}, in this computer's class data folder. To bring it back, see "A deleted class" in RECOVERY.`;
}

/** Where a kept class was left, in words. */
export function classLine(entry) {
  const name = entry.name || `Class ${entry.code}`;
  const where = entry.status === 'lobby' ? 'not started' : `${entry.status === 'ended' ? (entry.continuable ? 'ended part-way' : 'ended') : entry.status}, ${entry.date || ''}${entry.period ? ` (period ${entry.period})` : ''}`;
  return `${name} · code ${entry.code} · ${entry.joined} of ${entry.families} families joined · ${where}`;
}

/**
 * Wire the controls. `$` finds an element, `api(path, input)` asks the server and throws its refusal, `command(action,
 * extra)` sends one Host command. Returns `render(snapshot)`, called with every Host snapshot.
 */
export function mountClassPanel({ $, api, command, element }) {
  let last = null, listKey = '', seatsKey = '', sizesMade = false;
  /** A second press within six seconds does it: the page's own confirmation, never a browser dialog over a projector. */
  const confirmed = (button, words) => {
    if (button.dataset.confirming === 'true') { clearTimeout(Number(button.dataset.timer)); button.dataset.confirming = 'false'; button.textContent = button.dataset.label; return true; }
    button.dataset.label = button.textContent; button.textContent = words; button.dataset.confirming = 'true';
    button.dataset.timer = String(setTimeout(() => { button.dataset.confirming = 'false'; button.textContent = button.dataset.label; }, 6000));
    return false;
  };
  const note = text => { const node = $('#classes-note'); if (node) node.textContent = text; };
  const sizes = select => { if (select && !select.options.length) select.replaceChildren(...Array.from({ length: 26 }, (_, index) => { const option = element('option', String(index + 5)); option.value = String(index + 5); return option; })); };
  async function refreshList() {
    try {
      const { classes } = await api('/api/classes');
      const key = JSON.stringify(classes);
      if (key === listKey) return;
      listKey = key;
      $('#classes-list').replaceChildren(...classes.map(entry => {
        const item = element('li', '', 'class-entry');
        item.dataset.classId = entry.id; item.dataset.open = String(entry.open);
        item.append(element('span', classLine(entry), 'class-line'));
        if (entry.open) {
          item.append(element('span', 'Open now', 'class-open'));
          // Ended by End Game part-way through a period: it can be taken up again where it was, paused (owner, 2026-09-28).
          if (entry.continuable) {
            const again = element('button', 'Continue this class');
            again.type = 'button'; again.dataset.classContinue = entry.id;
            again.dataset.name = entry.name || `Class ${entry.code}`;
            item.append(again);
          }
        } else {
          const open = element('button', 'Open');
          open.type = 'button'; open.dataset.classOpen = entry.id;
          open.dataset.name = entry.name || `Class ${entry.code}`;
          // Delete (owner, 2026-09-28: "Yes, with a confirm"): asked twice, never for the open class, and never destroyed - the
          // server moves it to the archive folder, and says where (docs/RECOVERY.md, *A deleted class*).
          const remove = element('button', 'Delete', 'class-delete');
          remove.type = 'button'; remove.dataset.classDelete = entry.id;
          remove.dataset.name = open.dataset.name;
          item.append(open, remove);
        }
        return item;
      }));
    } catch (error) { note(error.message); }
  }
  $('#classes-toggle')?.addEventListener('click', () => {
    const panel = $('#classes-panel'), open = panel.hidden;
    panel.hidden = !open;
    $('#classes-toggle').setAttribute('aria-expanded', String(open));
    note('');
    if (open) { listKey = ''; refreshList(); }
  });
  $('#classes-list')?.addEventListener('click', async event => {
    const remove = event.target.closest('[data-class-delete]');
    if (remove) {
      if (!confirmed(remove, `Confirm: delete ${remove.dataset.name}`)) return;
      try {
        const result = await command('delete-class', { classId: remove.dataset.classDelete });
        note(deletedWords(remove.dataset.name, result.deleted));
        listKey = ''; refreshList();
      } catch (error) { note(error.message); }
      return;
    }
    const again = event.target.closest('[data-class-continue]');
    if (again) {
      if (!confirmed(again, `Confirm: continue ${again.dataset.name}`)) return;
      try {
        await command('continue-class');
        note(`${again.dataset.name} is taken up again where End Game ended it, paused. Its ending and its flashbacks are gone; press Resume when the class is ready.`);
        listKey = ''; refreshList();
      } catch (error) { note(error.message); }
      return;
    }
    const button = event.target.closest('[data-class-open]');
    if (!button) return;
    if (!confirmed(button, `Confirm: open ${button.dataset.name}`)) return;
    try {
      await command('open-class', { classId: button.dataset.classOpen });
      note(`${button.dataset.name} is open, paused where it was left. Its students come back with the same code; press Resume when the class is ready.`);
      listKey = ''; refreshList();
    } catch (error) { note(error.message); }
  });
  $('#class-new')?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('#class-new-make'), name = $('#class-new-name').value.trim();
    if (!confirmed(button, `Confirm: new class${name ? ` "${name}"` : ''}`)) return;
    try {
      await command('new-class', { name, size: Number($('#class-new-size').value) });
      $('#class-new-name').value = '';
      note('New class ready. Share its class code; the class that was open is kept in the list.');
      listKey = ''; refreshList();
    } catch (error) { note(error.message); }
  });
  $('#class-size-set')?.addEventListener('click', async () => {
    const button = $('#class-size-set'), size = Number($('#class-size').value);
    if (size === last?.classSize) return;
    const joined = last?.presence?.joined || 0;
    if (joined && !confirmed(button, `Confirm: ${size} families`)) return;
    try { await command('class-size', { size }); $('#class-size-note').textContent = ''; }
    catch (error) { $('#class-size-note').textContent = error.message; }
  });
  $('#class-new-size')?.addEventListener('change', event => { event.target.dataset.touched = 'true'; });
  $('#late-seat')?.addEventListener('change', async () => {
    const householdId = $('#late-seat').value || null;
    try { await command('late-seat', { householdId }); $('#late-note').textContent = ''; }
    catch (error) { $('#late-note').textContent = error.message; }
  });

  return function render(snapshot) {
    const host = snapshot?.world?.role === 'host' && !snapshot.solo;
    for (const id of ['#class-days', '#classes', '#class-size-row', '#late']) { const node = $(id); if (node && !host) node.hidden = true; }
    if (!host) return;
    last = snapshot;
    const status = snapshot.world.status;
    // How many class days, and where the class is (the owner's "Plan for several class days").
    const words = classDaysWords(snapshot.schedule, { status, tickMs: snapshot.tickMs });
    const days = $('#class-days');
    if (days) {
      const text = words ? [words.where, words.left, words.whole].filter(Boolean).join(' ') : '';
      if (days.textContent !== text) days.textContent = text;
      days.hidden = !text;
    }
    // The class's size, set in the lobby.
    const sizeRow = $('#class-size-row');
    if (sizeRow) {
      sizeRow.hidden = status !== 'lobby';
      if (!sizesMade) { sizes($('#class-size')); sizes($('#class-new-size')); sizesMade = true; }
      const select = $('#class-size');
      if (select && document.activeElement !== select && select.value !== String(snapshot.classSize)) select.value = String(snapshot.classSize);
      const newSize = $('#class-new-size');
      if (newSize && !newSize.dataset.touched) newSize.value = String(snapshot.classSize);
      const joined = snapshot.presence?.joined || 0;
      const hint = $('#class-size-hint');
      if (hint) hint.textContent = joined ? `${joined} joined. Changing it deals the families again: students who have joined keep their places and roll their families again.` : 'Choose before students join. Families nobody joins are run as neighbours, and are there for anybody who comes late.';
    }
    // The classes kept on this computer: only where the server keeps them.
    const classes = $('#classes');
    if (classes) classes.hidden = !snapshot.keepsClasses;
    const now = $('#class-now');
    if (now) now.textContent = `This class: ${snapshot.className || `Class ${snapshot.sessionCode}`} · ${snapshot.classSize} families`;
    if (!$('#classes-panel')?.hidden) refreshListSoon();
    // Late students, once the class has begun.
    const late = $('#late'), select = $('#late-seat');
    if (late && select) {
      late.hidden = status === 'lobby' || status === 'ended';
      const seats = snapshot.seats || [];
      const key = JSON.stringify([seats, snapshot.lateSeat]);
      if (key !== seatsKey && document.activeElement !== select) {
        seatsKey = key;
        const first = element('option', seats.some(seat => seat.kind === 'free') ? 'The first family nobody plays' : 'Nobody: every family has a student');
        first.value = '';
        select.replaceChildren(first, ...seats.map(seat => { const option = element('option', seatLabel(seat)); option.value = seat.householdId; return option; }));
        select.value = snapshot.lateSeat || '';
      }
    }
  };
  function refreshListSoon() {
    if (refreshListSoon.timer) return;
    refreshListSoon.timer = setTimeout(() => { refreshListSoon.timer = null; refreshList(); }, 3000);
  }
}
