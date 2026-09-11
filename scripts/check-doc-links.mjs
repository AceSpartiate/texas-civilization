import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
const folders = ['.', 'docs'];
const failures = [];
let checked = 0;
for (const folder of folders) {
  for (const file of readdirSync(folder).filter(name => name.endsWith('.md'))) {
    const path = join(folder, file), source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, '').split('#')[0];
      if (!target || /^[a-z]+:\/\//i.test(target)) continue;
      checked++;
      if (!existsSync(resolve(dirname(path), target))) failures.push(`${path} → ${target}`);
    }
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`${checked} local documentation links resolve.`);
