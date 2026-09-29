// The names of Claude's temporary frames and clips (public/assets/claude-standins/atlas.json), for the renderer tests' fake
// art: `refusing(names)` answers "not loaded" for every one of them, so a test can prove the library stand-in a Claude frame
// replaced is still drawn while its sheet has not arrived (and, after Astra's delivery removes Claude's, what is drawn then).
import { readFileSync } from 'node:fs';

const atlas = JSON.parse(readFileSync(new URL('../../public/assets/claude-standins/atlas.json', import.meta.url), 'utf8'));
export const CLAUDE_NAMES = new Set([...Object.keys(atlas.frames), ...Object.keys(atlas.clips)]);
/** Whether a name is Claude's. */
export const isClaude = name => CLAUDE_NAMES.has(name);
/** Whether a fake art given `claude` (true, false, or a test of the name) draws this Claude frame. */
export const drawsClaude = (claude, name) => typeof claude === 'function' ? claude(name) : Boolean(claude);
