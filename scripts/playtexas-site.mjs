// The page at playtexas.github.io (owner, 2026-10-03; docs/HOST_PAGE.md §2.17, docs/DEPLOYMENT.md "The join-words page").
//
// Its source is site/playtexas/ in this repository, complete and self-contained: index.html (markup), style.css and assets/ (all of
// the look - Astra's, 2026-10-03),
// page.js (the logic), join-words.js - a byte-for-byte copy of the game's public/join-words.js, so the page decodes exactly what the
// game encodes (tests/join-words.test.mjs fails if they differ) - and .nojekyll (GitHub Pages serves the files as they are).
//
//   node scripts/playtexas-site.mjs --sync             copy public/join-words.js into site/playtexas/
//   node scripts/playtexas-site.mjs --check            exit 1 if the copy differs from the game's
//   node scripts/playtexas-site.mjs <folder>           sync, then copy the site's files into <folder> (a clone of the
//                                                      playtexas.github.io repository), touching nothing else there
//   node scripts/playtexas-site.mjs --publish <folder> the same, then in that clone: git add, git commit, git push.
//                                                      THIS PUBLISHES. Only with the owner's approval (docs/DEPLOYMENT.md).
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const site = join(root, 'site', 'playtexas');
const game = join(root, 'public', 'join-words.js'), copy = join(site, 'join-words.js');
const same = () => existsSync(copy) && readFileSync(copy).equals(readFileSync(game));
const args = process.argv.slice(2), publish = args[0] === '--publish', arg = publish ? args[1] : args[0];

if (!arg) {
  console.log('Usage: node scripts/playtexas-site.mjs --sync | --check | <clone folder> | --publish <clone folder>');
  process.exit(2);
}
if (arg === '--check') {
  if (same()) { console.log('site/playtexas/join-words.js is the game\'s public/join-words.js.'); process.exit(0); }
  console.error('site/playtexas/join-words.js differs from public/join-words.js. Run: node scripts/playtexas-site.mjs --sync');
  process.exit(1);
}
if (!same()) { copyFileSync(game, copy); console.log('Copied public/join-words.js into site/playtexas/.'); }
if (arg === '--sync') process.exit(0);

const target = resolve(arg);
if (!existsSync(target) || !statSync(target).isDirectory()) {
  console.error(`No folder at ${target}. First: git clone https://github.com/playtexas/playtexas.github.io.git "${target}"`);
  process.exit(1);
}
if (target === root || target.startsWith(`${root}\\`) || target.startsWith(`${root}/`)) { console.error('The target must be the clone of playtexas.github.io, outside this repository.'); process.exit(1); }
// Every file of the site, its folders too (Astra's assets/), except the README, which is the hand-off note for this repository.
const files = readdirSync(site, { recursive: true }).map(name => String(name).replace(/\\/g, '/'))
  .filter(name => statSync(join(site, name)).isFile() && name !== 'README.md');
for (const name of files) { mkdirSync(dirname(join(target, name)), { recursive: true }); copyFileSync(join(site, name), join(target, name)); }
console.log(`Copied ${files.join(', ')} into ${target}.`);
if (!publish) { console.log('Nothing has been published. To publish (owner-approved only): node scripts/playtexas-site.mjs --publish <that folder>'); process.exit(0); }

if (!existsSync(join(target, '.git'))) { console.error(`${target} is not a git clone. Clone playtexas/playtexas.github.io there first.`); process.exit(1); }
const git = (...words) => { console.log(`> git ${words.join(' ')}`); return execFileSync('git', ['-C', target, ...words], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }); };
git('add', '--', ...files);
if (!git('status', '--porcelain', '--', ...files).trim()) { console.log('The page there is already this one. Nothing to publish.'); process.exit(0); }
const revision = (() => { try { return execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } })();
git('commit', '-m', `Join page from texas-civilization ${revision}`);
git('push');
console.log('Published. GitHub Pages serves it at https://playtexas.github.io/ within a minute or two.');
