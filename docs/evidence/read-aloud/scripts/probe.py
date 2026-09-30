"""What phonemes does Kokoro-through-sherpa (espeak-ng en-us) give a spelling? Prints IPA for each candidate.
Run with stderr captured: sherpa's debug log carries the token ids."""
import sys, os, re, subprocess
import gen
f = 'kokoro-multi-lang-v1_0'
tok = {}
for line in open(gen.d(f, 'tokens.txt'), encoding='utf-8'):
    p = line.rstrip('\n').rsplit(' ', 1)
    if len(p) == 2: tok[int(p[1])] = p[0] or ' '
CANDS = sys.argv[1:] or ["Juan", "Seguín", "Seguin", "Segeen", "Seh-geen", "Seggeen", "Béxar", "Bexar", "Bayhar", "Bay-har", "Gonzales", "Guadalupe"]
code = r'''
import sherpa_onnx as so, gen, sys
f='kokoro-multi-lang-v1_0'
mc = so.OfflineTtsModelConfig(kokoro=so.OfflineTtsKokoroModelConfig(model=gen.d(f,'model.onnx'), voices=gen.d(f,'voices.bin'), tokens=gen.d(f,'tokens.txt'), data_dir=gen.d(f,'espeak-ng-data'), lexicon=gen.d(f,'lexicon-us-en.txt'), dict_dir=''), num_threads=1, debug=True)
tts = so.OfflineTts(so.OfflineTtsConfig(model=mc))
for w in sys.argv[1:]: tts.generate(w + '.', sid=3)
'''
r = subprocess.run([sys.executable, '-c', code, *CANDS], capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=gen.ROOT)
ids = [l for l in r.stderr.splitlines() if re.fullmatch(r'\s*0( \d+)+ 0\s*', l)]
for w, l in zip(CANDS, ids):
    print(f'{w:12} /' + ''.join(tok.get(int(i), '?') for i in l.split()[1:-1]).strip(' .') + '/')
