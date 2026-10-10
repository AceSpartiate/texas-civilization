// Astra's art always wins (owner, 2026-09-29: "a lot of astra art has been replaced with worse versions"). The rule, one place:
//
//   A Claude-drawn frame (public/assets/claude-standins/, `madeBy: "claude"`) is drawn only for a SUBJECT Astra has not drawn.
//
// The subject is who or what the frame shows - a person of the family, a child, the baby, a volunteer, a regular, a dragoon, a
// named person, an animal, a vehicle, a house, a kind of tree, a prop - not the pose or the name. Where Astra has drawn the
// subject in any pose under any name, every Claude frame of it steps aside and the page draws hers, the way it did before
// Claude's art (v2026.09.28.1): her nearest pose, with any tool or flash the canvas puts in the hands. So rust chopping is her
// rust at the hoe with the drawn axe, not Claude's rust; a girl at play is her girl walking; the wagon and its ox are her wagon
// and her ox; Castrillón walking south is her Castrillón, not a Claude one.
//
// Claude's frames stay where she has drawn nothing of the subject: people she has not drawn (Kimbell, Martin, the Esparza
// women and boys, the people of Béxar, Sutherland), places and buildings she has not drawn, the family panel's portraits and
// marks (Claude's since v2026.09.28.1), icons whose meaning she has not drawn, light and effects the canvas used to scribble.
// The moment she draws one of those subjects - one frame of `kimbell-*` - all of Claude's Kimbell steps aside with no change
// to any code (public/art.js `mergeStandins`).
//
// Each rule: [pattern on the Claude frame's name, subject, the Astra name prefixes that show she has drawn it]. A prefix
// matches a frame of hers of exactly that name or that name followed by `-` (`rust` matches `rust-work-1`; `cow` matches
// `cow-walk-1`, not `cowboy`). `$1` is the pattern's first group. The first rule that matches decides. A Claude frame no rule
// matches is withheld - a new Claude module must say what it draws here (tests/astra-art-wins.test.mjs fails until it does).
// ceiling: a subject is decided by name, and a line here is a judgement (a lancer is her dragoon; a Tejano rider of Seguín's
// company is not her mounted courier). A line is the way to overturn one; nothing else needs to change.
const RULES = [
  // The family panel's pictures and marks: their own meaning (portraits and marks are Claude's since v2026.09.28.1).
  [/^portrait-(.+)$/, 'portrait-$1', ['portrait-$1']],
  [/^mark-sick$/, 'the sick mark', ['mark-sick', 'icon-tend-sick']], // her nursing icon in a disc stood for it
  [/^icon-rest-road$/, 'rest', ['icon-rest-road', 'icon-rest']],
  [/^(icon|mark)-(.+)$/, '$1-$2', ['$1-$2']],
  // The lone parent's wedding (public/courtship.js): the cast's gestures of the courtship and the supper - the greeting, the shy
  // glance, the laugh, the vow, the commissioner reading the bond, the fiddle - are taken as a scene of their own, which Astra has
  // not drawn (the coordinator's decision, 2026-09-29, not the owner's; the ONE place a Claude drawing of her cast figures is
  // shown). ceiling: the same reasoning would have kept Claude's chop and play; delete this line and the wedding falls back to her
  // figures speaking and standing (`POSE_STANDIN`), as everything else does.
  [/^(rust|teal|elder|blue|rust-woman|indigo|ochre|blue-girl)-(greet|shy|laugh|vow|fiddle)(-|$)/, 'the wedding\'s $2', ['$1-$2']],
  [/^elder-read-paper/, 'the wedding\'s reading of the bond', ['elder-read-paper']],
  // Its places: the farmsteads are her cabin and her jacal with a porch and an olla added, the supper table her table - hers
  // (`FARM_ART`'s second names, `home-table`); the painted yards behind the scenes are Claude's, she has painted none.
  [/^farm-neighbour-porch/, 'cabin', ['cabin-wide', 'house-porch']],
  [/^farm-neighbour-ramada/, 'jacal with a ramada', ['jacal-ramada']],
  [/^wedding-table/, 'table', ['home-table']],
  // The homecoming's scenes at the end of a family's video (request 2026-09-29): a wooden marker, and coin and a paper on the table,
  // neither of which she has drawn.
  [/^grave-marker/, 'a grave marker', ['grave-marker']],
  [/^coins-and-paper/, 'coins and a paper', ['coins-and-paper']],
  [/^courtship-yard-/, 'a yard painted behind a scene', ['courtship-yard']],
  // The family: the eight grown cast figures (at work, at ease, holding the baby, sick, fighting, driving, riding in the wagon),
  // the three children and the baby. `blue-girl` and `rust-woman` before `blue` and `rust`.
  [/^(rust-woman|blue-girl|rust|teal|elder|blue|indigo|ochre)-/, '$1', ['$1']],
  [/^(girl|boy|smallchild|infant)-/, '$1', ['$1']],
  // Soldiers and what they carry, dig and lie behind.
  [/^(volunteer|regular|dragoon)-/, '$1', ['$1']],
  [/^skirmisher-/, 'regular', ['regular']],
  // (The wounded carried, the breastwork of packs, the street barricade, the sandbags and the stacked muskets are Astra's since
  // 2026-10-03; Claude's and their rules were deleted at the merge of 2026-10-04; the wading men, `figure-wading-*`, at the merge of 2026-10-09.)
  [/^(settler-gun|sentry-bell)/, 'volunteer', ['volunteer']],
  [/^(lancer|forager)-/, 'dragoon', ['dragoon']],
  [/^cannon-/, 'cannon', ['cannon']],
  [/^ammunition-crate/, 'crate', ['crate']],
  [/^flag-come-and-take-it/, 'the Come and Take It flag', ['flag-come-and-take-it']],
  [/^gonzales-flag-work/, 'the Come and Take It flag', ['gonzales-flag-work']],
  [/^(grass-bundle-cut|army-camp-mexican|army-camp-texian)/, '$1', ['$1']],
  // Animals and vehicles.
  [/^herd-/, 'horses', ['mustang', 'horse']],
  [/^milk-cow-/, 'cow', ['cow']],
  [/^limber-mules/, 'limber', ['limber']],
  // The family's mule on its halter or saddled (Claude's, 2026-10-03) is not her Grass Fight pack mule (`mule-packed-grass-*`):
  // a prefix of plain `mule` withheld it the day hers came, and a bought mule was drawn as a horse (test:shops, 2026-10-03).
  [/^mule-/, 'mule', ['mule-idle', 'mule-walk', 'mule-saddled']],
  [/^cart-/, 'cart', ['cart-open']],
  [/^carreta-/, 'carreta', ['carreta']],
  [/^wagon-ox/, 'wagon', ['wagon-covered', 'ox-walk']],
  [/^padre-carts/, 'padre-carts', ['padre-carts']],
  // Named people and the people of Béxar. Astra's Gregorio Esparza, Castrillón and Seguín are hers whole.
  [/^(ana-esparza|maria-de-jesus|enrique-esparza|francisco-esparza|burial-party|sanchez-navarro|jw-smith|wp-smith)-/, '$1', ['$1']],
  [/^(esparza|castrillon|seguin|kimbell|martin|horton|smither|condelle|barragan|sutherland|tejano-rider)-/, '$1', ['$1']],
  [/^bexar-(man|woman|girl|boy)-/, 'bexar-$1', ['bexar-$1']],
  [/^(dancers-couple|fiddler-play|lantern-post|townsfolk-leave)/, '$1', ['$1']],
  // Houses and their pieces: hers are the house, whichever side or stage the piece is.
  [/^house-(round|hewn)-back/, 'house-$1', ['house-$1']],
  [/^house-roof-join/, 'the passage roof', ['house-passage-roof']],
  [/^house-jacal-/, 'jacal', ['house-jacal']],
  [/^house-chimney-double/, 'stick chimney', ['house-chimney-stick']],
  [/^house-shed-frame/, 'shed room', ['house-shed-room']],
  [/^house-(floor|loft)$/, 'floor and loft', ['house-floor-loft']],
  [/^house-(porch|shed-room|passage-floor|passage-roof)-end$/, 'house-$1', ['house-$1']],
  [/^interior-saddlebag/, 'interior', ['interior-dog-run']],
  [/^window-lit-/, 'lit window', ['window-lit']],
  // Places and buildings she has not drawn.
  [/^(bexar-san-fernando|bexar-governors-palace|san-fernando-tower|mission-concepcion|fort-velasco|sawmill-steam|stone-house-nacogdoches|plantation-sugar|blockhouse-village|townsite-bay|tavern-house)/, '$1', ['$1']],
  // Things about the house and yard.
  [/^home-(hoe|felling-axe|broadaxe|froe|auger)$/, 'home-$1', ['home-$1']],
  [/^washtub/, 'washtub', ['washtub']],
  [/^woodpile-frontier/, 'firewood', ['alamo-firewood']],
  [/^wood-pile-/, 'logs', ['log-fallen']],
  [/^hens-pecking/, 'hens', ['chicken']],
  [/^fx-/, 'work effects', ['fx']],
  // The land: a tree in the wind is her tree; a pine is her pine and a cedar elm her elm; a stump her stump.
  [/^(.+)-wind$/, '$1', ['$1']],
  [/^pine-shortleaf-/, 'pine', ['pine-loblolly', 'pine-longleaf']],
  [/^cedar-elm-/, 'elm', ['elm']],
  [/^(anacua|ebony|tupelo|willow)-/, '$1', ['$1']],
  [/^stump-/, 'stump', ['stump']],
  [/^live-oak-mott/, 'live-oak', ['live-oak']],
  [/^tree-fall/, 'a tree falling', ['tree-fall']], // her own post-oak-log painting, turned
  [/^(farm|town)-smoke-rise/, 'smoke', ['smoke', 'chimney-smoke']],
  [/^campfire-night/, 'campfire', ['campfire']],
  [/^marsh-edge/, 'marsh', ['marsh-cordgrass']],
  [/^(riverbank-cut|river-bend|creek-bed-dry|creek-ford|fog-bank|night-grade|moonlight-grade|dawn-grade)/, '$1', ['$1']],
];
const fill = (template, match) => template.replace(/\$(\d)/g, (_, n) => match[Number(n)] ?? '');

/** The subject of a Claude frame and the Astra name prefixes that show she has drawn it; null when no rule knows it. */
export function standinSubject(name) {
  for (const [pattern, subject, astra] of RULES) {
    const match = pattern.exec(name);
    if (match) return { subject: fill(subject, match), astra: astra.map(prefix => fill(prefix, match)) };
  }
  return null;
}

/** Every name and every `-`-bounded start of one: `rust-work-1` gives `rust`, `rust-work`, `rust-work-1`. */
export function namePrefixes(names) {
  const out = new Set();
  for (const name of names) {
    let at = name.indexOf('-');
    while (at > 0) { out.add(name.slice(0, at)); at = name.indexOf('-', at + 1); }
    out.add(name);
  }
  return out;
}

/**
 * Why a Claude frame must not be drawn, given the prefixes of Astra's frame names (`namePrefixes`): the subject she has drawn,
 * or `'no subject'` when no rule knows the frame; null when it may be drawn.
 */
export function standinWithheld(name, astraPrefixes) {
  const found = standinSubject(name);
  if (!found) return 'no subject';
  return found.astra.some(prefix => astraPrefixes.has(prefix)) ? found.subject : null;
}
