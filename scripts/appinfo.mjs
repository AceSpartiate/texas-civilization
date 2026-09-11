// One source of truth for "where does this installation keep class data".
// The PowerShell launcher and stop/preflight helpers read this instead of
// re-implementing the resolution rules and drifting from the server.
import { join } from 'node:path';
import { resolveDataDir, resolveSavePath, joinCandidates, appRoot } from '../server/deployment.mjs';

const port = Number(process.env.PORT || 1835);
const { dir, origin } = resolveDataDir();
process.stdout.write(JSON.stringify({
  application: 'texas-revolution-foundation',
  appRoot: appRoot(),
  dataDir: dir,
  dataOrigin: origin,
  savePath: resolveSavePath(dir),
  hostUrlFile: join(dir, 'host-url.txt'),
  archiveDir: join(dir, 'archive'),
  port,
  joinUrls: joinCandidates(port),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
}));
