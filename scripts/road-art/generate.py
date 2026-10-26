"""Paint the road, street and path ground textures with the owner's local pipeline (2026-10-13; repainted with klein 4B 2026-10-26).

ComfyUI + FLUX.2 klein 4B fp8 (Apache-2.0), 4 steps, CFG 1, 1024x1024, through the shared toolkit's GPU lease
(E:/VN-Tools/asset-toolkit/comfy.py): one job at a time, in the foreground. Every workflow is built by
scripts/local-art/tx_workflows.py, which refuses any other model (the 2026-10-13 tiles were klein 9B, non-commercial:
docs/ART_PLAN_LOCAL_2026-10-25.md, batch 0). Writes the raw candidates to <out>/raw/<texture>-s<seed>_00001_.png.
scripts/road-art/finish.py turns the chosen ones into the game's tiles.

    python scripts/road-art/generate.py <out_dir> [--only road-wagon,path-trodden]

Two kinds of candidate for each texture, numbered apart so a seed names one picture:
  seeds 1-4  reference edits: Astra's own ground pieces and the map's ground (scripts/local-art/bakeoff_2026_10_25.py
             `refs` makes them), for palette and brushwork only. The 2026-10-25 bake-off painted these with the same
             prompt, references and seeds; they are copied in rather than repainted.
  seeds 5-8  text to image, the subject and style alone.
The prompts are scripts/road-art/textures.json (docs/art-prompts.json `frontier-v1/ground-roads` copies them).
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'local-art'))
import tx_workflows  # noqa: E402  (puts the toolkit on sys.path)
import bakeoff_2026_10_25 as bakeoff  # noqa: E402
from comfy import Comfy  # noqa: E402

RECORD = json.load(open(os.path.join(HERE, 'textures.json'), encoding='utf8'))
STYLE = RECORD['style']
EDIT_SEEDS, TEXT_SEEDS = [1, 2, 3, 4], [5, 6, 7, 8]


def prompt(texture, mode):
    """The prompt of one candidate: the reference note before an edit, the way's direction for a tile laid along it."""
    body = texture['subject'] + bakeoff.ALONG.get(texture['name'], '') + ' ' + STYLE
    return (bakeoff.REF_NOTE + body) if mode == 'edit' else body


def refs(texture):
    return [os.path.join(bakeoff.REFS, r) for r in bakeoff.ROAD_REFS[texture['name']]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--only', default=','.join(t['name'] for t in RECORD['textures']))
    a = ap.parse_args()
    raw = os.path.join(a.out, 'raw')
    os.makedirs(raw, exist_ok=True)
    if not all(os.path.exists(p) for t in RECORD['textures'] for p in refs(t)):
        bakeoff.make_refs()
    names = [n for n in a.only.split(',') if n]
    todo = [(t, mode, seed) for t in RECORD['textures'] if t['name'] in names
            for mode, seeds in (('edit', EDIT_SEEDS), ('text', TEXT_SEEDS)) for seed in seeds
            if not os.path.exists(os.path.join(raw, f"{t['name']}-s{seed}_00001_.png"))]
    if not todo:
        return
    with Comfy() as c:
        uploaded = {}
        for t, mode, seed in todo:
            names_up = []
            if mode == 'edit':
                for p in refs(t):
                    uploaded.setdefault(p, c.upload(p))
                    names_up.append(uploaded[p])
            wf = tx_workflows.build('klein4b', prompt(t, mode), refs=names_up, width=1024, height=1024, seed=seed,
                                    prefix=f"{t['name']}-s{seed}")
            print(c.run(wf, raw)[0], flush=True)


if __name__ == '__main__':
    main()
