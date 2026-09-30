"""What espeak-ng (en-us, as Kokoro-82M v1.0 hears it through sherpa-onnx) makes of every row of the pronunciation table.

usage: node scripts/voice-table.mjs > table.json      (the written forms, their respellings and the names read as written)
       python pronounce_probe.py table.json out.json   (needs sherpa-onnx and the kokoro-multi-lang-v1_0 model, as gen.py)

Prints and writes, for each row, the phonemes of the written form and of the respelling. It is how the respellings in
server/voice/pronunciation.mjs were chosen and checked (2026-09-30): by reading the phonemes, not by ear.
"""
import json, os, re, subprocess, sys
import gen
table = json.load(open(sys.argv[1], encoding='utf-8'))
f = 'kokoro-multi-lang-v1_0'
tok = {}
for line in open(gen.d(f, 'tokens.txt'), encoding='utf-8'):
    p = line.rstrip('\n').rsplit(' ', 1)
    if len(p) == 2: tok[int(p[1])] = p[0] or ' '
words = []
for written, said in table['respell']: words += [written, said]
words += table['asWritten']
code = r'''
import sherpa_onnx as so, gen, sys, json
f='kokoro-multi-lang-v1_0'
mc = so.OfflineTtsModelConfig(kokoro=so.OfflineTtsKokoroModelConfig(model=gen.d(f,'model.onnx'), voices=gen.d(f,'voices.bin'), tokens=gen.d(f,'tokens.txt'), data_dir=gen.d(f,'espeak-ng-data'), lexicon=gen.d(f,'lexicon-us-en.txt'), dict_dir=''), num_threads=1, debug=True)
tts = so.OfflineTts(so.OfflineTtsConfig(model=mc))
for w in json.load(open(sys.argv[1], encoding='utf-8')): tts.generate(w, sid=3)
'''
listing = os.path.join(gen.ROOT, '_probe_words.json')
json.dump(words, open(listing, 'w', encoding='utf-8'), ensure_ascii=False)
r = subprocess.run([sys.executable, '-c', code, listing], capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=gen.ROOT)
ids = [l for l in r.stderr.splitlines() if re.fullmatch(r'\s*0( \d+)+ 0\s*', l)]
assert len(ids) == len(words), (len(ids), len(words))
ipa = {w: '/' + ''.join(tok.get(int(i), '?') for i in l.split()[1:-1]).strip(' .!') + '/' for w, l in zip(words, ids)}
rows = [{'written': w, 'as_written': ipa[w], 'respelled': s, 'respelled_ipa': ipa[s]} for w, s in table['respell']]
rows += [{'written': w, 'as_written': ipa[w], 'respelled': None} for w in table['asWritten']]
json.dump({'date': '2026-09-30', 'engine': 'Kokoro-82M v1.0 fp32 via sherpa-onnx 1.13.8, espeak-ng en-us', 'rows': rows}, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for row in rows: print(f"{row['written']:18} {row['as_written']:22} -> {row['respelled'] or '(as written)':22} {row.get('respelled_ipa') or ''}")
