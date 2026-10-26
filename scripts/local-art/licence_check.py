"""Prove from each picture's own file which model painted it (plan: docs/ART_PLAN_LOCAL_2026-10-25.md §0.2).

    python scripts/local-art/licence_check.py <png or folder> [...]     exit 0: every picture allowed; 1: any refused

ComfyUI writes the API workflow that made a picture into the PNG (`prompt` text chunk). This reads it and applies the
rule in scripts/local-art/tx_workflows.py: the painting model must be FLUX.2 klein 4B fp8 (Apache-2.0) or HiDream-O1-Image
fp8_scaled (MIT), with only their own encoder and VAE, and no other loader (no klein 9B, no GGUF, no LoRA). A picture
with no workflow in it is refused too: nothing would prove what made it. Run it on every raw/ folder before anything
is chosen. CPU only.
"""
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tx_workflows  # noqa: E402


def check(path):
    """(model or None, [problems]) for one PNG."""
    try:
        text = Image.open(path).text.get('prompt')
    except (OSError, AttributeError) as e:
        return None, [f'unreadable: {e}']
    if not text:
        return None, ['no ComfyUI workflow in the file']
    try:
        wf = json.loads(text)
    except ValueError:
        return None, ['its workflow is not JSON']
    bad = tx_workflows.problems(wf)
    return (None if bad else tx_workflows.which(wf)), bad


def main(args):
    files = []
    for a in args:
        if os.path.isdir(a):
            files += sorted(os.path.join(a, f) for f in os.listdir(a) if f.lower().endswith('.png') and not f.startswith('_'))
        else:
            files.append(a)
    if not files:
        print(__doc__)
        return 2
    refused = 0
    for f in files:
        model, bad = check(f)
        if bad:
            refused += 1
            print(f'REFUSED  {f}: ' + '; '.join(bad))
        else:
            print(f'ok       {f}: {tx_workflows.MODELS[model]}')
    print(f'{len(files) - refused} allowed, {refused} refused')
    return 1 if refused else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
