# Art tools and their licences

Owner, 2026-10-25: *"check the licence then start replacing stand-ins."* The owner may sell this game. Any model that
paints pixels which ship in it must allow commercial use of what it makes. This page lists the image models and tools used
for this game's art, with each one's licence. [AUDIO_LICENSES.md](AUDIO_LICENSES.md) does the same for sound. The method is
the owner's local asset pipeline (the `asset-pipeline` skill, its shared toolkit `E:\VN-Tools\asset-toolkit\`). The plan
that uses it is [ART_PLAN_LOCAL_2026-10-25.md](ART_PLAN_LOCAL_2026-10-25.md).

## The rule

**Allowed to paint this game's art:** models under Apache-2.0, MIT or an equally permissive licence, listed below as
*allowed*. **Refused:** any non-commercial, research-only or "personal use" licence. That includes everything under the
FLUX Non-Commercial License. Refused models also may not supply a reference image, a seam repair or any other step whose
output reaches a shipped pixel.

**FLUX.2 klein 9B is refused** (FLUX Non-Commercial License v2.1: §1(c) excludes revenue-generating use, §4(a) forbids
commercial or production use). It is the shared toolkit's default, so a Texas job never calls the toolkit's painting
scripts directly (`batch_run.py`, `crop_edit.py`, `workflows.edit`/`text_to_image` with their default `model`). It goes
through the Texas builder, `scripts/local-art/tx_workflows.py`, which can select only FLUX.2 klein 4B fp8 (the owner's pick,
2026-10-26; HiDream-O1, the bake-off's B, was removed from the machine on 2026-10-25 and can no longer be selected) and refuses
any other loader. `scripts/local-art/licence_check.py <png|folder>` reads the
workflow ComfyUI embeds in each output PNG and refuses any picture made by anything else, or with no workflow in it (it
refuses the four 2026-10-13 9B road paintings from their own files). Z-Image Turbo is licence-allowed below but is not
selectable by the builder (owner's bake-off brief, 2026-10-25, and pick, 2026-10-26: klein 4B).

## Painting models

| Model | Source | Bytes | sha256 | Licence | Path | Use | Status |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| FLUX.2 klein 4B fp8 | huggingface.co/black-forest-labs/FLUX.2-klein-4b-fp8 | 4,070,624,520 | `97ed34fe0567e436200f2faee3939b88f2b5d99f8af2a4dc16532c4245c0ccb6` (rechecked on disk 2026-10-25) | Apache-2.0 | `D:\VN-Tools\ComfyUI_windows_portable\ComfyUI\models\diffusion_models\flux-2-klein-4b-fp8.safetensors` | Painting from text and reference edits for every Texas job | **allowed**, owner-approved 2026-10-25 |
| HiDream-O1-Image full, fp8_scaled | huggingface.co/Comfy-Org/HiDream-O1-Image | 8,067,535,296 | `05ad98bc4a94557697f31b839f6dbf6dba293a353d9e3c52eef7818b5802d206` (rechecked on disk 2026-10-25) | MIT | `D:\VN-Tools\ComfyUI_windows_portable\ComfyUI\models\checkpoints\hidream_o1_image_fp8_scaled.safetensors` | Painting from text, instruction edits from references (up to 10), skeleton/layout conditioning. One checkpoint: its own text encoder and decoder, no separate VAE. Native in ComfyUI 0.39 (template `E:\Ollama\comfyui\workflows\image_hidream_o1.json`); the full model, not Dev, for edits. The template's Gemma prompt-refine branch is not used | **allowed**, owner-approved 2026-10-25; in the bake-off ([ART_BAKEOFF_2026-10-25.md](ART_BAKEOFF_2026-10-25.md)) |
| Qwen3 4B text encoder, fp8 mixed | huggingface.co/Comfy-Org/z_image_turbo (split files) | 5,631,994,051 | n/a | Apache-2.0 | `E:\VN-Tools\comfy_models\text_encoders\qwen_3_4b_fp8_mixed.safetensors` | klein 4B's text encoder (CLIPLoader type `flux2`) and Z-Image's (`lumina2`) | **allowed**. klein 4B with this file has not been run yet: the batch 0 smoke job proves it |
| FLUX.2 VAE | huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-4b | 336,211,292 | n/a | Apache-2.0 (Black Forest Labs' FLUX.2 VAE release; reread the model card before batch 0) | `D:\VN-Tools\ComfyUI_windows_portable\ComfyUI\models\vae\flux2-vae.safetensors` | klein 4B's VAE | **allowed** |
| Z-Image Turbo bf16 + `z_image_ae` VAE | huggingface.co/Comfy-Org/z_image_turbo | 12,309,866,400 + 335,304,388 | n/a | Apache-2.0 | `E:\VN-Tools\comfy_models\{diffusion_models\z_image_turbo_bf16, vae\z_image_ae}.safetensors` | Plain text-to-image only (it has no reference edit) | **allowed** |
| FLUX.2 klein 9B Q8_0 GGUF | huggingface.co (FLUX.2 klein 9B) | 9,978,304,800 | n/a | FLUX Non-Commercial v2.1 | `...\diffusion_models\flux-2-klein-9b-Q8_0.gguf` | Painted the 2026-10-13 road tiles. They are to be repainted (plan, batch 0) | **refused** for this game |
| RefControl pose and depth LoRAs | huggingface.co/thedeoxen/refcontrol-FLUX.2-klein-9B-* | 165,704,416 / 165,704,480 | n/a | Apache-2.0 on their own cards, but trained for klein 9B and usable only with it | `E:\VN-Tools\comfy_models\loras\` | none here | **not usable** (no 4B version) |

## Tools whose output never ships, or only shapes it

| Tool | Licence | Use here |
| --- | --- | --- |
| ComfyUI (portable) | GPL-3.0 | Runs the models. The licence covers the program, not the pictures it makes. |
| Shared toolkit `comfy.py` (GPU lease), `zoomsheet.py`, `colormatch*.py`, `figpaste.py` | the owner's own | Queue, review and compositing |
| BiRefNet (`cutout.py`) | MIT | Cut-outs: its mask decides which painted pixels are kept |
| DWPose (`posecount.py`), Qwen3-VL 8B (`inspect_art.py`) | Apache-2.0 | Review only: limb counts, text and signature checks |

Add a row here before any new model or LoRA touches Texas art. Record each sheet's model in its provenance `tool` string
too, e.g. `local ComfyUI, FLUX.2 klein 4B fp8 (Apache-2.0)` (docs/art-provenance.json).
