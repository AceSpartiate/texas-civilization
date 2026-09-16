// One source of truth for "where does this installation keep class data".
// The PowerShell launcher and stop/preflight helpers read this instead of
// re-implementing the resolution rules and drifting from the server.
// `--solo` answers the same question for Solo Mode's own folder and port.
import { join } from 'node:path';
import { resolveDataDir, resolveSavePath, joinCandidates, appRoot, soloPaths } from '../server/deployment.mjs';

const solo = process.argv.includes('--solo');
const paths = solo ? soloPaths() : null;
const port = solo ? paths.port : Number(process.env.PORT || 1835);
const { dir, origin } = solo ? { dir: paths.dir, origin: 'solo' } : resolveDataDir();
process.stdout.write(JSON.stringify({
  application: 'texas-revolution-foundation',
  appRoot: appRoot(),
  solo,
  dataDir: dir,
  dataOrigin: origin,
  savePath: solo ? paths.savePath : resolveSavePath(dir),
  hostUrlFile: join(dir, 'host-url.txt'),
  archiveDir: join(dir, 'archive'),
  port,
  joinUrls: solo ? [] : joinCandidates(port),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
}));
