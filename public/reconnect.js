// Coming back after the server has gone for a while (2026-09-28, docs/audits/2026-09-28-classroom.md B3).
//
// Until then a page whose event stream broke waited 1.5 seconds, asked the server once, and on any failure - a Chromebook
// waking, a Wi-Fi roam, the teacher's laptop restarting the server - showed the join screen for good, telling the student
// they were "no longer joined" and sending them for a family key they did not have. Their cookie was still good; nothing on
// the screen said so. The Host page, projected, did the same.
//
// Now a broken stream starts this: ask `/api/state` again, and again, a little further apart each time and never more than
// five seconds apart, for as long as it takes. A 200 is the page's own class again - the same family, from the same
// cookie - and the page carries on. **Only a 401 is a real sign-out** (the family was taken up on another device, or the
// teacher opened another class), and only then does the page go to the join screen. Anything else - no network, the server
// down, the server starting - is "Reconnecting", with the game left on the screen behind it.
//
// Nothing here touches the page: `probe` asks, `connected` is handed the snapshot, `signedOut` and `waiting` say so.

/** The waits between tries, in milliseconds; the last is repeated for as long as it takes. */
export const RETRY_DELAYS_MS = Object.freeze([1500, 2000, 3000, 5000]);

/** Ask the server who this page is: `{ status, body }`, status 0 when it could not be reached at all. */
export async function probeState(fetcher = fetch) {
  try {
    const response = await fetcher('/api/state', { cache: 'no-store' });
    return { status: response.status, body: response.ok ? await response.json() : null };
  } catch { return { status: 0, body: null }; }
}

/**
 * `start()` when the stream breaks; `stop()` when the page connects some other way. `waiting(tries, since)` is called when it
 * begins and after each failed try; `connected(snapshot)` once, with the class; `signedOut()` once, on a 401.
 */
//
// **After a sign-out it goes on listening, quietly** (`listening`): a 401 is also what a student's page is told while the
// teacher has another section's class open, and when their own class is opened again their cookie is good again. So the
// join screen asks every five seconds, says nothing, and the moment the answer is their class the page carries on. A
// student who joins or comes back some other way meanwhile stops it (`stop`).
export function reconnector({ probe = probeState, connected, signedOut, waiting = () => {}, delays = RETRY_DELAYS_MS, wait = (ms, next) => setTimeout(next, ms), cancel = clearTimeout, now = Date.now }) {
  let running = false, listening = false, tries = 0, timer = null, since = 0, generation = 0;
  const next = () => { timer = wait(listening ? delays.at(-1) : delays[Math.min(tries, delays.length - 1)], attempt); };
  async function attempt() {
    timer = null;
    const mine = generation;
    const answer = await probe();
    if (!(running || listening) || mine !== generation) return;
    if (answer.status === 200 && answer.body) { running = false; listening = false; connected(answer.body); return; }
    if (listening) { next(); return; }
    tries++;
    if (answer.status === 401) { running = false; listening = true; signedOut(answer); next(); return; }
    waiting(tries, since);
    next();
  }
  return {
    start() {
      if (running) return;
      if (timer !== null) cancel(timer);
      running = true; listening = false; tries = 0; since = now(); generation++;
      waiting(0, since);
      next();
    },
    stop() { running = false; listening = false; generation++; if (timer !== null) cancel(timer); timer = null; },
    get running() { return running; },
    get listening() { return listening; },
    get tries() { return tries; },
  };
}

/** What the page says while it tries: the words change once it has been a while, so a long outage never reads as a hang. */
export function reconnectWords({ host = false, stopped = false, solo = false, seconds = 0 } = {}) {
  if (stopped && solo) return 'Play Solo stopped. Your game was saved and paused. This page will carry on by itself if Play Solo is opened again.';
  if (stopped) return host
    ? 'The classroom server was stopped. The class was saved and paused; this page will come back by itself when the class is started again.'
    : 'Your teacher stopped the classroom server. Your family is saved. This page will come back by itself when the class is started again.';
  if (seconds >= 20) return `Still reconnecting (${Math.round(seconds)} seconds). Your family is safe; this page carries on by itself when the class server answers again.`;
  return 'Connection lost. Reconnecting…';
}
