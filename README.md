# Texas Revolution family simulation

A local, browser-based classroom simulation for a middle-school history lesson. Each student guides a fictional household in the settled colonies of Texas in the autumn of 1835, and learns what their family would have learned — when somebody carrying it actually reached them.

It runs entirely on one teacher's computer over the school's own network. There is no account, no cloud service, no Internet dependency and no AI service anywhere in the classroom path.

**This is a prototype of one afternoon, not a finished course.** It has never been run with a real class on thirty district devices. Read [docs/GATES.md](docs/GATES.md) before treating it as classroom ready.

## For a teacher: install and run

Download **`TexasRevolutionSetup.exe`** from [Releases](https://github.com/AceSpartiate/texas-civilization/releases) and run it.

1. **Windows will warn you, and it is expected.** The setup is not code-signed — a certificate costs a few hundred dollars a year and this has none — so SmartScreen says *"Windows protected your PC"*. Click **More info**, then **Run anyway**. Nothing about that warning means the file is faulty; it means nobody has paid to vouch for it.
2. The setup installs for **you only**, under `%LOCALAPPDATA%\Programs\TexasRevolution`. No administrator, no UAC prompt, nothing changed for anyone else who uses the computer. You can choose a different folder, and there is a checkbox for a desktop shortcut; a Start-menu entry is made either way.
3. It opens by itself when it has finished. Press **Start the class**. The launcher then shows the two things you have to hand out — the **class code** in large type and the **join address** below it, each with its own copy button — along with how many households have joined so far. **Open class view** puts the teacher's view in its own window.
4. Students join at that address with the six-character class code. Five households must join before Start; fewer is possible with a deliberate second press, which is how one person can try it alone.
5. Press **Stop the class** when you are done. Closing a browser window does **not** stop it.

A new family arrives by wagon, chooses its house site and camps while it builds. It can **survey** ten-acre plots on its land, **clear** them into fields and **fence** them one at a time. On the real-land map it can hunt its own woods, fell trees and haul the logs home. Previously saved classes retain their existing homes and land.

Each person can be sent **on foot**, **on the horse**, or **with the ox and wagon**, and the three are genuinely different: speed, how much comes home, and how tired they arrive. There is one of each per family.

The Host page carries a **pace** — Study, Brisk or Quick. The lesson is the same in all three; only how long it takes to watch changes. Study is the default and makes the slice fill a class period.

It appears in **Settings ▸ Apps** like anything else and can be removed there; removing it asks separately whether to keep your saved classes, and keeps them by default.

The launcher shows which release you have and checks GitHub for a newer one when it opens; updating downloads and installs it with a progress bar — the launcher itself included, putting the previous version back if anything fails — leaves your saved classes alone, and refuses to run while a class is going. A copy installed before the launcher could update itself needs `TexasRevolutionSetup.exe` run over it once more; see [deployment](docs/DEPLOYMENT.md#updating-launcher-included).

**Play solo (playtest)** opens a game of one, already joined and already started, in its own window — for trying the game without running a class. It keeps its own save and port and answers only this computer, so a class that is running is not touched.

**Other ways to get it.** `TexasRevolutionSetup.exe --extract <folder>` unpacks without installing anything — for a memory stick, or a machine that will not have software installed on it. `--install <folder> [--desktop]` installs without the window, for a school setting up a room of machines. The smaller **NeedsNode** zip is the game alone for a machine that already has Node 22+, and uses `Launch.vbs` as it always has.

Class data — the save, the private Host URL, logs and archived classes — lives beside the application when that folder is writable, and otherwise under `%LOCALAPPDATA%\TexasRevolution\data`. See [deployment](docs/DEPLOYMENT.md) and [recovery](docs/RECOVERY.md).

A student who stays in the same browser is reconnected automatically. One who does not — a cleared browser, a borrowed laptop, a replaced device — types their **family key**, eight characters shown in their own family journal, and gets their household back on any device, even mid-class. If they have lost that too, the teacher can look it up from the Host page.

## What a student does

Before the teacher begins, the lobby is not dead time: a student first **rolls a die for their family** — who is in it and how old they are — and can then set it to work, and an optional walk-through explains what the work costs. Nothing advances until Start, so nobody gets ahead by joining early — every family's plan begins on the same minute.

Then a household farms, hunts, mends its tools, trades seed and food with the families standing beside it, and deals with the residents of Gonzales. Nobody sees another household's stores, and nobody who is not theirs takes an order.

News reaches them the way news reached people: a rider starts where the event happened, rides the real road, and says it out loud to whichever member of the family they came alongside. On a long road the word changes hands, so a family near the town meets somebody who saw it and a family at the edge of the county meets the fourth person to carry it — older, second-hand, and recorded in their journal as a rumor.

At the default Study pace the slice lasts about **54 minutes**, plus pauses: about 13 peaceful minutes from the families' arrival on September 28 before the first news, then Gonzales. It stops after the fight with each household's story preserved. Brisk and Quick show the same afternoon in less time.

## For a developer

Node 22 or later. No dependencies, no build step.

```powershell
npm.cmd start
npm.cmd test
npm.cmd run solo    # a solo playtest: joined, started, opened in the browser
```

**419 automated tests**, needing no external packages. Browser proofs need separately installed Playwright and Chromium or Chrome; the exact commands are in [HANDOFF.md](HANDOFF.md). Every test makes an isolated temporary class and leaves the ordinary classroom save alone.

Read in this order: [VISION.md](VISION.md) for what this is for, [HANDOFF.md](HANDOFF.md) for the actual state and what is proved, [TECH.md](TECH.md) and [GAME.md](GAME.md) for the architecture and the play, and [HISTORY.md](HISTORY.md) — always — before changing anything historical. Documented fact and invented gameplay are separated there claim by claim, and dated evidence for each piece of work lives in [docs/evidence](docs/evidence).

Those development documents stay in this repository and are deliberately left out of the teacher packages, which carry the game, this file, [GAME.md](GAME.md) and [HISTORY.md](HISTORY.md) and nothing else.
