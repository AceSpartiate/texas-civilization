// Accepted unchanged built-in imagegen originals. Root integration owns builder and bindings.
const cast = ['rust','teal','elder','blue'];
export const SHEETS = {
  'courier-dismount': ['dismount','remount','onfoot','horse-wait'].flatMap(action => [1,2,3,4].map(n => `courier-${action}-${n}`)),
  'courier-encounters-vertical': ['listen-s','speak-s','listen-n','speak-n'].flatMap(action => [1,2,3,4].map(n => `mounted-courier-${action}-${n}`)),
  'people-dialogue': cast.flatMap(p => ['speak-e-1','speak-e-2','listen-s-pose','listen-n-pose'].map(a => `${p}-${a}`)),
};
export const ANIMATION_CLIPS = {};
const clip = (name, sprites, durations=500, loop=true, direction='east; west by mirroring', motion='none') => {
  ANIMATION_CLIPS[name] = { frames: sprites.map((sprite,i) => ({sprite,duration:Array.isArray(durations)?durations[i]:durations})), loop, authored:sprites.length>1, motion, direction };
};
for(const action of ['dismount','remount']) clip(`courier-${action}`,[1,2,3,4].map(n=>`courier-${action}-${n}`),[450,450,500,650],false);
clip('courier-onfoot-listen',['courier-onfoot-1','courier-onfoot-2','courier-onfoot-1'],[850,450,750]);
clip('courier-onfoot-speak',['courier-onfoot-3','courier-onfoot-4'],[650,700]);
clip('courier-onfoot-idle',['courier-onfoot-1'],2200,true,'east; west by mirroring','breathe');
clip('courier-horse-wait',[1,2,3,4].map(n=>`courier-horse-wait-${n}`),[1200,1000,900,700]);
for(const dir of ['s','n']) for(const action of ['listen','speak']) clip(`mounted-courier-${action}-${dir}`,[1,2,3,4].map(n=>`mounted-courier-${action}-${dir}-${n}`),[650,550,600,700],true,dir==='s'?'south':'north');
for(const p of cast) {
  clip(`${p}-speak-e`,[1,2].map(n=>`${p}-speak-e-${n}`),[650,750]);
  clip(`${p}-speak`,[1,2].map(n=>`${p}-speak-e-${n}`),[650,750]);
  for(const dir of ['s','n']) clip(`${p}-listen-${dir}`,[`${p}-listen-${dir}-pose`],2200,true,dir==='s'?'south':'north','breathe');
}
export const promptEntries = [
  {
    "sheet": "courier-dismount",
    "promptId": "frontier-v1/courier-dismount",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate, then background-extraction edit",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-b5174d27-5b34-4867-8b86-ad9b00822c23.png",
    "initialGeneratedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-ca3d9092-c500-4705-b00b-709ba18d96a8.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/courier-dismount.png",
    "postProcessing": "None outside built-in imagegen. Accepted RGBA PNG copied unchanged; source pixels not rewritten.",
    "review": "Accepted after genuine RGBA transparency and full-pose visual inspection. Initial generation rejected for painted checkerboard, corrected through one imagegen background-extraction edit."
  },
  {
    "sheet": "courier-encounters-vertical",
    "promptId": "frontier-v1/courier-encounters-vertical",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate, then background-extraction edit",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-f771b8a0-b89d-4cba-af0e-7de62171f284.png",
    "initialGeneratedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-d6916f4a-0357-4c22-9713-b0f278040a65.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/courier-encounters-vertical.png",
    "postProcessing": "None outside built-in imagegen. Accepted RGBA PNG copied unchanged; source pixels not rewritten.",
    "review": "Accepted after genuine RGBA transparency and full-pose visual inspection. Initial generation rejected for painted checkerboard, corrected through one imagegen background-extraction edit."
  },
  {
    "sheet": "people-dialogue",
    "promptId": "frontier-v1/people-dialogue",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate, then background-extraction edit",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-df8224fb-8a82-4147-9cda-c5b4de9dd26e.png",
    "initialGeneratedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-9f6559af-2aeb-4284-8860-2c6b93baba8a.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-dialogue.png",
    "postProcessing": "None outside built-in imagegen. Accepted RGBA PNG copied unchanged; source pixels not rewritten.",
    "review": "Accepted after genuine RGBA transparency and full-pose visual inspection. Initial generation rejected for painted checkerboard, corrected through one imagegen background-extraction edit."
  }
];
export const provenanceEntries = [
  {
    "sheet": "courier-dismount",
    "promptId": "frontier-v1/courier-dismount",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate, then background-extraction edit",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-b5174d27-5b34-4867-8b86-ad9b00822c23.png",
    "initialGeneratedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-ca3d9092-c500-4705-b00b-709ba18d96a8.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/courier-dismount.png",
    "postProcessing": "None outside built-in imagegen. Accepted RGBA PNG copied unchanged; source pixels not rewritten.",
    "review": "Accepted after genuine RGBA transparency and full-pose visual inspection. Initial generation rejected for painted checkerboard, corrected through one imagegen background-extraction edit.",
    "rejectedAttempts": [
      {
        "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-ca3d9092-c500-4705-b00b-709ba18d96a8.png",
        "reason": "RGB with painted checkerboard; preserved at original generation path."
      }
    ],
    "references": [
      "public/assets/frontier-v1/atlases/courier-mounted.png",
      "public/assets/frontier-v1/atlases/courier-encounters.png"
    ]
  },
  {
    "sheet": "courier-encounters-vertical",
    "promptId": "frontier-v1/courier-encounters-vertical",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate, then background-extraction edit",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-f771b8a0-b89d-4cba-af0e-7de62171f284.png",
    "initialGeneratedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-d6916f4a-0357-4c22-9713-b0f278040a65.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/courier-encounters-vertical.png",
    "postProcessing": "None outside built-in imagegen. Accepted RGBA PNG copied unchanged; source pixels not rewritten.",
    "review": "Accepted after genuine RGBA transparency and full-pose visual inspection. Initial generation rejected for painted checkerboard, corrected through one imagegen background-extraction edit.",
    "rejectedAttempts": [
      {
        "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-d6916f4a-0357-4c22-9713-b0f278040a65.png",
        "reason": "RGB with painted checkerboard; preserved at original generation path."
      }
    ],
    "references": [
      "public/assets/frontier-v1/atlases/courier-mounted.png",
      "public/assets/frontier-v1/atlases/courier-encounters.png"
    ]
  },
  {
    "sheet": "people-dialogue",
    "promptId": "frontier-v1/people-dialogue",
    "tool": "built-in image_gen.imagegen",
    "mode": "generate, then background-extraction edit",
    "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-df8224fb-8a82-4147-9cda-c5b4de9dd26e.png",
    "initialGeneratedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-9f6559af-2aeb-4284-8860-2c6b93baba8a.png",
    "runtimeFile": "public/assets/frontier-v1/atlases/people-dialogue.png",
    "postProcessing": "None outside built-in imagegen. Accepted RGBA PNG copied unchanged; source pixels not rewritten.",
    "review": "Accepted after genuine RGBA transparency and full-pose visual inspection. Initial generation rejected for painted checkerboard, corrected through one imagegen background-extraction edit.",
    "rejectedAttempts": [
      {
        "generatedSourcePath": "C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-9f6559af-2aeb-4284-8860-2c6b93baba8a.png",
        "reason": "RGB with painted checkerboard; preserved at original generation path."
      }
    ],
    "references": [
      "public/assets/frontier-v1/atlases/civilians.png"
    ]
  }
];
export const notes = [
  '2026-09-14: Three 1254x1254 true RGBA atlases, 48 full poses. All three initial RGB checkerboard outputs rejected; one built-in background-extraction edit per sheet succeeded. Accepted outputs copied byte-for-byte and original paths preserved.',
  'Dismount/remount show seated, leg-over-saddle, lowering/rising, and standing poses. They are independent horse-and-rider composites, not a formal layered rig. Source horse size and ground line vary modestly; renderer must register the horse across transition clips and avoid per-row height scaling jumps.',
  'Dismount row 3 includes whole horse with rider on foot. Do not simultaneously draw a separate waiting horse for those frames. Waiting row 4 contains horse without rider and loose tack/reins; no external tether post or explicit fixed tie point was drawn.',
  'Vertical dialogue faces south in rows 1-2 and north in rows 3-4. South speaking switches gesturing hand between columns 2 and 3. Listening head tilts/nods are subtle.',
  'Existing cast identity and outfit reviewed against civilians. East speaking has two hand poses per identity; front/back listening are single authored poses with presentation breathing, not generated multi-frame idle loops.',
  'Non-looping dismount/remount are delivery definitions; final encounter binding, scale/anchor registration, catalog playback, full manifest checks and tests are owned by integration.'
];

// Dismount additionally needed a gutter correction after measured overlap review.
{
  const accepted = 'C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-378717c9-51fb-4541-ade6-cb06677b196f.png';
  const narrow = 'C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-b5174d27-5b34-4867-8b86-ad9b00822c23.png';
  const spaced = 'C:/Users/zachw/.codex/generated_images/01a09f7b-b073-70e2-8813-9794a8e87095/exec-20b69f31-2a51-4663-ac5c-699ed0094cb9.png';
  const p = promptEntries.find(e => e.sheet === 'courier-dismount');
  p.editHistory = [
    { prompt: p.alphaEditPrompt, generatedSourcePath: narrow, review: 'Rejected after measurement: horse-wait-4 tail overlapped neighbor by 84 visible pixels (0.251%).' },
    { prompt: "Use case: precise-object-edit. This is a 4x4 courier-dismount sprite atlas. Change ONLY spacing: uniformly shrink EACH of the 16 complete illustrated sprites by 12% within its OWN existing cell, keeping it centered at the same cell center. Apply exactly the SAME 88% scaling to every complete horse-and-rider sprite, and to each riderless horse. This creates clear empty gutters so the tail of bottom right horse no longer overlaps the head of its left neighbor. Preserve every original pose, anatomy, identity, colors, contours and the existing 4x4 row/column order. Do not invent any new pose or redraw. Keep final canvas 1254x1254. Keep background genuinely TRANSPARENT RGBA alpha=0, no checkerboard or opaque background. All full poses isolated, no shadows. This is a layout-spacing correction only.", generatedSourcePath: spaced, review: 'Poses and gutters accepted; RGB checkerboard rejected.' },
    { prompt: "Use case: background-extraction. Remove ONLY the grey-white checkerboard from this revised 4x4 courier-dismount atlas, replace with genuine alpha=0 transparency in RGBA PNG. Preserve all sixteen complete horse and rider figures, exact current scaled sizes, colors, poses and positions, with their generous empty gutters. Keep 1254x1254 canvas. No redraw, no enlargement, no rearranging, no additional shadows. Background should be actually transparent, not checkerboard or white matte.", generatedSourcePath: accepted, review: 'Final transparent output accepted after visual review; original PNG copied unchanged.' }
  ];
  p.generatedSourcePath = accepted;
  p.review = 'Accepted after genuine RGBA and full-pose review, following two background-extraction edits and one imagegen spacing correction.';
  const v = provenanceEntries.find(e => e.sheet === 'courier-dismount');
  v.generatedSourcePath = accepted;
  v.review = p.review;
  v.rejectedAttempts.push({generatedSourcePath:narrow,reason:'84 visible pixels of tail overlapped neighboring frame; 0.251% exceeded measurement tolerance.'},{generatedSourcePath:spaced,reason:'RGB checkerboard after spacing correction; fixed by final built-in background extraction.'});
}
notes[0] = '2026-09-14: Three 1254x1254 true RGBA atlases, 48 full poses. Initial RGB checkerboards rejected and corrected through built-in extraction. Dismount also received a built-in spacing correction and second extraction to remove measured tail overlap. Accepted outputs copied byte-for-byte and original paths preserved.';

