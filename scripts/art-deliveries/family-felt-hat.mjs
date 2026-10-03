import { SHEETS as familySheets, ANIMATION_CLIPS as familyClips } from './family-appearance-2026-10-02.mjs';
const rename = value => value.replace('father-straw', 'father-hat');
export const SHEETS = { 'people-family-father-hat': familySheets['people-family-father-straw'].map(rename) };
export const ANIMATION_CLIPS = Object.fromEntries(Object.entries(familyClips).filter(([id])=>id.startsWith('father-straw-')).map(([id,clip])=>[rename(id), {...clip,frames:clip.frames.map(frame=>({...frame,sprite:rename(frame.sprite)}))}]));
export const promptEntries = [{
  "sheet": "people-family-father-hat",
  "promptId": "frontier-v1/people-family-father-hat",
  "tool": "built-in image_gen.imagegen",
  "mode": "edit",
  "prompt": "Edit this 16-pose transparent family father sprite sheet: replace the woven straw hat in EVERY cell with a medium-brim dark brown FELT frontier hat, smooth felt texture, plain dark hatband. Keep the clean-shaven father with NO beard or moustache, same face, skin, hair, proportions, rust shirt, trousers, boots, all walking/work/rest poses and exact warm outlined storybook style. No other changes. Preserve alpha gutters and full cutout figures with safe cell margins. No background, shadows, text, grid or checkerboard.",
  "referenced_image_paths": [
    "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-e9afaedc-52d7-4bc9-8fe2-79852986f2ea.png"
  ],
  "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3c898308-a249-4e72-b9f6-2324dd395517.png",
  "runtimeFile": "public/assets/frontier-v1/atlases/people-family-father-hat.png",
  "postProcessing": "None. PNG copied unchanged.",
  "review": "Clean-shaven felt hat distinguishes the hat choice from hat and beard; standing, walking, work and rest stay the same identity."
}];
export const provenanceEntries = promptEntries.map(({prompt,...entry})=>entry);
export const notes = ['Felt hat is clean-shaven; hat and beard remains the existing elder figure.'];

