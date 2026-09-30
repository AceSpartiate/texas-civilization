# Texas Revolution family simulation

A local, browser-based classroom simulation for a middle-school history lesson. Each student guides a fictional household in the settled colonies of Texas in the autumn of 1835, and learns what their family would have learned — when somebody carrying it actually reached them.

It runs entirely on one teacher's computer over the school's own network. There is no account, no cloud service, no Internet dependency and no AI service anywhere in the classroom path.

**This is a prototype, not a finished course, and a whole game takes several class days** (below). It has been run with one real class, and never on thirty district devices. Read [docs/GATES.md](docs/GATES.md) before treating it as classroom ready.

## For a teacher: install and run

The game is installed from one small file, **`TexasRevolutionInstaller.exe`** (about 170 KB). Run it: it downloads the game (about 460 MB, once) and opens the game's setup, which installs it. After that, everything — the install, the shortcuts, the updates — is the same however the game arrived.

**Sharing it with a colleague: send them that small file**, by Google Drive, OneDrive, Teams, a USB stick, or email where email allows it. Many email services — Gmail, Outlook and most school accounts — refuse any `.exe` attachment, even inside a zip; if yours does, put the file on a shared drive and send the share instead. Only as a last resort, this link downloads the small file straight away, with no page to read: <https://github.com/AceSpartiate/texas-civilization/releases/latest/download/TexasRevolutionInstaller.exe>.

1. **Windows will warn you once, and it is expected.** The small file is not code-signed — a certificate costs a few hundred dollars a year and this has none — so SmartScreen says *"Windows protected your PC"*. Click **More info**, then **Run anyway**. A browser may also say the file *"isn't commonly downloaded"*; choose **Keep**. Nothing about either warning means the file is faulty; it means nobody has paid to vouch for it. The game's own setup, which the small file downloads, does not warn again.
2. The small file shows *"Texas Revolution: downloading the game (457 MB)…"* with a progress bar and **Cancel**, checks the download is exactly the published file, and gets out of the way as the game's setup opens. If it cannot — no internet, a school network that blocks the download, not enough room, or security software that stops the setup — it says which in plain words and offers **Try again**. It installs nothing itself, and deletes what it downloaded once the game's setup has closed.
3. The setup installs for **you only**, under `%LOCALAPPDATA%\Programs\TexasRevolution`. No administrator, no UAC prompt, nothing changed for anyone else who uses the computer. You can choose a different folder, and there is a checkbox for a desktop shortcut; a Start-menu entry is made either way.
4. It opens by itself when it has finished. Press **Start the class**. The launcher then shows the two things you have to hand out — the **class code** in large type and the **join address** below it, each with its own copy button — along with how many households have joined so far. **Open class view** puts the teacher's view in its own window.
5. Students join at that address with the six-character class code. A class has **30 families** unless you choose another number (5 to 30) on the Host page before anyone joins; the families nobody joins are run by the game as neighbours. Five households must join before Start; fewer is possible with a deliberate second press, which is how one person can try it alone.
6. **A student who is late, or absent on the first day, still joins** with the class code: they are given the first family nobody is playing, or the family you choose for them on the Host page (**Late students**) — a spare one, or the family of a student who is not coming back.
7. Press **Stop for today** on the Host page (or **Stop the class** in the launcher) when you are done for the day. Closing a browser window does **not** stop it. The next day, start the class again: every family is where it was, and students' pages that were left open come back by themselves.

**Several sections.** Each class you start is kept. On the Host page, **Classes** lists every class on this computer — its name, its code and where in 1835–36 it was left — and **Open** puts any of them back, paused where it stopped, with the same students and family keys. **New class** asks for a name ("Period 4") and a number of families. A class that is running has to be paused first.

**How long it takes.** A whole game is the autumn of 1835, the winter and the spring of 1836, and with students playing it is **about 6 to 11 class days at Study, 3 to 5 at Brisk and 1 to 2 at Quick**, counting 40 minutes of play a day and about 15 minutes on the first day to join and make families. The Host page shows these numbers before you press Start, and at any time how far the class has got and roughly how many days are left at each pace. **Pause** for a break in the lesson; at the bell press **Stop for today**, which saves the class paused where it stands; **End Game** ends the whole war and names a winner. [TEACHER.md](TEACHER.md) is a one-page guide to running the class days, Classes, students getting back in and the debrief.

**If the class will not start** after the computer was shut down or restarted with the class still open: start it again. A class whose last server has certainly gone opens by itself, after a backup of its save is put in the data folder's `archive`. If the launcher still says the save is in use, close every launcher window, restart the computer and start the class once more; [recovery](docs/RECOVERY.md) (a copy ships in the `docs` folder) has the rest.

A new family arrives by wagon, chooses its house site and camps while it builds. It can **survey** ten-acre plots on its land, **clear** them into fields and **fence** them one at a time. On the real-land map it can hunt its own woods and fell its own trees; the logs go straight onto the family's one wood pile at the house, and the house, the fences, the furniture and a carreta all take from it. Previously saved classes retain their existing homes and land.

Each person can be sent **on foot**, **on the horse**, or **with the ox and wagon**, and the three are genuinely different: speed, how much comes home, and how tired they arrive. There is one of each per family.

The Host page carries a **pace** — Study, Brisk or Quick. The lesson is the same in all three; only how long it takes to watch changes. Study is the default, and the slowest: at Study a walking settler looks like somebody walking. The pace you choose is kept with the class, so it opens at the same pace next time.

It appears in **Settings ▸ Apps** like anything else and can be removed there; removing it asks separately whether to keep your saved classes, and keeps them by default.

The launcher shows which release you have and checks GitHub for a newer one when it opens; updating downloads and installs it with a progress bar — the launcher itself included, putting the previous version back if anything fails — leaves your saved classes alone, and refuses to run while a class is going. A copy installed before the launcher could update itself needs the setup run over it once more (the small file does it: choose **Update**); see [deployment](docs/DEPLOYMENT.md#updating-launcher-included).

**Play Solo** opens a game of one, already joined and already started, in its own window — for trying the game without running a class. It keeps its own save and port and answers only this computer, so a class that is running is not touched.

**Other ways to get it.** The whole setup, `TexasRevolutionSetup.exe` (the file the small one downloads, and the one an installed launcher updates from), still comes with every release and installs exactly the same way with no download. `TexasRevolutionSetup.exe --extract <folder>` unpacks without installing anything — for a memory stick, or a machine that will not have software installed on it. `--install <folder> [--desktop]` installs without the window, for a school setting up a room of machines. The smaller **NeedsNode** zip is the game alone for a machine that already has Node 22+, and uses `Launch.vbs` as it always has.

Class data — the save, the private Host URL, logs and archived classes — lives beside the application when that folder is writable, and otherwise under `%LOCALAPPDATA%\TexasRevolution\data`. See [deployment](docs/DEPLOYMENT.md) and [recovery](docs/RECOVERY.md).

A student who stays in the same browser is reconnected automatically, and a page that loses the server — Wi-Fi dropping, a Chromebook asleep, the server restarted — says *Reconnecting* and keeps trying until it is back, then carries on with the same family. One who does not have their browser — a cleared browser, a borrowed laptop, a cart Chromebook — chooses **I was already in this class**, types the class code and taps their own name, or types their **family key**, eight characters shown in their own family journal. If they have lost that too, the teacher can look it up from the Host page. The class code forgives an O typed for a 0 and an I or L for a 1. Each student joins under a name of their own — a second "Sam" is asked to add a last initial — so the list of names is never ambiguous. A family open in more than three tabs closes the oldest, which says so and offers **Play here**; a Chromebook that goes to sleep with the game open is let go by the server within about thirty seconds, so its student can pick the family up on another device.

## What a student does

Before the teacher begins, the lobby is not dead time: a student first **rolls a die for their family** — who is in it and how old they are — and can then set it to work, and an optional walk-through explains what the work costs. Nothing advances until Start, so nobody gets ahead by joining early — every family's plan begins on the same minute.

Then a household farms, hunts, mends its tools, trades seed and food with the families standing beside it, and deals with the residents of Gonzales. Nobody sees another household's stores, and nobody who is not theirs takes an order.

News reaches them the way news reached people: a rider starts where the event happened, rides the real road, and says it out loud to whichever member of the family they came alongside. On a long road the word changes hands, so a family near the town meets somebody who saw it and a family at the edge of the county meets the fourth person to carry it — older, second-hand, and recorded in their journal as a rumor.

A game runs in three periods — the autumn of 1835 to the news of Béxar, the winter to the fall of the Alamo, and the spring of the Runaway Scrape to San Jacinto — and each period spans two or three class days at Study. Stopping for the day and starting again keeps every family where it was; the Host page says where the class has got to. The first real minutes are peaceful: families arrive on September 28 and make their homes before the first news from Gonzales.

## For a developer

Node 22 or later. No dependencies, no build step.

```powershell
npm.cmd start
npm.cmd test
npm.cmd run solo    # a solo playtest: joined, started, opened in the browser
```

**More than 1,700 automated tests** (`npm test`), needing no external packages. Browser proofs need separately installed Playwright and Chromium or Chrome; the exact commands are in [HANDOFF.md](HANDOFF.md). Every test makes an isolated temporary class and leaves the ordinary classroom save alone.

Read in this order: [VISION.md](VISION.md) for what this is for, [HANDOFF.md](HANDOFF.md) for the actual state and what is proved, [TECH.md](TECH.md) and [GAME.md](GAME.md) for the architecture and the play, and [HISTORY.md](HISTORY.md) — always — before changing anything historical. Documented fact and invented gameplay are separated there claim by claim, and dated evidence for each piece of work lives in [docs/evidence](docs/evidence).

Those development documents stay in this repository and are deliberately left out of the teacher packages, which carry the game, this file, [TEACHER.md](TEACHER.md), [GAME.md](GAME.md), [HISTORY.md](HISTORY.md) and [docs/RECOVERY.md](docs/RECOVERY.md) and nothing else.
