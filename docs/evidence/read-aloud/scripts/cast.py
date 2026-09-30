"""Casting: every plausible Kokoro v1.0 fp32 English voice on the game's three kinds of line, scored like the research
(Parakeet WER + UTMOS22). Writes samples-cast/<voice>-<line>.wav and cast.jsonl."""
import json, os, sys, time
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
import sherpa_onnx as so
ROOT = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ROOT)
import gen
LINES = {
    'news': gen.LINES['news'],
    'army': gen.LINES['army'],
    'rider': "I rode from Gonzales this morning. They have buried the cannon in a peach orchard, and they mean to keep it.",
    'mother': "Take the children to the wagon. We leave before dark, and we will not see this house again.",
}
VOICES = [('af_heart', 3), ('af_bella', 2), ('af_nicole', 6), ('af_sarah', 9), ('af_kore', 5), ('af_aoede', 1), ('bf_emma', 21), ('bf_isabella', 22),
          ('am_fenrir', 14), ('am_michael', 16), ('am_puck', 18), ('am_echo', 12), ('am_eric', 13), ('am_liam', 15), ('am_onyx', 17),
          ('bm_george', 26), ('bm_fable', 25), ('bm_lewis', 27), ('bm_daniel', 24)]
build, _, _ = gen.ENGINES['kokoro-fp32']; mc = build(); mc.num_threads = 4
tts = so.OfflineTts(so.OfflineTtsConfig(model=mc, max_num_sentences=1))
out = os.path.join(ROOT, 'samples-cast'); os.makedirs(out, exist_ok=True)
A = os.path.join(ROOT, 'eval', 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8')
rec = so.OfflineRecognizer.from_transducer(encoder=os.path.join(A, 'encoder.int8.onnx'), decoder=os.path.join(A, 'decoder.int8.onnx'),
    joiner=os.path.join(A, 'joiner.int8.onnx'), tokens=os.path.join(A, 'tokens.txt'), num_threads=2, model_type='nemo_transducer')
import torch
torch.set_num_threads(4)
mos = torch.hub.load('tarepan/SpeechMOS:v1.2.0', 'utmos22_strong', trust_repo=True)
import importlib.util
spec = importlib.util.spec_from_file_location('score_wer', os.path.join(ROOT, 'score.py'))
def norm(s):
    import unicodedata, re
    s = unicodedata.normalize('NFKD', s.lower()); s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z' ]+", ' ', s).replace("'s", ' s').split()
def wer(ref, hyp):
    r, h = norm(ref), norm(hyp); dp = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, dp[0] = dp[0], i
        for j in range(1, len(h) + 1):
            cur = min(dp[j] + 1, dp[j - 1] + 1, prev + (r[i - 1] != h[j - 1])); prev, dp[j] = dp[j], cur
    return dp[len(h)] / max(1, len(r))
f = open(os.path.join(ROOT, 'cast.jsonl'), 'w', encoding='utf-8')
for voice, sid in VOICES:
    for key, text in LINES.items():
        a = tts.generate(text, sid=sid, speed=1.0); x = np.array(a.samples, dtype=np.float32)
        sf.write(os.path.join(out, f'{voice}-{key}.wav'), x, a.sample_rate)
        gen.to_opus(x, a.sample_rate, os.path.join(out, f'{voice}-{key}.opus'))
        x16 = resample_poly(x, 2, 3).astype(np.float32)
        s = rec.create_stream(); s.accept_waveform(16000, x16); rec.decode_stream(s)
        with torch.no_grad(): u = float(mos(torch.from_numpy(x16).unsqueeze(0), 16000)[0])
        row = dict(voice=voice, line=key, wer=round(wer(text, s.result.text), 3), utmos=round(u, 3), hyp=s.result.text.strip())
        f.write(json.dumps(row) + '\n'); f.flush(); print(json.dumps(row), flush=True)
