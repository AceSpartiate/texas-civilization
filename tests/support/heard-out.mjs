// A rider heard out, as a student does with Done (owner, 2026-09-29, one rider, one visit: docs/COLONIES.md §5.4b).
//
// Not a test file: imported, never run. A question the word raises - the neighbour at the door, the settlement's call - is
// put while its rider is still talking with the family and waits until he has gone (sim/encounters.mjs `questionWaits`): not
// shown, and the call's minutes not running. A test about the question lets him go first, as the page's Done does.
import { applyAction } from '../../sim/world.mjs';

/** Every rider still talking with this family (or with every family, with no id) let go. */
export function heardOut(world, householdId = null) {
  for (const one of Object.values(world.encounters || {})) {
    if (one.status !== 'open' || one.kind || (householdId && one.householdId !== householdId)) continue;
    applyAction(world, one.householdId, { action: 'leave-rider', entityId: one.listenerId });
  }
}
