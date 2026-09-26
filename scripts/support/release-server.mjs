// A stand-in for GitHub's releases, for scripts/verify-delta-update.ps1: the latest-release
// endpoint and the asset downloads, served from files on this computer, on 127.0.0.1 only.
// Nothing is published and nothing is fetched from the Internet.
//
//   node scripts/support/release-server.mjs <config.json>
//
// The config is re-read on every request, so the proof changes the "release" between scenarios
// by rewriting it:
//
//   { "tag": "v-e2e.2",
//     "assets": [{ "name": "TexasRevolutionSetup.exe", "file": "C:\\...\\TexasRevolutionSetup.exe" }, ...],
//     "cut": { "<asset name>": <bytes to send before dropping the connection> } }
//
// GET /stats reports every download with the bytes actually sent; POST /reset clears it. Prints
// "listening <port>" once ready.
import { createServer } from 'node:http';
import { createReadStream, readFileSync, statSync } from 'node:fs';

const configPath = process.argv[2];
if (!configPath) { console.error('usage: release-server.mjs <config.json>'); process.exit(2); }
const readConfig = () => JSON.parse(readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
let served = [];

const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const origin = `http://127.0.0.1:${server.address().port}`;
  if (url.pathname === '/stats') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ served }));
    return;
  }
  if (url.pathname === '/reset' && request.method === 'POST') {
    served = [];
    response.writeHead(204).end();
    return;
  }
  const config = readConfig();
  if (url.pathname === '/repos/AceSpartiate/texas-civilization/releases/latest') {
    const assets = config.assets.map((asset, index) => ({
      id: index + 1,
      name: asset.name,
      size: statSync(asset.file).size,
      browser_download_url: `${origin}/AceSpartiate/texas-civilization/releases/download/${encodeURIComponent(config.tag)}/${encodeURIComponent(asset.name)}`,
    }));
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ tag_name: config.tag, name: `Texas Revolution ${config.tag}`, html_url: `${origin}/releases/tag/${config.tag}`, assets }));
    return;
  }
  const match = url.pathname.match(/^\/AceSpartiate\/texas-civilization\/releases\/download\/([^/]+)\/([^/]+)$/);
  const asset = match && decodeURIComponent(match[1]) === config.tag && config.assets.find((entry) => entry.name === decodeURIComponent(match[2]));
  if (!asset) { response.writeHead(404).end('Not Found'); return; }
  const size = statSync(asset.file).size;
  const cut = config.cut?.[asset.name];
  const record = { name: asset.name, size, bytes: 0, complete: false };
  served.push(record);
  response.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': size });
  const stream = createReadStream(asset.file, cut === undefined ? {} : { end: Math.max(0, cut - 1) });
  stream.on('data', (chunk) => { record.bytes += chunk.length; });
  stream.on('end', () => {
    if (cut === undefined) { record.complete = true; response.end(); }
    // Promised the whole length, sent part of it, and hung up: a school network dropping out.
    else response.destroy();
  });
  stream.pipe(response, { end: false });
});

server.listen(0, '127.0.0.1', () => console.log(`listening ${server.address().port}`));
