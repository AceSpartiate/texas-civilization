// Claude-drawn stand-ins in the places seen most, painted with the owner's local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0),
// 2026-10-26: batch 5 of docs/ART_PLAN_LOCAL_2026-10-25.md, docs/ART_DELIVERY_2026-10-26-LOCAL-CLAUDE-ICONS.md. Every sprite is
// asked for by name (a frontier-v1 frame of a Claude frame's name is taken over it), and Claude's of the same names are retired.
import { localDelivery } from '../local-art/delivery.mjs';

const SHEETS = {
  'icons-family-local-3': ['icon-child-doll', 'icon-child-tag', 'icon-child-hide', 'icon-child-cart', 'icon-child-hoop', 'icon-child-marbles',
    'icon-child-hens', 'icon-flee-hide', 'icon-flee-bundle', 'icon-flee-cow', 'icon-road-lookout', 'icon-road-sing', 'icon-road-little-ones',
    'icon-camp-fire', 'icon-ferry-help', 'icon-share-food'],
  'icons-family-local-4': ['icon-ford-carry', 'icon-child-help', 'icon-ask-neighbours', 'icon-rest-road', 'icon-camp-apart', 'icon-nurse-home'],
  'marks-local-2': ['mark-sick'],
  'homecoming-local-1': ['farm-neighbour-porch', 'farm-neighbour-ramada', 'grave-marker', 'coins-and-paper'],
  'icons-family-local-5': ['icon-child-stick-horse'],
};

const delivery = localDelivery({
  batch: 'b5',
  sheets: SHEETS,
  sources: 'docs/art-sources/icons-local-claude-2026-10-26',
  made: { 'coins-and-paper': 'coins-and-paper-repair' },
  redone: ['icon-child-hoop', 'icon-ferry-help', 'icon-child-stick-horse'],
  postProcessing: 'Each painted at 1024x1024 on a flat pale ground from a board of two of Astra\'s icons nearest in subject (her panel marks for the sick mark; her cabin, porch and jacals for the farmsteads; her bucket, rail and table for the props), keyed out on the CPU, fitted to her icon size (300 px; the mark 320; the farmsteads 370) and packed one to a clear 384 cell. Claude\'s icon of each subject was the subject sketch: what it shows, never how.',
  review: 'Four candidates each (eight of each farmstead) on keyed contact sheets (contact-1.jpg, contact-2.jpg, contact-repair.jpg); every candidate licence-checked from its own file; picks looked at full size: writing on the bill of sale and the coins refused (text), a railway under the lookout and a motor truck as the wagon refused (anachronism). The stick horse not shipped after its one repair (a real horse every time); it, the ferry (hands on a rope) and the hoop (taller than the girl) repainted 2026-10-27 from drawn guide sketches (docs/ART_DELIVERY_2026-10-27-LOCAL-FIXES.md): a pole with only a carved head, a man carrying a sack onto a flat ferry under its rope, a hoop no higher than her waist.',
});

export const { promptEntries, provenanceEntries } = delivery;
export { SHEETS };
