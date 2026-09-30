"""Score every sample: Parakeet ASR word error rate (intelligibility, did it say the words) and UTMOS22 predicted MOS
(naturalness proxy, 1-5). Neither replaces listening; both catch a voice that garbles or drones.

usage: python score.py            -> writes scores.jsonl
"""
import glob, json, os, re, unicodedata, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
import sherpa_onnx as so

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
from gen import LINES, SPANISH

A = os.path.join(ROOT, 'eval', 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8')
rec = so.OfflineRecognizer.from_transducer(
    encoder=os.path.join(A, 'encoder.int8.onnx'), decoder=os.path.join(A, 'decoder.int8.onnx'),
    joiner=os.path.join(A, 'joiner.int8.onnx'), tokens=os.path.join(A, 'tokens.txt'), num_threads=2, model_type='nemo_transducer')

import torch
torch.set_num_threads(2)
mos = torch.hub.load('tarepan/SpeechMOS:v1.2.0', 'utmos22_strong', trust_repo=True)

def norm(s):
    s = unicodedata.normalize('NFKD', s.lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z' ]+", ' ', s).replace("'s", ' s').split()

def wer(ref, hyp):
    r, h = norm(ref), norm(hyp)
    dp = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, dp[0] = dp[0], i
        for j in range(1, len(h) + 1):
            cur = min(dp[j] + 1, dp[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, dp[j] = dp[j], cur
    return dp[len(h)] / max(1, len(r))

out = open(os.path.join(ROOT, 'scores.jsonl'), 'w', encoding='utf-8')
# Real human recordings (Kyutai's CC0 / CC-BY reference clips) as the UTMOS baseline for "a person talking".
for wav in sorted(glob.glob(os.path.join(ROOT, 'models', 'kyutai-voices', '*.wav'))):
    x, sr = sf.read(wav, dtype='float32')
    if x.ndim > 1: x = x.mean(axis=1)
    x16 = resample_poly(x, 16000 // np.gcd(16000, sr), sr // np.gcd(16000, sr)).astype(np.float32)
    with torch.no_grad():
        row = dict(engine='human', voice=os.path.basename(wav)[:-4], line='ref', utmos=round(float(mos(torch.from_numpy(x16).unsqueeze(0), 16000)[0]), 3))
    out.write(json.dumps(row) + '\n'); print(json.dumps(row), flush=True)
for wav in sorted(glob.glob(os.path.join(ROOT, 'samples', '*', '*.wav'))):
    engine = os.path.basename(os.path.dirname(wav)); voice, line = os.path.basename(wav)[:-4].rsplit('-', 1)
    x, sr = sf.read(wav, dtype='float32')
    x16 = resample_poly(x, 16000 // np.gcd(16000, sr), sr // np.gcd(16000, sr)).astype(np.float32)
    row = dict(engine=engine, voice=voice, line=line)
    if line in LINES:  # English ASR only
        s = rec.create_stream(); s.accept_waveform(16000, x16); rec.decode_stream(s)
        row['hyp'] = s.result.text.strip(); row['wer'] = round(wer(LINES[line], row['hyp']), 3)
    with torch.no_grad():
        row['utmos'] = round(float(mos(torch.from_numpy(x16).unsqueeze(0), 16000)[0]), 3)
    out.write(json.dumps(row, ensure_ascii=False) + '\n'); out.flush()
    print(json.dumps(row, ensure_ascii=False), flush=True)
