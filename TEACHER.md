# Running the game with a class

One page for the teacher. How to install it is in [README.md](README.md); what to do if the class will not start is in
[docs/RECOVERY.md](docs/RECOVERY.md).

## Sharing the game with a colleague

Send them the small file, **`TexasRevolutionInstaller.exe`** (about 170 KB): by Google Drive, OneDrive, Teams, a USB stick,
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
  <https://github.com/AceSpartiate/texas-civilization/releases/latest/download/TexasRevolutionInstaller.exe>.

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

Before you press Start, the Host page shows **How students join** down the right. Put it on the projector. Students can join
three ways:

- **Join words.** *Go to playtexas.github.io and type:* three words of 1830s Texas, like **vapor erasmo slipper**, *then
  the class code*. The page at playtexas.github.io works out your laptop's address from the words and sends the student there, where
  they type the class code, in a big box, and their name. The words come from your laptop's address alone, so they stay the same
  from class to class and only change when your laptop gets a new address; no account or sign-up, and any number of teachers can
  use it at once.
- **The address**, in large letters, with the class code at the end of it (like `http://192.168.1.20:1835/6744EF`). A student who
  types it types only their name.
- **The QR code** of that same address, for a Chromebook's camera. It goes straight to your laptop and works even if the school's
  Internet is down (the join words need the Internet only to open playtexas.github.io).

If the first address does not open on the students' Chromebooks, try the others listed under it. If your laptop has more than
one network (Wi-Fi and a VPN, say), open **Students cannot connect?** on the card and choose the students' network: the words, the
address and the QR code all change to it. Once the class is running the card folds to one line; press it to show it large again
for a latecomer.

### If students cannot reach your laptop

Some school networks stop student devices reaching a teacher's laptop. Neither the game nor playtexas.github.io can get round
that; only the network can be changed. Students who press Back after a page that would not open see **Didn't work?** with what to
try and what to tell you. On the Host page, open **Students cannot connect?** and press **Copy this note for IT**: it says, in plain
words, your laptop's address and port and what IT needs to allow - student devices able to reach your laptop on the classroom
network (no client or AP isolation between them, or a rule for that one port), and Windows Firewall allowing Node.js on the
Private profile.

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
  if the computer has been playing it for a while, there is no die - they keep its people and what it has done - but they give it
  its last name, may rename its people, and choose how the parents look. If the class is paused, the last name waits until you
  press Resume.
- **Gone for a while:** after two minutes with their page closed, a family goes on by itself, run by the computer, until the
  student comes back and plays it again.

## Men's work and women's work

In 1835 nearly every family on the frontier divided its work: the men cleared and fenced the land, raised the house, felled the
timber and hunted; the women kept the house, made and washed the clothes, kept the garden and the dairy and nursed the sick; the
field and the stock were everybody's at picking time. The game keeps that custom - the axe and the rifle are not on a mother's bar
while her husband is at home - because it is how families of the time lived, and because **it opens**: when the men
went to the army in the autumn of 1835, the women and children were left to finish picking the cotton, and a woman whose husband was
away tended the stock and stood watch with his gun. A student whose father has gone to the war and who has a son of twelve to
fifteen at home will see the boy carry the men's work - as Dilue Rose's brother of thirteen was sent to help drive the cattle in 1836,
the older boys being gone to the army - and his mother and sisters help him at it; with no such boy at home the men's work lights up on the mother's bar - never
a girl's - and the family's story says so. That moment is the one to talk about: what the war took out of a household besides
the man, and what the women who stayed did. While he is home, his wife and daughters may still **help** with the men's work he is
at - the green hands on an icon - and a man may help his wife at hers; neither may start the other's. The same holds the other way: with no grown woman at home, a daughter of twelve to fifteen keeps the house, the garden and the wash,
and her father and brothers help her. When nobody keeps the women's work at home - no grown woman, no daughter of twelve - children of
seven and up keep house and do the wash. A family of fewer than six people keeps no custom at all: with so few
hands, everybody does whatever work needs doing. A pulsing pot or washtub on a woman's portrait means the house
or the wash wants doing and she is free to do it. The washing, and the townspeople's remarks about a dirty shirt, are the game's own
invention to make the women's work matter; say so if a student asks. Nothing in the game says that men or women are better at
anything, and the custom is never applied to enslaved people, whose labour ignored it.

## Riders, as scenes

Since 2026-10-05 a rider who brings a family news plays as a short scene over the student's whole screen: the place where their
person is standing (their yard, a town's street, the camp, the road), whoever is near, the rider riding up and getting down, and
the family or the town's people asking the questions the student chooses. The class goes on as it always did while a rider talks -
every other family carries on - and nothing opens by itself: the student presses the "!" on the person the rider stopped. A student who
never opens it still has the news in the family's journal, and can read the whole meeting back from there. Escape or the × closes
it at once. Your Host screen is unchanged: you see the riders on the roads, never what they say.

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
   has finished and your computer has made them all (it makes them one at a time while the class video plays, so the class video stays smooth, and two at a time after); your screen counts down to the start and then to the final numbers. Nothing waits for a student who is
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
