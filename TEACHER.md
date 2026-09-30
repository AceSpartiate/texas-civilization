# Running the game with a class

One page for the teacher. How to install it is in [README.md](README.md); what to do if the class will not start is in
[docs/RECOVERY.md](docs/RECOVERY.md).

## Sharing the game with a colleague

Send them the small file, **`TexasRevolutionWebSetup.exe`** (about 170 KB): by Google Drive, OneDrive, Teams, a USB stick,
or email where email allows it. They run it, it downloads the game (about 460 MB) and opens the same setup you used, and
from then on their copy installs, starts and updates exactly as yours does.

- **Email often refuses it.** Gmail, Outlook and most school email accounts refuse any `.exe` attachment, even inside a
  zip. If yours does, put the file on a shared drive and send the share.
- **Windows warns once.** The file is not code-signed, so Windows says *"Windows protected your PC"*: **More info**, then
  **Run anyway**. A browser may say it *"isn't commonly downloaded"*: **Keep**. The game's setup that follows does not warn
  again.
- **It needs the internet the first time**, for the one download. If a school network blocks it, the small file says so and
  names, for your IT staff, where the download comes from.
- **A last resort** if the file cannot be passed on at all: this link downloads it straight away, with no page to read -
  <https://github.com/AceSpartiate/texas-civilization/releases/latest/download/TexasRevolutionWebSetup.exe>.

## How many class days

A whole game is three periods: **the autumn of 1835** (it ends after the news that Béxar was taken), **the winter of 1836**
(it ends the night Gonzales burns, after the Alamo) and **the spring of 1836** (the Runaway Scrape, to the news of San Jacinto).
Counting about 40 minutes of play a day, and 15 minutes on the first day for students to join and roll their families:

| Pace | The whole game | Autumn, about | Winter, about | Spring, about |
|---|---|---|---|---|
| **Study** (the default) | 6 to 11 class days | 3 to 4½ | 1½ to 2 | 2 to 4 |
| **Brisk** | 3 to 5 | 1½ to 2 | less than 1 | 1 to 2 |
| **Quick** | 1 to 2 | less than 1 | less than 1 | less than 1 |

The Host page shows these numbers before you press Start, and at any time how far the class has got and roughly how many days
are left at each pace. A class that answers its questions quickly is at the short end; one with students who sit idle or are away
is at the long end.

**Pace** is how fast the class watches, never what happens: the same news, the same distances, the same choices. Study is the
slowest, and at Study a person walking looks like somebody walking. Brisk or Quick fit a tighter schedule. **The pace goes back to
Study each time the class is opened again**, so choose it again after you press Resume.

## At the bell: Pause, Stop for today, End Game

- **Pause** stops the clock while the server keeps running: for a fire drill or a talk in the middle of the lesson. **Resume**
  carries on.
- **Stop for today** is the button for the end of the lesson. Press it twice. It saves the class paused, exactly as it stands,
  and closes the server; every student's page is told the class was stopped for today. Next class, start the class from the
  launcher as usual: it opens paused where you left it, with the same families and students, and **Resume** carries on.
- **End Game** ends the whole war for everyone and begins the end: the class video, each family's own, then the ending, with the winner (see *The debrief*). Press it twice, and only when you
  mean to finish. If it was a mistake, **Classes** can take the class up again where it was (**Continue this class**), but the
  class will have seen the ending.
- **Do not leave a class running when you go.** Closing a browser window does not stop it. A running class goes on without the
  students, and a student's family is run by the computer while their page is closed.

**The end of a period.** The autumn and the winter each stop by themselves at their own end and show where the families stand:
each family's coin and the land it has been promised, and no winner, because the war is not over. Next class, press **Continue to
the winter of 1836** (or **Continue to the spring of 1836**) and then **Resume**. Over the winter everybody who was away comes
home, wounds mend by the time that passed, and the family eats through the winter without starving.

## Classes

**Classes**, on the Host page, lists every class on this computer: its name, its code and where in 1835-36 it was left.

- **Open** puts another class back, paused. Pause the class that is running first.
- **New class** asks for a name ("Period 4") and a number of families (5 to 30, 30 unless you choose). The class it replaces is
  kept in the list.
- **Delete** is asked twice, and never destroys a class: it is moved to the `archive` folder of the class data.
- **Continue this class** appears on a class that End Game ended part-way through a period.

Each class keeps its own students, families and family keys, so several sections can share one computer.

## How students join

Before you press Start, the Host page shows **How students join** down the right: one address to type in large letters, with the
class code at the end of it (like `http://192.168.1.20:3000/6744EF`), and a QR code of that same address a Chromebook's camera
can read. Put it on the projector. A student who types the address or scans the code types only their name. A student who typed
only the first part (without the code) is asked for the class code, which is shown under the address. If the first address does
not open on the students' Chromebooks, try the others listed under it. Once the class is running the card folds to one line; press
it to show it large again for a latecomer.

The code changes with every **New class**, so yesterday's address stops working: a student who opens it is told *This is an old
class address* and can type today's code on the spot, or open the address on the screen.

## How students get back in

- **The same browser:** they are back in by themselves. A page that loses the server (Wi-Fi, a Chromebook asleep, the server
  restarted) says *Reconnecting* and keeps trying.
- **A different browser or Chromebook:** they open the join address, choose **I was already in this class** and tap their own
  name (on the bare address they type the class code first);
  or **I already have a family key** and type the eight characters shown in their own family journal.
- **Five wrong codes** make only that student's browser wait half a minute; the rest of the room can still get in.
- **Nothing works:** on the Host page, **Recover a student**, choose the family, and **Show this family's key**. It shows one
  family at a time, because the Host page may be on the projector.
- **Late, or absent on the first day:** they join at the join address, and are given the first family nobody is playing, or the
  family you choose for them under **Late students**. If nothing has happened to that family yet they still roll the die for it;
  if the computer has been playing it for a while, they take it as it is.
- **Gone for a while:** after two minutes with their page closed, a family goes on by itself, run by the computer, until the
  student comes back and plays it again.

## Read aloud

Every tip, message card, call, rider's line and the journal's newest line has a **Read aloud** button. It reads the words in a
natural computer voice - a narrator, a woman's voice for a woman, a man's for a man, and the rider's own - made on your computer,
with nothing sent to the internet and nothing installed on the Chromebooks. Most lines are ready at once. A line with a family's
own names in it is spoken by your computer the first time, and its button says **Getting ready…** for a few seconds, longer when
many families get news at once. It is as loud as the student's Sound setting, and silent when their sound is off: headphones
help in a full room.

## The debrief

When the spring ends (or at End Game) the class goes through the end together, and the computer runs it by itself:

1. **The class video** plays on your screen (the projector): about two minutes of the whole class's war, told from several
   families - who went where, the fights, the flight east, the burnings, the news and how late it came, the homecoming. Your
   computer makes it first, so it may take a minute to start. The students' screens say to look up at the class screen.
2. **Each student's own video** then plays on their own screen: their family's story, then the family coming home, seeing what is
   left, rebuilding if the farm was burned, remembering anybody they lost, and the head of the household counting what is left - and
   selling the farm to a land agent if it still stands. Every student's video starts by itself at the same moment, once the class video
   has finished and your computer has made them all (it makes two at a time, while the class video plays); your screen counts down to the start and then to the final numbers. Nothing waits for a student who is
   away, and a student who opens their page late joins where the class is.
3. **The final numbers**: when the longest video has played, every page shows **the ending**. It can be closed to look at the map again, and opened again with **How it ended**.

**Skip ahead** moves the class on at any step, **Play the class video again** replays it while the students watch theirs, and after the
numbers **Play the ending again** (under *Look up one family's flashback*) runs it all from the start. A student can replay their own
video. Nothing is lost by reloading a page: it comes back to the step the class is at. **Controls** (top left) opens your own buttons -
Classes and New Class, Stop Server, the pace - over the ending without stopping it.

- **Each student** sees their own family: its coin (and what the farm sold for, or the glory a burned farm counts), its glory and its final number, **Our story** with questions about what their
  family did, where the coin came from and went, what earned glory, and what they did for their neighbours. Glory is hidden from
  everybody, you included, until this moment. Each award says how it was worked out (*Fighting counts 3 × 2 (23 road miles from
  home) = 6 glory.*), and the final number is said step by step in whole numbers, so a student can check it.
- **The Host** sees every family in one table (who went to the war, when it heard of the cannon and of the Alamo's fall, whether
  it fled or stayed in the spring and where it was at the end, whether its farm burned, prisoners, coin, glory, land, the final
  number), who finished first, how the final number is worked out, and who helped whom. Put it on the projector: a young person
  who died of a sickness is never named on it.
- **For the class** is the list of questions to talk through. The first ones come from this class's own game, and name real
  families: two families that heard the same news days apart, two neighbours who chose differently when told to leave, a family
  that sent somebody to the war beside one that sent nobody. Then three that fit any class:
  1. Which families heard the news first, and did hearing first change what they did?
  2. Why did some families flee east in the spring and others stay, and what did each choice cost them?
  3. What did a family give up at home when somebody went, and what did staying home cost?
- **What nobody in Texas knew** closes it, once the class has lived February 23: why Béxar was caught unprepared.

Ask *why* a family chose as it did, never who was right. Every family was invented, and [HISTORY.md](HISTORY.md) says, claim by
claim, what in the game is documented history and what was made up for the game.
