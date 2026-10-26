"""The only ComfyUI workflows a Texas Civilization art job may run (plan: docs/ART_PLAN_LOCAL_2026-10-25.md §0.2).

The owner may sell this game, so every painted pixel comes from a model whose licence allows commercial use
(docs/ART_TOOLS.md). Two painting models are allowed, and nothing else can be selected here:

    'klein4b'     A: FLUX.2 klein 4B fp8 (Apache-2.0), its Qwen3-4B fp8-mixed text encoder and the FLUX.2 VAE.
                     Built from the shared toolkit's klein templates (E:/VN-Tools/asset-toolkit/workflows.py), with the
                     model pinned to 4B: the toolkit's default is klein 9B, which is non-commercial and refused.
    'hidream-o1'  B: HiDream-O1-Image full, fp8_scaled (MIT). One checkpoint holds the model, its text encoder and
                     its decoder. Built from ComfyUI's own template (E:/Ollama/comfyui/workflows/image_hidream_o1.json)
                     with the Gemma prompt-refine branch left out (it is off in the template too).

    from tx_workflows import build, assert_allowed
    wf = build('klein4b', prompt, refs=[uploaded names], width=1024, height=1024, seed=1, prefix='x')

`assert_allowed(wf)` runs on every workflow `build` returns, and `scripts/local-art/licence_check.py` runs the same
rule on the workflow ComfyUI writes into each output PNG, so each candidate's own file proves its model.
"""
import sys

sys.path.insert(0, r'E:\VN-Tools\asset-toolkit')
import workflows as toolkit  # noqa: E402

KLEIN4B = 'flux-2-klein-4b-fp8.safetensors'
QWEN4B = 'qwen_3_4b_fp8_mixed.safetensors'
# The full Comfy-Org encoder, allowed only as the fallback the owner pre-approved if the fp8-mixed one fails with 4B.
QWEN4B_FULL = 'qwen_3_4b.safetensors'
FLUX2_VAE = 'flux2-vae.safetensors'
HIDREAM = 'hidream_o1_image_fp8_scaled.safetensors'

MODELS = {
    'klein4b': 'FLUX.2 klein 4B fp8 (Apache-2.0)',
    'hidream-o1': 'HiDream-O1-Image full fp8_scaled (MIT)',
}

# Every loader a Texas workflow may contain, and the one file each may load. Any other node whose class name ends in
# "Loader" (UnetLoaderGGUF, LoraLoader, a second checkpoint...) is refused, so a new loader cannot slip a model in.
ALLOWED_FILES = {
    ('UNETLoader', 'unet_name'): {KLEIN4B},
    ('CLIPLoader', 'clip_name'): {QWEN4B, QWEN4B_FULL},
    ('VAELoader', 'vae_name'): {FLUX2_VAE},
    ('CheckpointLoaderSimple', 'ckpt_name'): {HIDREAM},
}
# Nodes that would bring another model's output into a picture: the template's Gemma prompt rewriter.
REFUSED_CLASSES = {'TextGenerate'}


class Refused(ValueError):
    pass


def model_files(wf):
    """[(class_type, input, file)] for every loader in an API-format workflow; input None for a loader not allowed."""
    allowed = {cls: key for cls, key in ALLOWED_FILES}
    out = []
    for node in wf.values():
        ct = node.get('class_type', '')
        if ct in allowed:
            out.append((ct, allowed[ct], node.get('inputs', {}).get(allowed[ct])))
        elif 'Loader' in ct:   # UnetLoaderGGUF, LoraLoader, LoraLoaderModelOnly, a DualCLIPLoader ...
            out.append((ct, None, None))
    return out


def problems(wf):
    """Why this workflow may not paint Texas art; empty when it may."""
    bad = [f'{n.get("class_type")} is refused' for n in wf.values() if n.get('class_type') in REFUSED_CLASSES]
    painters = 0
    for ct, key, name in model_files(wf):
        if key is None:
            bad.append(f'loader {ct} is not allowed')
            continue
        if name not in ALLOWED_FILES[(ct, key)]:
            bad.append(f'{ct} {key}={name!r} is not allowed')
        if ct in ('UNETLoader', 'CheckpointLoaderSimple'):
            painters += 1
    if not painters:
        bad.append('no allowed painting model in the workflow')
    return bad


def assert_allowed(wf):
    bad = problems(wf)
    if bad:
        raise Refused('; '.join(bad))
    return wf


def which(wf):
    """'klein4b' or 'hidream-o1' for an allowed workflow."""
    assert_allowed(wf)
    return 'hidream-o1' if any(n.get('class_type') == 'CheckpointLoaderSimple' for n in wf.values()) else 'klein4b'


# --- A: FLUX.2 klein 4B ------------------------------------------------------------------------------------------------

def _pin_klein4b(wf, encoder=QWEN4B):
    wf['1'] = {'class_type': 'UNETLoader', 'inputs': {'unet_name': KLEIN4B, 'weight_dtype': 'default'}}
    wf['2']['inputs']['clip_name'] = encoder
    return wf


def klein4b(prompt, refs=(), width=1024, height=1024, seed=0, steps=4, prefix='tx', encoder=QWEN4B):
    """Text to image (no refs) or a reference edit (refs: uploaded image names), 4 steps, CFG 1 (distilled)."""
    if refs:
        wf = toolkit.edit(prompt, list(refs), model='klein4b', width=width, height=height, seed=seed, steps=steps, prefix=prefix)
    else:
        wf = toolkit.text_to_image(prompt, model='klein4b', width=width, height=height, seed=seed, steps=steps, prefix=prefix)
    return _pin_klein4b(wf, encoder)


# --- B: HiDream-O1-Image -----------------------------------------------------------------------------------------------

def hidream_o1(prompt, refs=(), width=2048, height=2048, seed=0, steps=40, cfg=5.0, prefix='tx', negative=''):
    """ComfyUI's HiDream-O1 template as an API workflow: ModelNoiseScale 8 (the full model's), patch-seam smoothing as
    the template sets it, BasicScheduler normal, dpmpp_2m_sde_gpu, SamplerCustom CFG 5. refs (uploaded image names,
    up to 10, in order) go through HiDreamO1ReferenceImages onto both conditionings, as the template's edit switch does.
    Width and height are multiples of 32; the model was trained at about 4 MP (2048x2048, 2560x1440 ...)."""
    assert width % 32 == 0 and height % 32 == 0, 'HiDream-O1 sizes are multiples of 32'
    wf = {
        '6': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': HIDREAM}},
        '124': {'class_type': 'ModelNoiseScale', 'inputs': {'model': ['6', 0], 'noise_scale': 8.0}},
        '232': {'class_type': 'HiDreamO1PatchSeamSmoothing',
                'inputs': {'model': ['124', 0], 'start_percent': 0.8, 'end_percent': 1.0, 'pattern': 'single_shift',
                           'passes': 'ramp_2_4', 'blend': 'median', 'strength': 1.0}},
        '112': {'class_type': 'BasicScheduler', 'inputs': {'model': ['124', 0], 'scheduler': 'normal', 'steps': steps, 'denoise': 1.0}},
        '230': {'class_type': 'KSamplerSelect', 'inputs': {'sampler_name': 'dpmpp_2m_sde_gpu'}},
        '110': {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['6', 1]}},
        '188': {'class_type': 'CLIPTextEncode', 'inputs': {'text': negative, 'clip': ['6', 1]}},
        '156': {'class_type': 'EmptyHiDreamO1LatentImage', 'inputs': {'width': width, 'height': height, 'batch_size': 1}},
        '108': {'class_type': 'SamplerCustom',
                'inputs': {'model': ['232', 0], 'add_noise': True, 'noise_seed': seed, 'cfg': cfg, 'positive': ['110', 0],
                           'negative': ['188', 0], 'sampler': ['230', 0], 'sigmas': ['112', 0], 'latent_image': ['156', 0]}},
        '105': {'class_type': 'VAEDecode', 'inputs': {'samples': ['108', 0], 'vae': ['6', 2]}},
        '227': {'class_type': 'SaveImage', 'inputs': {'images': ['105', 0], 'filename_prefix': prefix}},
    }
    if refs:
        ins = {'positive': ['110', 0], 'negative': ['188', 0]}
        for i, name in enumerate(refs, 1):
            wf[str(300 + i)] = {'class_type': 'LoadImage', 'inputs': {'image': name}}
            ins[f'images.image_{i}'] = [str(300 + i), 0]
        wf['104'] = {'class_type': 'HiDreamO1ReferenceImages', 'inputs': ins}
        wf['108']['inputs'].update(positive=['104', 0], negative=['104', 1])
    return wf


BUILDERS = {'klein4b': klein4b, 'hidream-o1': hidream_o1}


def build(model, prompt, **kw):
    """The workflow for one job on an allowed model; anything else raises Refused."""
    if model not in BUILDERS:
        raise Refused(f'{model!r} is not an allowed Texas painting model (allowed: {", ".join(BUILDERS)})')
    return assert_allowed(BUILDERS[model](prompt, **kw))
