"""Paint the road, street and path ground textures with the owner's local pipeline (2026-10-13).

ComfyUI + FLUX.2 klein 9B Q8 (text to image, 4 steps, CFG 1), through the shared toolkit's GPU lease
(E:/VN-Tools/asset-toolkit/comfy.py): one heavy job at a time, in the foreground. Writes the raw candidates to
<out>/raw/<texture>-s<seed>_00001_.png. scripts/road-art/finish.py turns the chosen ones into the game's tiles.

    python scripts/road-art/generate.py <out_dir> [--only road-wagon,path-trodden] [--seeds 1,2,3,4]

The prompts are scripts/road-art/textures.json (docs/art-prompts.json `frontier-v1/ground-roads` copies them).
"""
import argparse
import json
import os
import sys

sys.path.insert(0, r'E:\VN-Tools\asset-toolkit')
from comfy import Comfy  # noqa: E402
from workflows import text_to_image  # noqa: E402

# The prompts, the chosen candidates and how each is finished: one record, scripts/road-art/textures.json, which the
# delivery (scripts/art-deliveries/road-textures-2026-10-13.mjs) copies into docs/art-prompts.json.
RECORD = json.load(open(os.path.join(os.path.dirname(__file__), 'textures.json'), encoding='utf8'))
STYLE = RECORD['style']
TEXTURES = {t['name']: f"{t['subject']} {STYLE}" for t in RECORD['textures']}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--only', default=','.join(TEXTURES))
    ap.add_argument('--seeds', default='1,2,3,4')
    a = ap.parse_args()
    raw = os.path.join(a.out, 'raw')
    os.makedirs(raw, exist_ok=True)
    names = [n for n in a.only.split(',') if n]
    seeds = [int(s) for s in a.seeds.split(',')]
    with Comfy() as c:
        for name in names:
            for seed in seeds:
                got = c.run(text_to_image(TEXTURES[name], width=1024, height=1024, seed=seed, prefix=f'{name}-s{seed}'), raw)
                print(got[0], flush=True)


if __name__ == '__main__':
    main()
