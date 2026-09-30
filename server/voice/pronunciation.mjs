// How the read-aloud voice says the game's Spanish and period names (owner, 2026-09-30, D15; docs/READ_ALOUD.md §3).
//
// Kokoro turns English text into sounds through espeak-ng, which reads every name as if it were English: Seguín comes out
// "SEG-win", Béxar "BAKE-sar", Jesús "JEZ-us", and Inés "in-EE-a-cutes" (the accent spelled out). Its own lexicon is not
// a way in - in this build English goes straight to espeak-ng (docs/READ_ALOUD.md research §4) - so the game respells.
// A respelling is English letters that espeak-ng turns into the sounds wanted; every one here was checked by printing the
// phonemes espeak-ng gives it (docs/evidence/read-aloud/pronunciation.json, scripts/voice-probe.py), not by ear.
//
// The rule the table follows (owner may overrule any row; HISTORY.md outranks it for a place):
//   - **A person's name is said in the language of the person.** Tejano and Mexican people - Seguín, Santa Anna, Castañeda,
//     every name in the Tejano pools, the town keepers - in Spanish, as near as English sounds reach.
//   - **A place is said the way Texas says it.** Béxar is BAY-har (both the Spanish and the old Texan way); Gonzales,
//     Guadalupe, San Jacinto, Goliad and Nacogdoches are said the way a Texas classroom says them, which espeak-ng already
//     does, so they are listed as read right; Refugio is the town's own reh-FURY-oh; Lavaca, Nueces, Anahuac, Coleto,
//     Laredo, Medina and the rest are respelled to the Texan way.
//   - **A historical English name is said as its bearer said it**: Bowie is BOO-ee, "Deaf" Smith is DEEF, Milam MY-lum.
//
// Applied only to the words sent to the voice (`respell`), never to anything shown. The text a student reads is the
// game's spelling; the key a line is cached under is the respelled text (server/voice/text.mjs), so correcting a row here
// makes that line again rather than playing the old sound.
//
// tests/read-aloud-text.test.mjs holds this table to every person in sim/people.mjs, every name the Tejano pools and the
// old mixed pools deal, and every town keeper: each is either respelled here or listed in `AS_WRITTEN`, read right as it is.
// A name students type when they rename somebody goes to espeak-ng's own guess (ceiling: the game cannot know it in advance).

/** Written form (as the game spells it) -> what the voice is given. Longest first when applied, so "Santa Anna" beats "Ana". */
export const RESPELL = Object.freeze({
  // ------------------------------------------------------------------ people of the record
  'Seguín': 'Seh-gheen', 'Seguin': 'Seh-gheen',
  'Santa Anna': 'Sahntah Ahnah',
  'Castañeda': 'Kahss-tahn-yeh-dah',
  'Castrillón': 'Kahs-tree-yohn',
  'Músquiz': 'Moos-kees',
  'Sánchez': 'Sahn-chess',
  'Ramírez': 'Rah-mee-ress',
  'Urrea': 'Oo-reh-ah',
  'Almonte': 'Al-mohn-teh',
  'Gaona': 'Gah-oh-nah',
  'Tolsa': 'Tole-sah',
  'Barragán': 'Bah-rah-gahn',
  'Nepomuceno': 'Neh-po-moo-seh-no',
  'Zavala': 'Sah-vah-lah',
  'Fernández': 'Fair-nahn-dess',
  'López': 'Lo-pess',
  'Martín': 'Mar-teen',
  'Joaquín': 'Wah-keen',
  'Eugenio': 'Eh-oo-heh-nee-oh',
  'Salazar': 'Sah-lah-sar',
  'Plácido': 'Plah-see-doh',
  'León': 'Leh-own',
  'Peña': 'Pen-yah',
  'Jiménez': 'Hee-meh-ness',
  'Montañez': 'Mohn-tahn-yes',
  'Terán': 'Teh-rahn',
  'Pérez': 'Peh-ress',
  'Bowie': 'Boo-ee',
  'Milam': 'My-lum',
  'Mirabeau': 'Meer-uh-bo',
  'Deaf Smith': 'Deef Smith',
  '(Deaf)': '(Deef)',
  'Micajah': 'My-kay-juh',
  'Obed': 'Oh-bed',
  'Barnabas': 'Bar-nuh-bus',
  'Asa': 'Ay-suh', 'Eli': 'Ee-lie', 'Simeon': 'Sim-ee-un', 'Levi': 'Lee-vye',
  // ------------------------------------------------------------------ given names the game deals (sim/starts.mjs, sim/family.mjs)
  'José': 'Ho-say', 'Jesús': 'Heh-soos',
  'María': 'Mah-ree-ah',
  'Manuel': 'Mahn-well',
  'Ignacio': 'Eeg-nah-see-oh',
  'Nicolás': 'Nee-koh-lahs',
  'Bartolo': 'Bar-toe-lo',
  'Feliciano': 'Feh-lee-see-ah-no',
  'Ramón': 'Rah-mone',
  'Vicente': 'Vee-sen-teh',
  'Cipriano': 'See-pree-ah-no',
  'Gregorio': 'Greh-go-ree-oh',
  'Trinidad': 'Tree-nee-dahd',
  'Luis': 'Loo-ees',
  'Rafael': 'Rah-fah-el',
  'Santiago': 'Sahn-tee-ah-go',
  'Josefa': 'Ho-seh-fah',
  'Manuela': 'Mahn-weh-lah',
  'Refugia': 'Reh-foo-hee-ah',
  'Dorotea': 'Doh-roh-teh-ah',
  'Ysabel': 'Ee-sah-bel',
  'Bernarda': 'Ber-nar-dah',
  'Serafina': 'Seh-rah-fee-nah',
  'Paz': 'Pahs',
  'Gertrudis': 'Hair-troo-dees',
  'Concepción': 'Kohn-sep-see-own',
  'Rafaela': 'Rah-fah-eh-lah',
  'Francisca': 'Frahn-sees-kah',
  'Teresa': 'Teh-reh-sah',
  'Luisa': 'Loo-ee-sah',
  'Micaela': 'Mee-kah-eh-lah',
  'Encarnación': 'En-kar-nah-see-own',
  'Paulita': 'Pow-lee-tah',
  'Loreta': 'Lo-reh-tah',
  'Marcela': 'Mar-seh-lah',
  'Soledad': 'Soh-leh-dahd',
  'Tomasa': 'Toh-mah-sah',
  'Nieves': 'Nee-eh-ves',
  'Benita': 'Beh-nee-tah',
  'Luz': 'Loos',
  'Candelaria': 'Kahn-deh-lah-ree-ah',
  'Catarina': 'Kah-tah-ree-nah',
  'Inés': 'Ee-ness',
  'Pilar': 'Pee-lar',
  'Teodoro': 'Teh-oh-doh-ro',
  'Andrés': 'Ahn-dress',
  'Basilio': 'Bah-see-lee-oh',
  'Marcos': 'Mar-kose',
  'Cayetano': 'Kah-yeh-tah-no',
  'Emeterio': 'Eh-meh-teh-ree-oh',
  'Ruperto': 'Roo-pair-toe',
  'Tomás': 'Toh-mahs',
  'Julián': 'Hoo-lee-ahn',
  'Agustín': 'Ah-gooss-teen',
  'Fermín': 'Fair-meen',
  'Ambrosio': 'Ahm-bro-see-oh',
  'Alejo': 'Ah-leh-ho',
  'Elena': 'Eh-leh-nah',
  'Lucía': 'Loo-see-ah',
  // ------------------------------------------------------------------ the town keepers (sim/town.mjs, sim/shops.mjs)
  'Villegas': 'Vee-yeh-gahs',
  'Cárdenas': 'Kar-deh-nahs',
  'Rosales': 'Roh-sah-less',
  'Ibarra': 'Ee-bah-rah',
  'Arocha': 'Ah-roh-chah',
  'Cantú': 'Kahn-too',
  'Benavides': 'Beh-nah-vee-dess',
  'Treviño': 'Treh-veen-yo',
  'Huizar': 'Wee-sar',
  'Ybarbo': 'Ee-bar-bo',
  'Villarreal': 'Vee-yah-reh-ahl',
  // ------------------------------------------------------------------ places, the Texan way
  'Béxar': 'Bayhar', 'Bexar': 'Bayhar', 'Bejar': 'Bayhar',
  'Refugio': 'Reh-fury-oh',
  'Tejano': 'Teh-hah-no', 'Tejanos': 'Teh-hah-nohs', 'tejano': 'teh-hah-no', 'tejanos': 'teh-hah-nohs',
  'Anahuac': 'Ann-uh-wack',
  'Coleto': 'Koh-let-oh',
  'Laredo': 'Lah-ray-doh',
  'Lavaca': 'Luh-vack-uh',
  'Nueces': 'New-way-sis',
  'Palacios': 'Puh-lash-us',
  'Papalote': 'Pah-pah-low-tay',
  'Banquete': 'Ban-ket-ee',
  'Bahía': 'Bah-hee-ah', 'Bahia': 'Bah-hee-ah',
  'Agua Dulce': 'Ah-gwah Dool-say',
  'Medina': 'Meh-dee-nah',
  'Salado': 'Sah-lah-doh',
  'Cibolo': 'See-bo-low',
  'Río': 'Ree-oh',
  'Paso de Francia': 'Pah-so deh Frahn-see-ah',
  'Alazán': 'Ah-lah-sahn',
  // ------------------------------------------------------------------ words, and the abbreviations espeak-ng reads as "dot"
  '¡Alto!': 'Ahl-toe!', 'Alto': 'Ahl-toe',
  'Dr.': 'Doctor', 'Col.': 'Colonel', 'Capt.': 'Captain', 'Gen.': 'General', 'Lt.': 'Lieutenant', 'Maj.': 'Major',
  'Sgt.': 'Sergeant', 'Jr.': 'Junior', 'Rev.': 'Reverend', 'St.': 'Saint',
});

/**
 * Names the table was checked against and that espeak-ng already says rightly (docs/evidence/read-aloud/pronunciation.json):
 * listed so the test can tell a name that was looked at from one nobody has.
 */
export const AS_WRITTEN = Object.freeze(new Set([
  // Spanish names espeak-ng says near enough
  'Juan', 'Francisco', 'Antonio', 'Anselmo', 'Pedro', 'Miguel', 'Antonia', 'Juana', 'Rosa', 'Chana', 'Petra', 'Ramona',
  'Carmen', 'Dolores', 'Juanita', 'Rita', 'Mateo', 'Pablo', 'Rufino', 'Silvano', 'Diego', 'Lorenzo', 'Enrique', 'Esparza', 'Ana',
  'Navarro', 'Sesma', 'Filisola', 'Cos', 'Condelle', 'Garza', 'Lozano', 'Lerma', 'Sosa', 'Felipe', 'Marta', 'Castro', 'Perfecto',
  'Angelina', 'Francisco', 'Guadalupe', 'Gonzales', 'Goliad', 'Nacogdoches', 'Matamoros', 'Velasco', 'Mina', 'Alamo',
  // English names of the record and of the pools
  'Travis', 'Crockett', 'Bonham', 'Dickinson', 'Almeron', 'Susanna', 'Joe', 'Ben', 'Kimbell', 'Martin', 'Smith', 'Sutherland',
  'Moore', 'Smither', 'Austin', 'Burleson', 'Fannin', 'Johnson', 'Karnes', 'Neill', 'Grant', 'Horton', 'Houston', 'Rusk',
  'Sherman', 'Lamar', 'Hockley', 'McCulloch', 'Emily', 'West', 'Twin', 'Sisters', 'William', 'Barret', 'James', 'David',
  'Butler', 'George', 'Albert', 'John', 'Stephen', 'Edward', 'Walker', 'Benjamin', 'Rush', 'Francis', 'Henry', 'Wax', 'Erastus',
  'Clinton', 'Sam', 'Thomas', 'Sidney', 'Launcelot', 'Captain', 'Colonel', 'Reverend', 'Mrs.', 'Gregorio’s', 'Ana’s',
  'Ezra', 'Caleb', 'Amos', 'Elias', 'Jethro', 'Hollis', 'Alvin', 'Sarah', 'Patience', 'Lucinda', 'Mahala', 'Rhoda',
  'Keziah', 'Temperance', 'Charity', 'Almira', 'Drusilla', 'Delia', 'Effie', 'Winnie', 'Adela', 'Minerva', 'Lavinia', 'Orpha',
  'Prudence', 'Docia', 'Jonas', 'Hiram', 'Zadok', 'Jasper', 'Enos', 'Espada', 'Esteban', 'Cincinnati', 'Mexican', 'Handbook',
]));

/** The table as patterns, longest written form first, each matched as whole words. */
const letter = '[\\p{L}\\p{M}]';
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = Object.entries(RESPELL)
  .sort(([a], [b]) => b.length - a.length)
  .map(([written, said]) => [new RegExp(`(?<!${letter})${escape(written.normalize('NFC'))}(?!${letter})`, 'gu'), said]);

/** The words the voice is given for a sentence: the game's spelling with every name in the table respelled. */
export function respell(text) {
  let out = String(text ?? '').normalize('NFC');
  for (const [pattern, said] of PATTERNS) out = out.replace(pattern, said);
  return out;
}
