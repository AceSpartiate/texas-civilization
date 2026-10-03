/**
 * **Join words** (owner, 2026-10-03; docs/HOST_PAGE.md §2.17). Asked *"is it possible to use a word or phrase instead like a
 * webpage?"*, then *"could we make the join words be a join word? singular?"*, and told that one word cannot carry an address with
 * no server, the owner chose **"Fewest words, no server"**: two or three short words that carry, with no lookup service, only the
 * Host laptop's private address on the classroom network (and its port, when it is not the usual one). A student goes to
 * **playtexas.github.io**, types the words, and is sent to `http://<laptop>:<port>/` - the bare address, which asks for the class
 * code as it always has (§2.14). The class code is not in the words: it is still checked, typed from the Host screen.
 *
 * One file, used two ways and therefore kept free of anything but plain JavaScript and of any look: the class server imports it to
 * make the words for the Host's page, the launcher and its console line (server/app.mjs `joinView`, server/main.mjs), and the static
 * page at site/playtexas/ carries a byte-for-byte copy of it (tests/join-words.test.mjs holds the two identical;
 * scripts/playtexas-site.mjs makes the copy). What the page decodes is therefore exactly what the game encoded.
 *
 * The scheme. Each word is 11 bits (a list of 2048); **the number of words says the form**, and every bit not carrying the address
 * is a check:
 *   2 words  192.168.a.b, port 1835                     16 bits of address,  6 check bits
 *   3 words  0  then 10.a.b.c, port 1835                 25 bits,             8 check bits
 *            10 then 172.(16-31).a.b, port 1835          22 bits,            11 check bits
 *            11 never made: refused, so it checks too
 *   4+ words any other port: 0 192.168 / 10 172.16-31 / 11 10.x, the address, the port (16 bits), and at least 6 check bits -
 *            4 words, or 5 for a 10.x laptop on another port.
 * The check bits are a hash of the form and the address (`checkBits`): a word mistyped as another word on the list, two words
 * swapped, or a word too many or too few, lands on an address the words did not make, and is refused - except 1 time in 64 on the
 * two-word form (1 in 256 on 10.x, 1 in 2048 on 172.16-31). A word not on the list is refused before that, with the nearest words
 * offered; only the first four letters of each word are read (every word on the list starts differently), so a misspelling after
 * the fourth letter is harmless. `ceiling:` the two-word form's 6 check bits are what two words leave; a mistyping that slips
 * through sends the student to another address on the same network, where nothing answers (the page's *Didn't work?* says check the
 * words) or another class's server asks for a class code the student does not have. A third word for 192.168 is the way out if
 * that is ever seen in a classroom.
 *
 * Order matters (the words are shown numbered); case, spacing, hyphens and commas do not. The words do not change with New Class:
 * they change only when the laptop's address does.
 *
 * Only the three private ranges can be encoded, on purpose: the page can never send a student to an address on the public
 * Internet, whatever is typed. `ceiling:` a district that numbers its classrooms with public addresses gets no words, and its
 * students type the address as before; another form is the way out if one ever does.
 *
 * `ceiling:` the list, the forms and the hash are frozen (the list's SHA-256 and known words for known addresses are pinned in
 * tests/join-words.test.mjs). The page at playtexas.github.io and every copy of the game in every classroom must agree, and the
 * page is updated separately from the games, so a change would send old games' students to wrong addresses. A new scheme needs a
 * version the page can tell apart, never an edit.
 *
 * The word list was written for this game (2026-10-03) and is in the public domain: common, concrete, easy-to-spell words for
 * middle schoolers, 3 to 8 letters, no two with the same first four letters, no two that sound alike, no days, months or numbers,
 * and none about harm, drink, religion or bodies, nor any that invites a joke.
 */

export const JOIN_SITE = 'playtexas.github.io';
/** The class server's own port (server/main.mjs `PORT`, 1835 unless a developer sets it). */
export const DEFAULT_PORT = 1835;

// prettier-ignore
const LIST = `
able accent acorn acre acrobat active actor adapt address admire adobe adopt adult advice agave agent ahead aim air airport
alarm album alert alien alive alley allow almond alpaca alto amaze amber among amulet anchor ancient angle animal anise
ankle annual answer antelope anthem antler anvil apart appear apple apricot apron aqua arbor arcade arch arena arm armchair
aroma arrive arrow artist ash ask asleep aspen atlas atom attend attic auburn audience aunt author autumn avenue aviator
avocado avoid awake award axis axle babble baby back bacon badge bag bagel bake balance balcony ball bamboo banana band
banister banjo bank banner banquet barber barge barley barn baron barrel baseball basin basket bat batch bath baton battery
bay bayou beach bead beagle beak beam bean bear bed bedrock bedtime bee beef beehive beetle begin believe bell belong belt
bench benefit berry beyond bicycle big bike binder bingo biplane birch bird birthday biscuit bison blanket blaze blender
blimp blink blizzard block blond bloom blossom blouse blue bluff blur blush board boat bobble bobcat bobsled body boil bold
bolt bone bonfire bonnet book boost boot border boss bottle boulder bounce bow bowl bowtie box boxcar boy bracelet brain
bramble branch brave bread breeze brick bridge bright bring brisk broad broccoli bronze broom brother brownie brunch brush
bubble bucket bud buddy buffalo bug buggy bugle build bulb bulldog bumble bumper bundle bungalow bunny burger burrow bus
busy butter buzz cabana cabbage cabin cable caboose cactus cadet cafe cage cake calendar calf calico call calm camel camp
canal candle cane cannon canoe canteen canvas canyon cap cape capital captain car caramel card careful cargo caribou
carnival carousel carpet carrot cart carve case cashew castle cat catch catfish cattle caution cave cedar celery cello
cement century ceramic cereal chair chalk champ chance chapter charm chatter check cheddar cheek chef chemist cherry chess
chick child chimney chin chip chisel chive chorus chowder chuckle churn cinder cinema circle citrus city civic clam clap
clarinet class claw clay clean clerk clever cliff climb clip cloak clock closet cloth cloud clover clown club coach coast
coat cobalt cobbler cobweb cocoa code coffee coin cold collar colony colt column comb comet comfort comic common compass
concert condor cone confetti contest cook cool copilot copper copy coral cord cork corn corral costume cottage couch count
courage cousin cover cow cowboy cowgirl coyote crab cracker cradle craft crane crate crayon cream creek crescent crew crib
cricket crimson crinkle crisp crocus crop croquet crow cruise crumb crust crystal cub cubby cube cucumber cuddle culture cup
cupboard cupcake curb curious curl current curtain curve cushion custom cutout cycle cypress dabble daffodil dairy daisy
dance dapple daring darling darts dash date dawn day daybreak dazzle decade decide deck deep deer degree delight delta den
denim depend desert design desk detail detour dew dewdrop diagram dial diamond diary dice diesel dig dime dimple diner dingo
dinner dinosaur diploma dipper direct dirt discover dish disk distant diver diving dock dog doghouse doll dolphin dome
domino donkey doodle door dormouse dot double dove downhill dragon drama draw dream dress dribble drift drill drive drizzle
drop drum duck duet duffel dugout dumpling dune dusk dust eager eagle ear early earmuff earth easel east easy echo eclipse
edge edible effort egg eggplant eggshell elbow elder elegant elephant elevator elf elk elm ember emblem emerald emperor emu
enchant encore end endless energy engine engrave enjoy enough enter entire entry envelope episode equal eraser errand essay
estate etching eureka event every evolve exact example excite exhibit exit expert explore express extra eye fable fabric
face fact fairway falafel falcon fall family famous fan fancy fanfare fantasy farm fast faucet fawn feast feather feedback
feline felt fence fender fern ferry festival fiber fiction fiddle fidget field fiesta fig figure filly film fin final finch
finger finish fire first fish fist fitness fixture flag flame flannel flapjack flash flat flea fleet flicker flight flint
flipper float flock flood flora flour fluent fluffy flurry flute fly foal foam focus fog foghorn folder follow fondue food
foot forest forget fork formal fort forward fossil fountain fox foxglove foxhole frame freckle free freight fresh friend
fringe frog frolic frontier frost frozen fruit fudge fun funny fur future fuzzy gadget galaxy gale gallon galoshes game
garage garden garlic garnet gate gather gaze gear gem genius gentle gesture geyser giant gift giggle ginger giraffe girl
give gizmo glacier glad glass glide glimmer glitter globe glove glow glue gnome goal goat gobble goblet goggles gold golf
gondola good goose gopher gorilla gosling gourmet gown grab grace grain grand grape grass grateful gravel great green
griddle grill grin grip grits grizzly grocery groove grotto ground grove grow guard guava guess guide guitar gull gum gumbo
gumdrop guppy gust gymnast habit haiku hail hair half hall halo ham hamlet hammer hamster hand hangout happy hardhat harmony
harness harp harvest hat hatch haven hawk hay hayloft hayride haystack hazel head health heart heat heavy hedge height
heirloom hello helmet help hen herb hero hibiscus hiccup hickory hidden highway hike hill hint history hitch hobby hockey
hold hole home honey honk hoodie hoof hook hoop hop hopeful horizon horn horse hose hotcake hotdog hotel hour house hubcap
huddle hug hum humming hunt hurdle hurry hush husky hut hydrant ice iceberg icicle icon idea igloo ignite iguana imagine
impact inch include indigo indoor ink inkblot inkwell inlet inning insect inside instant invent invite iris iron island itch
ivory ivy jacket jade jaguar jalopy jam jamboree jar jasmine jawbone jaybird jazz jeans jelly jersey jet jetpack jetty jewel
jiggle jigsaw jingle job jockey jog jogging join joke jolly jostle journal joy jubilee juggle juice jukebox jumbo jump
jungle junior kale kangaroo karate kayak kazoo keen keeper kelp kennel kernel ketchup kettle key keyboard keyhole keystone
kick kid kind king kinship kiosk kit kitchen kite kitten kiwi knack knapsack knee knock knoll knot knuckle koala label lace
lacrosse ladder ladle lady lagoon lake lamb lamp land lane lantern lanyard lap large lariat lark lasagna laser lasso latch
later laugh launch laurel lava lavender lawn layer layout leader leaf leapfrog learn leash leather leftover legend leisure
lemon lemur length lens lentil leopard lesson letter level library lid lifeboat lift light lilac lily lime limit line lint
lion lip liquid list little lively lizard llama load loaf lobby lobster local lock locust lodge loft log logic long lookout
loom loop lotus loud lovely loyal lucky lullaby lumber lunch macaroni machine magenta magic magnet magpie mail mainland
major mall mammal manage mandolin mango manner mansion mantis map maple marathon marble marigold marker marmot marsh marvel
mascot mask match mattress maze meadow meal measure meatball mechanic medal medium medley meerkat mellow melon member memory
mentor menu mermaid mesa mesquite message meteor middle midnight midway mighty milk mill mimic mind minnow mint minute
mirror mission mitten mix mixer mixture mobile mocha model moist molasses mole molten moment monarch money monkey month moon
moose mop morning mosaic moss moth motion motor mound mouse mouth movement movie mud mudflat mudpie muffin mug mulberry
mulch mule mural murmur museum mushroom music muskrat mustard nail name napkin narrow narwhal nature nautical navigate navy
nearby neat neck nectar needle nephew nest net neutral never new newt nibble nickel night nimble noble nod noise noodle nook
noon normal north nose notch note notice novel nozzle nudge nugget nursery nutmeg oak oaken oar oasis oatmeal oats obey oboe
observe ocean ocelot octave octopus offbeat offer often oil okra olive onion onward oodles ooze opal open opera orange orbit
orca orchard order origin oriole osprey ostrich otter outback outdoor outfit outpost outside oval oven overall owl owlet
owner oxen oxygen oyster ozone pace pack paddle padlock page paint pair palace palette pallet palm palomino pamper pan
pancake panda panel panther papaya paper paprika parade parcel parent park parrot parsley party pass pasta patch path patio
pattern pause paw pawprint paycheck peach peak peanut peapod pearl pebble pecan pedal pedestal pelican pelt pen pencil
penguin penny peony people pepper perfect perhaps person pet pheasant phone photo piano pickle picnic picture pie piece pig
pigeon piglet pigpen pigtail pile pillow pilot pinball pine pink pinto pinwheel pioneer pipe pitcher pitstop pivot pizza
place plain planet plate play plaza pleasant plenty pliers plucky plug plum plush pocket poem pogo point polar pole polish
polka pompom poncho pond pony poodle pool popcorn poplar poppy popular porch porpoise port positive possum post potato
potter pouch poultry powder prairie prawn precise present pretzel prince prism private prize problem produce project promise
proper protect prune public puddle puffin pulley pulse pumpkin punch pupil puppy purple purse push puzzle pyramid quack
quail quarter queen quench quest quick quiet quilt quinoa quirk quiver quiz quokka quote rabbit raccoon race radar radio
raffle raft ragdoll railroad rain raisin rake rally ramble ramp ranch range rapid rascal ratchet rattle raven rawhide ray
reader reason rebound recess recipe record recycle red redwood reef reflect region reindeer relay remark remember remote
rental repair reply rescue resort rest return reveal ribbon rice riddle ride ridge ring rinse ripple riptide rival river
road robin robot robust rock rodeo roller romp roof room rooster root rose rosy rotate round rover row rowboat royal rubber
ruby rudder ruffle rug rugby ruler rumble rumpus run running runway rural rustic saddle safari safe sage sail salad salmon
salsa salt salute sample sand sapling sapphire sardine satchel satin sauce sausage saw sawdust sawmill scale scamper scarf
scenic school science scissors scoop scout scraps screen scribble scroll scrub scuba sculpt sea seafood seagull seahorse
seal season seat seaweed second secret seed seesaw senior sentence serene service sesame settle shack shadow shallow shampoo
shape shark shawl shed sheep shelf shepherd shield shimmer shine ship shirt shiver shoe shop shore shovel show shrimp shrub
shuttle sidewalk sign silk silly silo silver simmer simple singer sink sister sizzle skate sketch ski skiing skill skip
skirt skunk sky skyline slalom slate sled sleep slender slicker slide slipper slogan slope sloth slurp smile smoke smooth
smudge snack snail snake snappy sneaker snooze snorkel snout snow snuffle snuggle soap soccer sock soda sofa soft soil solar
solid solve song sorbet sort soup south space spaniel spark spatula special speech spell sphere spice spider spill spinach
splash splinter sponge spoon sport spot spring sprout spruce spur spyglass square squirrel stable stack stadium stage stair
stallion stamp stapler star statue steam steer stem stencil step stew stick stingray stirrup stitch stockade stomp stone
stool stopper storm stove straw stream string strong student sturdy success sudden sugar suit summer sun sunbeam sundial
sunlit sunny sunrise sunset super supper surf surprise swagger swallow swamp swan sweater sweet swift swim swing switch
swizzle sycamore symbol symphony syrup tabby table tackle taco tadpole taffy tail talent talon tame tan tango tank tape
target tassel tasty taxi tea teacher tealight team teapot teaspoon teddy tempo tender tennis tent terrace tether texture
thankful thatch thermal thick thimble think thistle thorn thread thrill throw thumb thunder ticket tidbit tidepool tidy
tiger timber time tinker tinsel tiny tiptoe toad toast today toddler toe toffee toggle tomato tomorrow tongue tonic tool
tooth top topaz topknot topsoil torch tornado tortoise toss totem toucan tourist towel town toy track trail tram trapeze
travel tray treat tree triangle trick trip trivia trolley trombone trophy trout trowel truck truffle trumpet trunk trusty
tuba tugboat tulip tumble tuna tundra tunnel turkey turnip turtle tusk tussle tutor tutu tuxedo twig twilight twin twirl
ukulele umbrella uncle under unfold unicorn uniform unique universe unpack unravel until unusual unwind upbeat upkeep uplift
upper upright upstream uptown urban urchin useful usual vacation vacuum valley valve van vanilla vapor varnish vase vault
velvet vendor verse vessel vest veteran victory video village vine vintage violet visit visor vista vital vivid vocal voice
volcano vortex vote voyage waddle wafer waffle wagon waist wait walk wall walnut walrus waltz wand warbler wardrobe warm
wash wasp watch water wave wax wayside wealth weather web wedding week welcome well western wetland whale wheat wheel
whistle wick wide widget wiggle wildcat willow wind wing wink winter wire wisdom wish witness wizard wobble wolf wombat
wonder wood wool word work world worm worthy wreath wren wriggle wrist write yak yard yarn yawn year yelp yes yeti yippee
yodel yoga yolk yonder young yucca yummy zap zebra zeppelin zest zigzag zinc zipper zone zoo zucchini
`;
export const WORDS = Object.freeze(LIST.trim().split(/\s+/));

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

// The check: FNV-1a over the word count and the address bits, mixed, and cut to the bits the words have left.
function checkBits(count, bits, width) {
  let hash = 0x811c9dc5 ^ count;
  for (const bit of bits) hash = Math.imul(hash ^ (bit + 0x5a), 0x01000193);
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x45d9f3b); hash ^= hash >>> 16; hash = Math.imul(hash, 0x45d9f3b); hash ^= hash >>> 16;
  const out = [];
  for (let bit = width - 1; bit >= 0; bit--) out.push(bit < 32 ? (hash >>> bit) & 1 : 0);
  return out;
}

// The address (and port) as the bits a form carries, and how many words that takes.
function addressBits(network, octets, port) {
  const bits = [];
  const put = (value, width) => { for (let bit = width - 1; bit >= 0; bit--) bits.push(Math.floor(value / 2 ** bit) % 2); };
  if (port === DEFAULT_PORT) {
    if (network === 'home') { put(octets[2], 8); put(octets[3], 8); return { bits, count: 2 }; }
    if (network === 'wide') { put(0, 1); put(octets[1], 8); put(octets[2], 8); put(octets[3], 8); return { bits, count: 3 }; }
    put(0b10, 2); put(octets[1] - 16, 4); put(octets[2], 8); put(octets[3], 8); return { bits, count: 3 };
  }
  if (network === 'home') { put(0, 1); put(octets[2], 8); put(octets[3], 8); }
  else if (network === 'middle') { put(0b10, 2); put(octets[1] - 16, 4); put(octets[2], 8); put(octets[3], 8); }
  else { put(0b11, 2); put(octets[1], 8); put(octets[2], 8); put(octets[3], 8); }
  put(port, 16);
  return { bits, count: Math.ceil((bits.length + 6) / 11) };
}

/**
 * The words for a laptop's address and port. Null when they cannot be carried - an address that is not private, or a port that is
 * not a port. (A class code given is ignored: since 2026-10-03 the words carry the address only.)
 */
export function encodeJoin({ address, port = DEFAULT_PORT }) {
  const octets = readAddress(address), network = octets && networkOf(octets), portNumber = Number(port);
  if (!network || !Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) return null;
  const { bits, count } = addressBits(network, octets, portNumber);
  const all = [...bits, ...checkBits(count, bits, count * 11 - bits.length)];
  const words = [];
  for (let start = 0; start < all.length; start += 11) words.push(WORDS[all.slice(start, start + 11).reduce((value, bit) => value * 2 + bit, 0)]);
  return words;
}

/** The tokens of what a student typed: letters only, split on anything else (spaces, hyphens, commas, a `#`). */
export const joinTokens = text => String(text ?? '').toLowerCase().split(/[^a-z]+/).filter(Boolean);

/**
 * What typed words mean. `{ ok: true, address, port, url, words }`, or `{ ok: false, reason, ... }` where reason is `empty`,
 * `unknown` (with `place`, 1-based, the `word` and `suggestions`), `short` (one word), `long` (more than five), or `check` (all on
 * the list, but not words the game made: one mistyped or out of order, or one too many or too few).
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
  if (indexes.length < 2) return { ok: false, reason: 'short', count: indexes.length };
  if (indexes.length > 5) return { ok: false, reason: 'long', count: indexes.length };
  const bits = [];
  for (const word of indexes) for (let bit = 10; bit >= 0; bit--) bits.push((word >> bit) & 1);
  let at = 0;
  const take = width => { let value = 0; for (let i = 0; i < width; i++) value = value * 2 + bits[at++]; return value; };
  const count = indexes.length;
  let octets, port = DEFAULT_PORT;
  if (count === 2) octets = [192, 168, take(8), take(8)];
  else if (count === 3) {
    if (take(1) === 0) octets = [10, take(8), take(8), take(8)];
    else if (take(1) === 0) octets = [172, 16 + take(4), take(8), take(8)];
    else return { ok: false, reason: 'check', count };
  } else {
    if (take(1) === 0) octets = [192, 168, take(8), take(8)];
    else if (take(1) === 0) octets = [172, 16 + take(4), take(8), take(8)];
    else octets = [10, take(8), take(8), take(8)];
    port = take(16);
    if (port === DEFAULT_PORT || port < 1) return { ok: false, reason: 'check', count };
  }
  const address = octets.join('.');
  // The words this address makes, made again: only the very same words are these words (the right form, the right length, the check).
  const again = encodeJoin({ address, port });
  if (!again || again.length !== count || again.some((word, place) => word !== WORDS[indexes[place]])) return { ok: false, reason: 'check', count };
  return { ok: true, address, port, url: joinAddress({ address, port }), words: again };
}

/** Where a class's words lead: the bare address on the classroom network, which asks for the class code (docs/HOST_PAGE.md §2.14). */
export const joinAddress = ({ address, port = DEFAULT_PORT }) => `http://${address}:${port}/`;

/** The page's link that goes straight on to the class: `https://playtexas.github.io/#ahead-oar`. */
export const joinLink = words => `https://${JOIN_SITE}/#${words.join('-')}`;
