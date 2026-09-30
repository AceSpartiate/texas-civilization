// The read-aloud pronunciation table as JSON, for docs/evidence/read-aloud/scripts/pronounce_probe.py to print what espeak-ng
// makes of each row (server/voice/pronunciation.mjs). A developer's instrument; nothing in the game runs it.
import { AS_WRITTEN, RESPELL } from '../server/voice/pronunciation.mjs';
process.stdout.write(JSON.stringify({ respell: Object.entries(RESPELL), asWritten: [...AS_WRITTEN] }));
