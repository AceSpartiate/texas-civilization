"""The Texas painter: run rows of jobs through the shared toolkit's GPU lease with the allowed models only.

    python scripts/local-art/paint.py <rows.json> --out <dir> [--only <row,row>]

rows.json is a list of {name, model ('klein4b' | 'hidream-o1'), prompt, refs: [image paths], width, height, seeds: [..]}
(plus any of tx_workflows' keyword arguments, e.g. "steps"). Every job is built by scripts/local-art/tx_workflows.py,
which refuses any other model, and runs through E:/VN-Tools/asset-toolkit/comfy.py (the GPU lease and queue, used as is):
one heavy job at a time, in the foreground. Rows are run grouped by model, so each model loads once per lease.

Writes <out>/<name>/<name>-s<seed>_00001_.png and <out>/_jobs.json: per job its seconds, the card's peak memory while
it ran and when it started (nvidia-smi, sampled every 0.25 s; the whole card: the desktop, other apps and ComfyUI's
cache included), and any failure. A failed job is
recorded and the run goes on. Resumable: a job whose PNG exists is skipped. Run licence_check.py on the output after.
"""
import argparse
import json
import os
import subprocess
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tx_workflows  # noqa: E402  (puts the toolkit on sys.path)
from comfy import Comfy, GPU_ART, GPU_CHAT  # noqa: E402


class VramPeak:
    """Samples the used memory of the card ComfyUI is on while a job runs."""

    def __init__(self, gpu):
        self.gpu, self.peak, self.start, self._stop = gpu, 0, None, threading.Event()

    def _loop(self):
        while not self._stop.is_set():
            try:
                out = subprocess.run(['nvidia-smi', f'--id={self.gpu}', '--query-gpu=memory.used', '--format=csv,noheader,nounits'],
                                     capture_output=True, text=True, timeout=5).stdout.strip()
                used = int(out.splitlines()[0])
                self.start = used if self.start is None else self.start
                self.peak = max(self.peak, used)
            except (OSError, ValueError, IndexError, subprocess.TimeoutExpired):
                pass
            self._stop.wait(0.25)

    def __enter__(self):
        self._t = threading.Thread(target=self._loop, daemon=True)
        self._t.start()
        return self

    def __exit__(self, *exc):
        self._stop.set()
        self._t.join(6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('rows')
    ap.add_argument('--out', required=True)
    ap.add_argument('--only', default='', help='comma-separated row names: run just these (one lease each call)')
    a = ap.parse_args()
    rows = json.load(open(a.rows, encoding='utf8'))
    if a.only:
        rows = [r for r in rows if r['name'] in a.only.split(',')]
    for r in rows:   # refuse before taking the GPU
        tx_workflows.build(r['model'], r['prompt'], refs=['probe.png'] * len(r.get('refs', [])),
                           width=r['width'], height=r['height'], seed=0)
    rows.sort(key=lambda r: list(tx_workflows.BUILDERS).index(r['model']))
    log_path = os.path.join(a.out, '_jobs.json')
    os.makedirs(a.out, exist_ok=True)
    log = json.load(open(log_path, encoding='utf8')) if os.path.exists(log_path) else []
    extra = lambda r: {k: v for k, v in r.items() if k not in ('name', 'model', 'prompt', 'refs', 'width', 'height', 'seeds')}
    with Comfy() as c:
        for r in rows:
            folder = os.path.join(a.out, r['name'])
            todo = [s for s in r['seeds'] if not os.path.exists(os.path.join(folder, f"{r['name']}-s{s}_00001_.png"))]
            if not todo:
                continue
            refs = [c.upload(p) for p in r.get('refs', [])]
            for seed in todo:
                wf = tx_workflows.build(r['model'], r['prompt'], refs=refs, width=r['width'], height=r['height'], seed=seed,
                                        prefix=f"{r['name']}-s{seed}", **extra(r))
                gpu = c.current_gpu() or GPU_ART
                entry = {'name': r['name'], 'model': r['model'], 'seed': seed, 'width': r['width'], 'height': r['height'],
                         'gpu': '4060 Ti' if gpu == GPU_CHAT else '4080', 'started': time.strftime('%Y-%m-%dT%H:%M:%S')}
                t0 = time.time()
                with VramPeak(gpu) as v:
                    try:
                        entry['files'] = c.run(wf, folder)
                    except Exception as e:   # noqa: BLE001  recorded as a failure; the batch goes on
                        entry['error'] = f'{type(e).__name__}: {e}'[:800]
                entry['seconds'] = round(time.time() - t0, 1)
                entry['vramPeakMiB'], entry['vramStartMiB'] = v.peak, v.start
                log.append(entry)
                json.dump(log, open(log_path, 'w', encoding='utf8'), indent=1)
                print(f"{r['model']:10} {r['name']} s{seed}: {entry['seconds']} s, peak {v.peak} MiB"
                      + (f"  FAILED {entry['error'][:200]}" if 'error' in entry else ''), flush=True)


if __name__ == '__main__':
    main()
