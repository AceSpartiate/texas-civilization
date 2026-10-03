/**
 * **Join words** (owner, 2026-10-03; docs/HOST_PAGE.md §2.17). Asked *"is it possible to use a word or phrase instead like a
 * webpage?"*, the owner chose a free page, **playtexas.github.io**, and **"Fewest words, no server"**; then, the same day,
 * **"3 words, ensure they're short, easy to type, and related to the texas revolution"**, and the port left at 1835. Three words
 * carry, with no lookup service, only the Host laptop's private address on the classroom network. A student goes to
 * playtexas.github.io, types them, and is sent to `http://<laptop>:1835/` - the bare address, which asks for the class code as it
 * always has (§2.14). The class code is not in the words: it is still checked, typed from the Host screen.
 *
 * One file, used two ways and therefore kept free of anything but plain JavaScript and of any look: the class server imports it to
 * make the words for the Host's page, the launcher and its console line (server/app.mjs `joinView`, server/main.mjs), and the static
 * page at site/playtexas/ carries a byte-for-byte copy of it (tests/join-words.test.mjs holds the two identical;
 * scripts/playtexas-site.mjs makes the copy). What the page decodes is therefore exactly what the game encoded.
 *
 * **The scheme: always three words** from a list of **1,024** (10 bits each, 2^30 together), for every private range. Three words
 * of 1,024 is the smallest list that carries a 10.x address (24 bits) with a check worth having; a longer list would check better
 * but there are not 2,048 short, easy words of 1830s Texas, and a shorter one could not carry 10.x in three. The 2^30 values are
 * shared out so that every value is some address's - each address owns a block, and exactly one value in its block is right:
 *   10.a.b.c          2^24 addresses, blocks of 56   (values 0 to 939,524,095)
 *   172.16-31.a.b     2^20 addresses, blocks of 64   (the next 67,108,864)
 *   192.168.a.b       2^16 addresses, blocks of 1024 (the last 67,108,864)
 * The right value in a block is a hash of the range and the address (`checkOf`). A word mistyped as another word on the list, two
 * words swapped, or a word dropped or added lands in some block, and is refused unless it lands on that block's one right value:
 * about 1 time in 56 when it lands among the 10.x blocks, 1 in 64 among 172.16-31's and 1 in 1,024 among 192.168's (measured in the
 * test). A word not on the list is refused before that, with the nearest words offered; no two words on the list are one letter (or
 * one swap of neighbouring letters) apart, so most single slips of the fingers are a word not on the list; and only the first four
 * letters are read (every word starts differently), so a misspelling after them is harmless. `ceiling:` a mistyping that slips
 * through sends the student to another private address, where nothing answers (the page's *Didn't work?* says check the words) or
 * another class asks for a class code the student does not have.
 *
 * **Another port** (only a developer's `PORT`) takes **five words**: the address and the port in 2^50 values, blocks of 960. Four
 * words are never made, and refused.
 *
 * Order matters (the words are shown numbered); case, spacing, hyphens and commas do not. The words do not change with New Class:
 * they change only when the laptop's address does.
 *
 * Only the three private ranges can be encoded, on purpose: the page can never send a student to an address on the public
 * Internet, whatever is typed. `ceiling:` a district that numbers its classrooms with public addresses gets no words, and its
 * students type the address as before.
 *
 * `ceiling:` the list, the blocks and the hash are frozen (the list's SHA-256 and known words for known addresses are pinned in
 * tests/join-words.test.mjs). The page at playtexas.github.io and every copy of the game in every classroom must agree, and the page
 * is updated separately from the games, so a change would send old games' students to wrong addresses. A new scheme needs a version
 * the page can tell apart, never an edit. (The two- and three-word scheme of earlier on 2026-10-03 was never released.)
 *
 * The word list was written for this game (2026-10-03, our own work, in the public domain): words of 1830s Texas and the Texas
 * Revolution first - its places and rivers, easy first and last names of the people of the time, Texian and Tejano, the things of a
 * frontier farm, a ranch, a wagon and a muster, its animals, trees and weather - then plain everyday words that would not be out of
 * place in 1835. 3 to 7 letters (Gonzales, Victoria and Columbia are 8), no two with the same first four letters, no two that sound
 * alike or are one letter apart, nothing of now, nothing grim, cruel or mocking, no faith or people named as a joke, no slur, no
 * numbers, days or months.
 */

export const JOIN_SITE = 'playtexas.github.io';
/** The class server's own port (server/main.mjs `PORT`, 1835 unless a developer sets it; owner, 2026-10-03: keep 1835). */
export const DEFAULT_PORT = 1835;

// prettier-ignore
const LIST = `
abigail accent acre actor address admire adobe adopt advice agave agent aim alamo alarm alcalde alfalfa alive almanac among
amos anchor andrea answer ant anthem antonio anvil apart apple apron arbor aroma asa aspen aster austin author autumn avoid
axis axle baby bacon badge bags baker bale bandana banjo bank banner barley barn barrel barter basin basket bastrop batch
bayou beans bear bedrock bee beehive beetle begin bellows bench benefit betsy birch biscuit bison bit blanket blaze blink
bluejay bluff blur board boatman bobble bobcat boil bolivar bonfire bonnet boots border bottle boulder bounce bowie bramble
branch brave brazos bread breeze brick bridle bright brim bronze broom broth brown buck buffalo bugle build bull bundle
burlap burnet burro butter buy cabbage cabin cactus caleb calf calico camp candle cannon canoe canteen canvas cape captain
careful cargo carlos carmen carrot cart cask catfish cattle cedar cellar chair chalk charter cheese cherry chest chick child
chimney chisel chowder churn cibolo cinder circle cistern city clapper clara clay clean clerk cliff climb clip clock cloth
cloud clover coat cobbler coffee coleto collie colony columbia common compass comrade concho cookie copano copper corn
corral cottage couch county courier cousin cow cowbell cowhide coyote crab cradle crane crawdad cream creek cricket crimson
crinkle crop cross cuff cup curious cypress daisy dance daniel daring david davy dawn deck deer depend desert detail dew
diary diego dinner dipper direct dirt ditch doctor dogwood dollar donkey door dough dove drake dress dribble dried drift
drill drive drizzle drought drover drum dry dugout dune dust eager eagle early easy eaves edge edible edward egg egret elder
elena elias eliza elm ember emily endless enjoy equal erasmo errand esparza evening every express ezra fact fair falcon
falls family farmer feast felipe fence fennel fern ferry fetch fiddle field fiesta fife figure filly final finch finish
firefly first fish flag flame flicker flint floor foal focus fodder foggy follow ford forest forge fox freedom freight fresh
friend frio frog frost frozen fur furrow future gallon gander gar garden garlic gate gather gator gem gentle george gesture
gingham glade glimmer glow gold goliad gonzales goose gopher gourd grain grande grape grass gravel greet griddle grist grove
guard guest guide guitar gully halter hammer hannah hardy hare harness harris harvest hat haul hawk hayloft hazel head
hearth heavy heifer hello hemp hen henry herald herb herder heron hickory hide hilltop history hog hoist hollis hominy honey
hoof hope hornet horse houston hum humble humming hunt hurdle hurry husband ignacio ignite imagine impact indigo ines infant
ink inkwell inlet invent invite iris iron isaac island ivory ivy jacinto jacket jacob james jane jawbone jay jelly jewel
john josefa journal juan jug juniper karnes keen keeper kernel kettle key kid kiln kindle kinship kitchen kite kitten knee
knit knoll labor ladle ladybug lagoon lake lamar lamb landing lantern larder large lariat lark lasso laugh laurel lavaca
layer leaf league learn leash leather ledger leek legend lentil lesson letter levee liberty lily lime limit linen liquid
listen little lively lizard locust loft lone loom lorenzo lowland loyal lucy luisa lumber lydia lynx magnet major mallard
manage manger mansion manuel map maple marble maria market marsh martin mary mason mast meadow meal measure medina medley
melon mend mesa message meteor mexico midway mighty miguel milam militia mill minnow mint minute mirror mission modest
molten moment monarch moon morning mortar moss moth mound mouse mud muddy muffin mulch mule murmur mush musket mussel
mustang mutton nancy napkin navarro navidad nearby neches nectar needle nephew never newt nibble niece noah noble norther
notch nugget nursery oak oaken oatmeal oats octave onion onward orchard oriole osprey otter outdoor outpost oval owl owner
oxcart oxen oyster pablo paddock pan pancake panther paper parade parcel parent parsley partner pasture patient patsy peach
peas pebble pecan peddler pedro pelican pelt penny pepper peso pewter piano pickle picnic picture pier pig piglet pigtail
pile pilot pinto pioneer pitcher placido plain plank plaza plenty pliers plucky plum pocket point polly pony poplar poppy
porch pork possum post potato pour powder prairie precise present printer prism private prize promise proper protect proud
pudding pulley pumpkin pupil purse quail quarry queen quick quilt rabbit raccoon rachel radish rafael raft rail rainy raise
rally ramon rancho range rapids rascal ration raven rawhide ready reaper record redbud reed refugio region reins repair
reply ribbon rice ridge rinse ripple rival river roast robin rock romp rooster root rose rowboat rubber ruby rudder ruffle
ruiz rural rusk russet rusty ruth rye sabine saddle sage salado salmon salt sam samuel sand sapling sarah sash satin sawdust
sawmill scarf school scout scribe scrub sculpt seagull season secret seguin sentry serape settler shack shadow shanty shawl
shed sheep shelf shield shimmer shingle shirt shoal shoes shop shore shovel shower shrimp sieve sign silas silk silver
simple singer sister sketch skiff skillet skip skunk slate sleet slender slide slipper sloop slope smile smithy smoke smooth
snake snappy snow snuggle soap sod song sorghum sort source south spade spark speak speech spell spider spindle split sponge
spoon spot spring sprout spur squash stall star steady steer stephen stew stirrup stitch stone stool stopper storm stream
strong stump sturdy success suet sugar sumac summer sun sundown sunlit sunny sunrise sunset surf survey susanna swallow
swamp swan swift swim syrup tabby table tack tadpole tailor tallow tame target tasty tawny tea teacher teapot tejano tempo
tent terrier tether texas texian texture thatch thaw thicket thimble thistle thomas thorn thread thrush thunder thyme tidy
timber tin tinsel tiptoe toad today toddler tomato tongue tooth towel town trade travis tray treat trinity trout true trunk
trust tuba tugboat tunnel turkey turnip turtle tutor uncle unfold unique unity unpack unravel uphill upkeep upland uplift
upper upriver urchin useful valley valve vanilla vapor vaquero vase vault velasco venison vest victoria village vine vintage
violet visit visor vista vocal vole voyage waffle wagon walk walnut wares warm washtub wasp water wave wax weaver wedding
weigh welcome well wet whale wharf wheat wheel whittle wick wildcat wiley willow wind winter wisdom wise wolf wool world
worthy wren wriggle write yams yard yes yoke yonder young yucca zavala zigzag
`;
export const WORDS = Object.freeze(LIST.trim().split(/\s+/));
const SIZE = WORDS.length; // 1024

// The word a typed token is: its first four letters (or all of it, if shorter) name exactly one word on the list.
const KEYS = new Map(WORDS.map((word, index) => [word.slice(0, 4), index]));
const key = token => String(token).toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);

/** The index on the list of a typed word, or -1. A key shorter than four letters is a whole three-letter word: "ca" is nothing. */
export function wordIndex(token) {
  return KEYS.get(key(token)) ?? -1;
}

/** Up to `count` words on the list nearest a word that is not on it, nearest first. */
export function suggestWords(token, count = 3) {
  const typed = String(token).toLowerCase().replace(/[^a-z]/g, '');
  if (!typed) return [];
  const scored = [];
  for (const word of WORDS) {
    const distance = editDistance(typed, word);
    if (distance <= Math.max(1, Math.floor(typed.length / 3))) scored.push([distance, word]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1])).slice(0, count).map(entry => entry[1]);
}

/** The words that start with what has been typed so far, for the page's suggestions. */
export function wordsStartingWith(prefix, count = 6) {
  const typed = String(prefix).toLowerCase().replace(/[^a-z]/g, '');
  if (!typed) return [];
  return WORDS.filter(word => word.startsWith(typed) || (typed.length > 4 && word.startsWith(typed.slice(0, 4)))).slice(0, count);
}

function editDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = row;
  }
  return previous[b.length];
}

/** Whether an IPv4 address is on one of the three private ranges join words can carry. */
export function isClassroomAddress(address) {
  const octets = readAddress(address);
  return Boolean(octets && networkOf(octets));
}

function readAddress(address) {
  const parts = String(address ?? '').trim().split('.');
  if (parts.length !== 4 || !parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return null;
  return parts.map(Number);
}
function networkOf([a, b]) {
  if (a === 192 && b === 168) return 'home';
  if (a === 172 && b >= 16 && b <= 31) return 'middle';
  if (a === 10) return 'wide';
  return null;
}

// The blocks of the three-word form, in value order: [network, first value, addresses, block size].
const RANGES = [['wide', 0, 2 ** 24, 56], ['middle', 2 ** 24 * 56, 2 ** 20, 64], ['home', 2 ** 24 * 56 + 2 ** 20 * 64, 2 ** 16, 1024]];
const WITH_PORT = 960; // the five-word form's block size: floor(2^50 / ((2^24 + 2^20 + 2^16) * 65536))
const ALL = 2 ** 24 + 2 ** 20 + 2 ** 16;

// The one right value in a block: FNV-1a over the form and the address's number, mixed, cut to the block.
function checkOf(form, number, size) {
  let hash = 0x811c9dc5 ^ form;
  for (let rest = number, i = 0; i < 7; i++, rest = Math.floor(rest / 256)) hash = Math.imul(hash ^ (rest % 256), 0x01000193);
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x45d9f3b); hash ^= hash >>> 16; hash = Math.imul(hash, 0x45d9f3b); hash ^= hash >>> 16;
  return (hash >>> 0) % size;
}
// An address's number within its range, and back.
function numberOf(network, [, b, c, d]) {
  if (network === 'wide') return (b * 256 + c) * 256 + d;
  if (network === 'middle') return ((b - 16) * 256 + c) * 256 + d;
  return c * 256 + d;
}
function addressOf(network, number) {
  const d = number % 256, c = Math.floor(number / 256) % 256, b = Math.floor(number / 65536);
  return network === 'wide' ? [10, b, c, d] : network === 'middle' ? [172, 16 + b, c, d] : [192, 168, c, d];
}
const toWords = (value, count) => {
  const words = [];
  for (let i = 0; i < count; i++) { words.unshift(WORDS[value % SIZE]); value = Math.floor(value / SIZE); }
  return words;
};

/**
 * The words for a laptop's address and port: three, or five for a port other than 1835. Null when they cannot be carried - an
 * address that is not private, or a port that is not a port. (A class code given is ignored: the words carry the address only.)
 */
export function encodeJoin({ address, port = DEFAULT_PORT }) {
  const octets = readAddress(address), network = octets && networkOf(octets), portNumber = Number(port);
  if (!network || !Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) return null;
  const [, start, , size] = RANGES.find(range => range[0] === network), number = numberOf(network, octets);
  if (portNumber === DEFAULT_PORT) return toWords(start + number * size + checkOf(3, start + number, size), 3);
  // Five words: every private address, in the order of the ranges, times every port.
  const global = RANGES.slice(0, RANGES.findIndex(range => range[0] === network)).reduce((sum, range) => sum + range[2], 0) + number;
  const combined = global * 65536 + portNumber;
  return toWords(combined * WITH_PORT + checkOf(5, combined, WITH_PORT), 5);
}

/** The tokens of what a student typed: letters only, split on anything else (spaces, hyphens, commas, a `#`). */
export const joinTokens = text => String(text ?? '').toLowerCase().split(/[^a-z]+/).filter(Boolean);

/**
 * What typed words mean. `{ ok: true, address, port, url, words }`, or `{ ok: false, reason, ... }` where reason is `empty`,
 * `unknown` (with `place`, 1-based, the `word` and `suggestions`), `short` (fewer than three), `count` (four), `long` (more than
 * five), or `check` (all on the list, but not words the game made: one mistyped or out of order).
 */
export function decodeJoin(text) {
  const tokens = joinTokens(text);
  if (!tokens.length) return { ok: false, reason: 'empty' };
  const indexes = [];
  for (const [place, token] of tokens.entries()) {
    const index = wordIndex(token);
    if (index < 0) return { ok: false, reason: 'unknown', place: place + 1, word: token, suggestions: suggestWords(token) };
    indexes.push(index);
  }
  const count = indexes.length;
  if (count < 3) return { ok: false, reason: 'short', count };
  if (count === 4) return { ok: false, reason: 'count', count };
  if (count > 5) return { ok: false, reason: 'long', count };
  const value = indexes.reduce((sum, index) => sum * SIZE + index, 0);
  let octets, port = DEFAULT_PORT;
  if (count === 3) {
    const [network, start, , size] = RANGES.findLast(range => value >= range[1]);
    const number = Math.floor((value - start) / size);
    if ((value - start) % size !== checkOf(3, start + number, size)) return { ok: false, reason: 'check', count };
    octets = addressOf(network, number);
  } else {
    const combined = Math.floor(value / WITH_PORT);
    if (value % WITH_PORT !== checkOf(5, combined, WITH_PORT) || combined >= ALL * 65536) return { ok: false, reason: 'check', count };
    port = combined % 65536;
    let global = Math.floor(combined / 65536);
    const [network] = RANGES.find(range => (global < range[2] ? true : ((global -= range[2]), false)));
    octets = addressOf(network, global);
    if (port === DEFAULT_PORT || port < 1) return { ok: false, reason: 'check', count };
  }
  const address = octets.join('.');
  return { ok: true, address, port, url: joinAddress({ address, port }), words: indexes.map(index => WORDS[index]) };
}

/** Where a class's words lead: the bare address on the classroom network, which asks for the class code (docs/HOST_PAGE.md §2.14). */
export const joinAddress = ({ address, port = DEFAULT_PORT }) => `http://${address}:${port}/`;

/** The page's link that goes straight on to the class: `https://playtexas.github.io/#cannon-river-oak`. */
export const joinLink = words => `https://${JOIN_SITE}/#${words.join('-')}`;
