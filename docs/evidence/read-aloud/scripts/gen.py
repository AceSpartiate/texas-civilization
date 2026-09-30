"""Generate the three test lines for one engine's voices with sherpa-onnx, CPU only.

usage: python gen.py <engine> [threads]
Writes samples/<engine>/<voice>-<line>.wav and .opus, appends timings to results.jsonl.
"""
import json, os, sys, time, glob
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
import sherpa_onnx as so

ROOT = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(ROOT, 'models')
LINES = {
    'news': "A rider has come in from Gonzales. The Mexican soldiers came for the cannon, and the settlers told them to come and take it.",
    'army': "The volunteers are gathering on the Guadalupe. Will you send someone to join them, or keep everyone home to bring in the corn?",
    'names': "Juan Seguín's company rode out from Béxar.",
}
SPANISH = {'es': "La compañía de Juan Seguín salió de Béxar al amanecer."}
assert all(ord(c) < 0x2000 and c not in 'Ã' for c in LINES['names'] + SPANISH['es']), 'mojibake in the test lines'

def d(*p): return os.path.join(M, *p)

def kokoro(folder, model):
    return so.OfflineTtsModelConfig(kokoro=so.OfflineTtsKokoroModelConfig(
        model=d(folder, model), voices=d(folder, 'voices.bin'), tokens=d(folder, 'tokens.txt'),
        data_dir=d(folder, 'espeak-ng-data'), lexicon=d(folder, 'lexicon-us-en.txt'), dict_dir=''))

def piper(folder):
    onnx = [f for f in glob.glob(d(folder, '*.onnx'))][0]
    return so.OfflineTtsModelConfig(vits=so.OfflineTtsVitsModelConfig(
        model=onnx, tokens=d(folder, 'tokens.txt'), data_dir=d(folder, 'espeak-ng-data')))

def kitten(folder):
    onnx = [f for f in glob.glob(d(folder, '*.onnx'))][0]
    return so.OfflineTtsModelConfig(kitten=so.OfflineTtsKittenModelConfig(
        model=onnx, voices=d(folder, 'voices.bin'), tokens=d(folder, 'tokens.txt'), data_dir=d(folder, 'espeak-ng-data')))

def melo(folder):
    return so.OfflineTtsModelConfig(vits=so.OfflineTtsVitsModelConfig(
        model=d(folder, 'model.onnx'), lexicon=d(folder, 'lexicon.txt'), tokens=d(folder, 'tokens.txt')))

# engine -> (model config builder, [(voice label, sid)], spanish voices [(label, sid)])
ENGINES = {
    'kokoro-int8': (lambda: kokoro('kokoro-int8-multi-lang-v1_0', 'model.int8.onnx'),
                    [('af_heart', 3), ('am_michael', 16), ('bf_emma', 21), ('am_fenrir', 14)], [('ef_dora', 28), ('em_alex', 29)]),
    'kokoro-fp32': (lambda: kokoro('kokoro-multi-lang-v1_0', 'model.onnx'),
                    [('af_heart', 3), ('am_michael', 16), ('bf_emma', 21), ('am_fenrir', 14)], [('ef_dora', 28), ('em_alex', 29)]),
    'piper-ljspeech-high': (lambda: piper('vits-piper-en_US-ljspeech-high'), [('ljspeech', 0)], []),
    'piper-kristin': (lambda: piper('vits-piper-en_US-kristin-medium'), [('kristin', 0)], []),
    'piper-norman': (lambda: piper('vits-piper-en_US-norman-medium'), [('norman', 0)], []),
    'piper-john': (lambda: piper('vits-piper-en_US-john-medium'), [('john', 0)], []),
    # speaker2id in the model: expr-voice-2-m=0, 2-f=1, 3-m=2, 3-f=3, 4-m=4, 4-f=5 (KittenTTS: Jasper, Bella, Bruno, Luna, Hugo, Rosie)
    'kitten-mini': (lambda: kitten('kitten-mini-en-v0_8'), [('bella', 1), ('jasper', 0), ('bruno', 2), ('rosie', 5)], []),
    'melo-en': (lambda: melo('vits-melo-tts-en'), [('en-us', 0), ('en-br', 1), ('en-au', 3)], []),
    'pocket-int8': (lambda: pocket('sherpa-onnx-pocket-tts-int8-2026-01-26'),
                    [('alba-casual', ('ref', 'alba-mackenna__casual.wav')), ('alba-announcer', ('ref', 'alba-mackenna__announcer.wav')),
                     ('donation-0a67', ('ref', 'voice-donations__0a67_enhanced.wav')), ('donation-2181', ('ref', 'voice-donations__2181_enhanced.wav'))], []),
    'supertonic3-int8': (lambda: supertonic('sherpa-onnx-supertonic-3-tts-int8-2026-05-11'),
                         [('sid0', ('st', 0, 'en')), ('sid3', ('st', 3, 'en')), ('sid5', ('st', 5, 'en')), ('sid8', ('st', 8, 'en'))],
                         [('sid0', ('st', 0, 'es')), ('sid5', ('st', 5, 'es'))]),
}

def pocket(folder):
    return so.OfflineTtsModelConfig(pocket=so.OfflineTtsPocketModelConfig(
        lm_flow=d(folder, 'lm_flow.int8.onnx'), lm_main=d(folder, 'lm_main.int8.onnx'), encoder=d(folder, 'encoder.onnx'),
        decoder=d(folder, 'decoder.int8.onnx'), text_conditioner=d(folder, 'text_conditioner.onnx'),
        vocab_json=d(folder, 'vocab.json'), token_scores_json=d(folder, 'token_scores.json')))

def supertonic(folder):
    return so.OfflineTtsModelConfig(supertonic=so.OfflineTtsSupertonicModelConfig(
        duration_predictor=d(folder, 'duration_predictor.int8.onnx'), text_encoder=d(folder, 'text_encoder.int8.onnx'),
        vector_estimator=d(folder, 'vector_estimator.int8.onnx'), vocoder=d(folder, 'vocoder.int8.onnx'),
        tts_json=d(folder, 'tts.json'), unicode_indexer=d(folder, 'unicode_indexer.bin'), voice_style=d(folder, 'voice.bin')))

_refs = {}
def say(tts, text, spec):
    """spec: an int speaker id, ('ref', wav) for a cloned reference voice, or ('st', sid, lang) for Supertonic."""
    if isinstance(spec, int):
        return tts.generate(text, sid=spec, speed=1.0)
    g = so.GenerationConfig()
    if spec[0] == 'ref':
        if spec[1] not in _refs:
            x, sr = sf.read(d('kyutai-voices', spec[1]), dtype='float32')
            if x.ndim > 1: x = x.mean(axis=1)
            _refs[spec[1]] = (x.tolist(), sr)
        g.reference_audio, g.reference_sample_rate = _refs[spec[1]]
        g.num_steps = 5
    else:
        g.sid = spec[1]; g.num_steps = 8; g.extra = {'lang': spec[2]}
    g.speed = 1.0
    return tts.generate(text, g)

def to_opus(samples, sr, path):
    target = 24000 if sr not in (8000, 12000, 16000, 24000, 48000) else sr
    if target != sr:
        from math import gcd
        g = gcd(target, sr)
        samples = resample_poly(samples, target // g, sr // g).astype(np.float32)
    samples = np.clip(samples, -1, 1)
    # compression_level 0.9 measured at ~32 kbit/s for speech in libsndfile's Opus encoder
    with sf.SoundFile(path, 'w', samplerate=target, channels=1, format='OGG', subtype='OPUS', compression_level=0.9) as f:
        f.write(samples)

def main():
    name = sys.argv[1]; threads = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    build, voices, spanish = ENGINES[name]
    mc = build(); mc.num_threads = threads; mc.provider = 'cpu'
    t0 = time.perf_counter()
    tts = so.OfflineTts(so.OfflineTtsConfig(model=mc, max_num_sentences=1))
    load = time.perf_counter() - t0
    out = os.path.join(ROOT, 'samples', name); os.makedirs(out, exist_ok=True)
    say(tts, "Warm up.", voices[0][1])
    rows = []
    jobs = [(v, s, k, t) for v, s in voices for k, t in LINES.items()] + [(v, s, k, t) for v, s in spanish for k, t in SPANISH.items()]
    for voice, sid, key, text in jobs:
        t = time.perf_counter()
        a = say(tts, text, sid)
        gen = time.perf_counter() - t
        x = np.array(a.samples, dtype=np.float32); dur = len(x) / a.sample_rate
        base = os.path.join(out, f'{voice}-{key}')
        sf.write(base + '.wav', x, a.sample_rate)
        to_opus(x, a.sample_rate, base + '.opus')
        rows.append(dict(engine=name, voice=voice, line=key, threads=threads, gen_s=round(gen, 3), audio_s=round(dur, 2),
                         rtf=round(gen / dur, 3), sr=a.sample_rate, opus_bytes=os.path.getsize(base + '.opus'), load_s=round(load, 2)))
        print(json.dumps(rows[-1]), flush=True)
    with open(os.path.join(ROOT, 'results.jsonl'), 'a', encoding='utf-8') as f:
        for r in rows: f.write(json.dumps(r) + '\n')

if __name__ == '__main__':
    main()

