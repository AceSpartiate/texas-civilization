const action1 = [
  'survey-plot','cut-lane','dig-well','plant-field',
  'harvest-field','clear-plot','fence-plot','build-house',
  'help-raise','hunt-timber','hunt-land','practise-shooting',
  'sell-cotton','fetch-powder','fetch-seed','sell-food',
].map(key => `icon-${key}`);

const action2 = [
  'mend-hoe','replace-hoe','visit-shop','make-furniture',
  'buy-furniture','fell-trees','haul-logs','travel-gonzales',
  'travel-home','visit','work','rest',
  'stop-chore',null,null,null,
].map(key => key ? `icon-${key}` : null);

const service = [
  'enlist-regular','enlist-auxiliary','join-garrison','join-matamoros',
  'go-vote','winter-recall','join-relief','join-houston',
  'camp-drill','camp-forage','camp-guard','camp-scout',
  'hunt-road','tend-sick','trade-crossing','fetch-logs',
].map(key => `icon-${key}`);

const subsistence = [
  'take-small-game','fish-the-water','fish-road','gather-oysters',
  'cut-bee-tree','butcher-beef','butcher-hog','look-to-stock',
].map(key => key ? `icon-${key}` : null);

export const SHEETS = {
  'icons-family-actions-1': action1,
  'icons-family-actions-2': action2,
  'icons-family-service': service,
  'icons-family-subsistence': subsistence,
};

export const ANIMATION_CLIPS = {};

const shared = 'Polished hand-painted 2D production UI icons for an 1835-36 Texas frontier game; exact 4 by 4 grid, equal cells, one readable isolated silhouette per occupied cell, restrained umber/ochre/rust/sage/indigo/cream palette, thin dark-brown outline, genuine transparent alpha and gutters; period-appropriate; no text, labels, borders, cell backgrounds or watermark.';
const prompts = {
  'icons-family-actions-1': `${shared} Row-major subjects: stake being driven; axe cutting brush by track; spade at stone-lined well; hand sowing furrow; sickle and sheaf; grubbing hoe and stump; maul splitting rail; broadaxe notching log; two hands lifting log; rifle among pines; deer head; wooden shooting mark; cotton bale and coin; powder horn and lead; seed sack; meal barrel and coin.`,
  'icons-family-actions-2': `${shared} Row-major subjects: worn hoe blade and file; new hoe and coin; period storefront; hands shaping stool; chair and coin; axe biting tree; chained log under ox yoke; town signpost; open cabin doorway; two cabins and path; hoe and basket; bedroll and hat; raised stop hand; final three cells empty.`,
  'icons-family-service': `${shared} Row-major subjects: regular enlistment paper, quill and shako; volunteer paper, quill and broad-brim hat; mission-fort gate and raised musket; south compass and boot; ballot box; mounted rider leaving camp for home; rider hurrying to mission; volunteer approaching command tent; shoulder-arms drill; longhorn horns and corn; bayonet and moon; horseshoe and spyglass; rifle above road campfire; sick person under blanket and cup; coin passed across ferry rail; logs on ox wagon.`,
  'icons-family-subsistence': `Polished hand-painted 2D production UI icons for an 1835-36 Texas frontier game; exact 4 by 2 grid on a wide 2:1 transparent canvas, equal cells, one readable isolated silhouette per cell, restrained frontier palette and thin dark-brown outline. Row-major: fox squirrel on oak branch and shot pouch; hand line lifting fish from creek; hand line and fish by road campfire; hand gathering oysters; axe in hollow bee tree and honeycomb; longhorn, butcher knife and salt crock; hog, butcher knife and salt crock; rider, hoofprints, grass and branding iron. Humane neutral symbols without gore; no text, labels, borders, cell backgrounds, residue or watermark.`,
};

const sources = {
  'icons-family-actions-1': 'C:/Users/zachw/.codex/generated_images/01a0c395-fb73-7722-9646-234189c7e074/exec-e314e267-ffa8-4b25-8958-92794880c69f.png',
  'icons-family-actions-2': 'C:/Users/zachw/.codex/generated_images/01a0c395-fb73-7722-9646-234189c7e074/exec-2a5cb4a3-f971-459f-be8e-ef7879d04e2d.png',
  'icons-family-service': 'C:/Users/zachw/.codex/generated_images/01a0c395-fb73-7722-9646-234189c7e074/exec-d657bf4c-9d32-4407-8deb-8f27074b49f1.png',
  'icons-family-subsistence': 'C:/Users/zachw/.codex/generated_images/01a0c395-fb73-7722-9646-234189c7e074/exec-77af2b0a-742a-4229-be8f-74af3e8b42de.png',
};

export const promptEntries = Object.keys(SHEETS).map(sheet => ({
  sheet,
  promptId: `frontier-v1/${sheet}`,
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt: prompts[sheet],
  generatedSourcePath: sources[sheet],
  runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
  postProcessing: 'None. Generated PNG copied unchanged; only read-only validation.',
  review: sheet === 'icons-family-subsistence'
    ? 'Accepted as eight distinct readable subsistence actions in a fully occupied 4-by-2 atlas.'
    : 'Accepted as distinct period-plausible action silhouettes on genuine alpha with explicit reading-order mapping.',
}));

export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = [
  'Family-panel icons are presentation only. Availability, refusal reasons, chore progress, travel, service, resources and outcomes remain authoritative simulation state.',
  'Every live PANEL_ICONS key has a corresponding delivered icon frame; generated unused cells are never registered.',
];
