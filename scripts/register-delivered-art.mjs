import {readFileSync,writeFileSync} from 'node:fs';
import {promptEntries,provenanceEntries} from './art-deliveries/index.mjs';
for (const [file,key,entries] of [['art-prompts.json','entries',promptEntries],['art-provenance.json','assetSources',provenanceEntries]]) {
  const path=new URL(`../docs/${file}`,import.meta.url),record=JSON.parse(readFileSync(path,'utf8'));
  const bySheet=new Map(record[key].map(entry=>[entry.sheet,entry]));
  for(const entry of entries)bySheet.set(entry.sheet,entry);
  record[key]=[...bySheet.values()];writeFileSync(path,JSON.stringify(record,null,2)+'\n');
}
console.log(`Registered ${provenanceEntries.length} delivered atlas source records.`);
