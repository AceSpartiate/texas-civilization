# Current game foundation

Maturity: **PROTOTYPE**. This is a short, low-fidelity Gonzales slice for proving the project architecture. It is not a complete Texas Revolution lesson or a classroom-ready game. [VISION.md](VISION.md) remains the design constitution; [HANDOFF.md](HANDOFF.md) records what has actually been verified and what Claude should do next.

**Required next direction (2026-09-10):** [News carried by people](docs/LIVING_INFORMATION.md). Physical messengers meet family members and deliver news through conversations, with geographically different receipt times and opportunities. Regional service, evacuation protection, plausible government involvement and uncertainty during Houston's retreat have explicit production quality gates. The report-list behavior below is the current prototype, not the final experience.

## The student's role

Each student guides one fictional household in a shared world: its people, a home, an ox, a horse, a wagon and food. A student rolls for the family when joining, so families differ in size and in how old everybody is; a household nobody joins keeps two parents and two children. Default names are dealt across the class and every person can be renamed; ids never change. These are fictional families, not researched biographies or representative demographic sampling. [HISTORY.md](HISTORY.md) separates documented historical anchors from the prototype's inventions.

**The whole family can be given work**: anybody ten or older can be sent to plant, harvest, hunt, fetch seed or mend the hoe, and any of them can strike a trade with a neighbour they are standing beside. Each has a fixed aptitude for farming, hunting and handwork, so who is sent changes how fast a job goes and how much it yields.

**Any parent, or a child of sixteen or older, can answer history.** A request for help shows on each of them and the family picks who goes; whoever carries the food is the one asked whether to go on upriver. Travelling on an ordinary errand, working the yard and resting are still the principal's orders to give. Nobody in the family has a personality beyond that.

The family panel shows people, tasks, locations and health; the property panel shows the ox and wagon. The remembered-story panel shows the most recent household events.

Nothing is scored during play: no points, patriotism meters or rewards for choosing an approved historical answer. An end-of-class outcome that names a winning family is planned and not built. Military participation is not required. This slice's request is civilian help with supplies.

## Starting a class

The teacher opens the Host through the launcher, shares its displayed student address and class code, waits for households to join, then presses **Start**. Students need a browser and may choose a fictional display name. Duplicate display names do not share a family. The configured range is 5–30 households, default 15; Start requires at least five assignments. This is a multiplayer experience, without a normal solo mode.

**A family key gets a household back.** Every family is given one when it joins — eight letters and numbers, shown in its own family journal and nowhere else. If a phone is locked, a browser is cleared, a device dies or a student moves to a borrowed laptop, they choose *I already have a family key*, type it, and get their own family back with its people, its stores and its story intact — no class code, and it works after the class has started. It has to be typed as a person types: lower case is fine, a space in the middle is fine, and the letters that look like digits are read as the digits. A family that somebody is playing right now cannot be taken over by its key, so reading a key off a neighbour's screen achieves nothing while they are still playing. **The Host page shows no family's key**, because a teacher's screen is sometimes a projector — which does mean a student who loses both their browser and their key cannot be put back.

The Host shows how many households are **here** and how many are **away** — away being a family whose connection has just dropped, which is what a phone does the moment its screen locks. It also shows public news. After Start the server automatically progresses history, information, battle phases, public reconstruction and slice completion. Teacher controls are **Pause**, **Resume**, **End Game**, **New Class** and **Stop Server**.

**New Class** and **Stop Server** each ask twice: the first click arms the button, which disarms itself after six seconds, so a stray click on a projected screen changes nothing. **Stop Server** saves and pauses the class, tells every connected student what happened, then closes the hidden server; `Stop.vbs` does the same when the Host window is already closed. **New Class** is refused while a class is running or paused — end it first — and then archives the finished class, issues a new class code, clears student assignments, keeps the class-size setting and returns to a fresh lobby. Previous students are asked to join again with the new code.

A settings screen, choosing a seed or class size from the Host page, restoring an archived class, and a visible indicator that the hidden server is running are not built yet. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/RECOVERY.md](docs/RECOVERY.md) before running a real class.

## A place and a continuous family

**The map is the whole interface.** It fills the screen. There are no side panels: the household's name, the date and its food sit as small chips over the map, news rides on it as a single line that opens, and everything else is a screen-reader text equivalent.

The view opens on the family's own land, about three and a half miles across, so a student can see their cabin, their people, their ox and wagon and their fenced field at once. It follows the family, widening to take in the road and the destination whenever someone travels. The student can drag to pan, pinch or scroll to zoom, jump to their land or to Gonzales, and press Follow to hand the camera back. Zooming out reaches the whole province. Moving the camera is not travel: everybody remains at their true location however the student looks around.

The world is drawn from an illustrated sprite library: log cabins with shake roofs and stick chimneys, open-grown post oaks and river cottonwood, corn and cotton standing in rows inside a worm-rail fence, the ox and the covered wagon in the yard. Gonzales is a cluster of seven small buildings where the roads meet, because it held about thirty-two structures and no documented street plan.

**The person you direct wears a coat nobody else wears.** The principal is in rust; the rest of the family, the people of Gonzales and every neighbour are drawn from three other colours, so the one figure a student gives orders to can be picked out of a crowded town at a glance. Their name is also the one label that never disappears as the camera pulls back.

**People are illustrated too, and the world moves.** A person walks with a stepping cycle, swings a hoe, bends to put in seed, carries the crop home and works at mending; the ox walks, the wagon's wheels turn on their axles, and the trees take the wind. Everyone breathes where they stand rather than standing perfectly still, and the loops are offset per person so nobody bobs in unison. A student who has asked for less motion gets a still world instead: the browser's own reduced-motion setting holds every clip on a neutral pose.

People turn as they go: somebody walking north or south is drawn from behind or from the front, not sideways, and somebody hurt sits rather than standing about as though nothing had happened. Hunting/search and town trading now have dedicated short pose cycles. See [docs/ASSETS.md](docs/ASSETS.md).

**Families can trade with each other.** Walk into town, or onto a neighbour's land, and anyone standing there is somebody you can deal with. Choose them, say what your family gives and what it wants back, and the offer goes to them — *Thomas of Family 1 offers 2 seed for 3 food* — to accept or refuse. Both families are told which, so nobody is left waiting on a silence. Seed and food are what change hands; a hoe is not a thing to sell, it is a thing somebody handy has to mend.

Three rules do most of the work. **A trade is said face to face**: it can only be made between two people standing in the same place, and it is over the moment they part. **Nothing is held back** — a family that offers seed and then plants it cannot make the trade good, and it says so plainly. And **nobody ever sees another family's stores**: an offer shows what was put into it and nothing else. Any member of the family can strike a bargain, not only the person a student usually directs, which is the point — the family without a spare pair of hands can ask the neighbour who is actually there.

A neighbour is always shown with their family — *Asa of Jethro's family* — so that two people with one name in the same town are two people.

**Gonzales has people in it.** Marta Ibarra trades seed and stores; Josiah Pike works iron and will set a worn hoe right; Ruth Crandall is usually somewhere on the commons. They go about the town while a student watches. Buying seed is a trade **with one of them**, named in the record afterwards — and if nobody who deals in a thing is standing there, the trip was wasted and says so, rather than quietly producing goods from nobody. All three are invented, and registered as `FIC-GONZ-009`: three people a student can meet is not a claim about how many people lived there, which no source consulted would support.

**The wait for the teacher is not dead time.** A student who joins before the class begins can already choose who does what: set somebody to plant, send somebody to the timber, walk a person to Gonzales. None of it *happens* yet — no clock runs until the teacher presses Start — so joining early buys nobody a head start, and the moment the class begins every family's plan starts on the same minute. What stays shut until then is anything addressed to another household, because the family it is addressed to may not have arrived.

A short optional walk-through offers itself once, in that lobby. It explains the family, the work, what planting costs and what the land does, and the steps are real: a student who finishes it has their family genuinely set out for the day rather than having practised on a toy. Declining it is one press and it never asks again. It cannot show a crop growing, because nothing grows before the teacher begins, and it says so rather than pretending.

**This is your family, and the game knows who they are.** Open the journal and the first thing under what you have heard is **Who we are**: a father, a mother, a daughter and a son, each with a line saying who they are to the rest — *"Married to Refugia. Father to Delia and Marcos."* That was the question the first person to play this asked, and the game had no answer to it at all.

**Every name is yours to change.** Rename any of your own people, and name the family itself; until you do, it goes by whoever the big decisions belong to — *Alvin's family*. Renaming somebody changes nothing else about them: not what they are good at, not their face, and not whose child they are. And no two families in the class start with the same names, so the neighbour you trade with is a person rather than another Thomas.

**Powder and lead is the one thing the farm and the fight both spend.** Your family keeps some in the house. A shot in the timber spends one. Whoever goes upriver with the militia takes what is there with them — the volunteers at Gonzales were settlers who brought their own arms, and so is your family. Run out and you can still farm, still trade, still go; you cannot shoot. More costs food and an afternoon in town, or a neighbour who has some and wants something you have.

**Children are drawn smaller than grown people, and mothers and daughters as women.** The art for children does not exist yet, so for now a child is a smaller copy of a grown figure; a family's principal wears the rust coat whether that is a father or a mother.

**You choose what the wagon brings.** After you roll for your family, before the class begins, you pack the wagon. It holds sixteen spaces' worth: barrels of meal, sacks of seed, powder and lead, the tools a house will need, and the things a family keeps — bedding, a pot, a chest, a spinning wheel, a few books, mosquito bars, tinware, chairs in pieces. The hoe is on the list too: leave it behind and nobody can work the field until one is bought in Gonzales. Each says how much room it takes and what it does before you choose it. What you pack is exactly what your family has; what you leave behind is not coming. If you never open it, the wagon is packed sensibly for you. When the family reaches its land, the story says what they unloaded.

**Where your house stands.** On the real map of the colonies, your wagon comes in to the surveyor's mark on your land and waits. Tap anywhere inside the dashed line to look the place over: the ground, how high above the water it is, how far to water that runs all year and to timber, whether the river floods it, and how long the lane to the road will be. Set the house there, and the lane to the road is marked out and the family brings the wagon over. The lane is a line of stakes until your family cuts it: set people to *Cut the lane to the road* and they work outward from the house, slowest through timber, which wants a felling axe. Until it is cut, going along it is as slow as the country it crosses. Nothing is built or planted until you choose. A house set far back has a long lane, so anybody coming to you, a rider with news included, takes longer to get there. A house far from running water carries its water, and heavy work goes slower until you dig a well.

**Survey your land.** Pick one of your family and choose *Survey ten acres*, then tap a place inside your land. You are told what the ground is and where it lies from the house, or why ten acres cannot go there. Send them, and they walk out, pace it off, drive the stakes and walk back; the plot is marked on your map. Plots can go anywhere on your land, apart from each other, and a staked plot is cleared into field (below).

**Your land is big.** Zoom in on it: a labor of 177 acres is about thirty people across, and a league and a labor more than a hundred and fifty.

**Whoever goes on the horse rides it**, drawn in the saddle, and a family nobody plays rides its horse to town or to hunt whenever the horse is home, walking only when somebody else has it.

**The ground slows you, and people go the quickest way.** Off the roads, climbing, timber, brush and creeks all make a journey longer, on foot, on horseback and most of all with the wagon. Somebody walking or riding cuts straight across open country when that is quicker than going round by the road, and keeps to the road where the road is quicker: through the timber bottoms, and over a big river, which is crossed only where a road crosses it. The wagon leaves the road only over open ground, so a lane cut through your timber is what lets it out.

**Your neighbours live their own lives.** Families nobody in the class is playing still farm, build their houses, hunt and go to town. Stand with one of them to trade: they take a fair offer and turn down an unfair one, and tell you why. You can help raise their walls, as they are built.

**Your land.** Every family has land marked out for it, the way the 1825 law measured it. Drive cattle and hogs in behind the wagon and you hold a league and a labor, over 4,600 acres of grazing and cropland; come without stock and you hold a labor, 177 acres. The herd's keep costs two spaces in the wagon. Your land is drawn on your map with a dashed line. No title has been issued yet.

**Neighbours help raise the walls.** Send your principal to a neighbour's land from the person panel. If their walls are going up while you are there, you can help raise them: every hour you put in is an hour off theirs, and both families remember it. Nobody has to, and nobody will ask you to.

**You build your own house.** Choose a jacal, a round-log cabin, a hewn-log cabin or a dog-run. Each says what tools it needs, how much work it is, how many people it holds, and how well you will rest and how long food keeps in it — before you choose. Set anybody old enough to **Work on the house** and they keep at it until it stands; the more of the family on it, the sooner. A hewn-log cabin wants a broadaxe, so it matters what you packed. A dog-run holds a big family but is a great deal of work; a jacal wants no axe but is small. Until it stands, you camp by the wagon. You see how a neighbour's house is coming on only by going there.

**You arrive by wagon.** The class begins with your family on the road in — the wagon, the ox, the horse and everybody — at the place where your own track leaves the road. When your teacher starts, you drive onto your land. Nobody can be set to work until they are there. There is no house yet: you camp by the wagon, where rest does two-thirds as much good and a little of the food spoils each day, and your land line says exactly how much.

**The first hours are peaceful.** A class begins at dawn on September 28, 1835, and nothing is known of any trouble until the next morning — the time to set your family to work, trade with the neighbours and get to know the land. At the Study pace that is about thirteen minutes.

**You roll for your family.** When you join, you roll a die, and the roll decides who is in your family: how many parents and how many children, and how old each of them is. The family book shows everybody, what they are to each other and their ages. A child under ten is too young to be sent anywhere.

**How you heard decides what you are asked.** A family that heard the news from somebody who saw it, or from somebody who had it straight from them, gets a neighbour at the door asking for food. A family far enough out that the word came third-hand gets no knock: nobody asks for food on a rumor. Instead the family decides whether to send somebody to Gonzales to see for themselves — which costs nothing — or to stay home and prepare. Whoever goes sees it's true when they get there, and is asked in town.

**Every decision looks the same, whatever it is about.** A neighbour at the door asking for food, and one of your own people downwind of a shot, arrive as the same kind of thing: a line saying what is being asked, and answers that each say what they would cost — *"Two food out of the store, and the road there and back"*, *"Mateo is tired, and a tired hand misses at this range"*. An answer that is not open to you says why. And if you never answer, the moment passes and your family's record says that is what happened.

**Your field grows one of two things, and they are not the same thing at all.** Corn is what the colony lived on: bring it in and it is food. **Cotton is not food** — bring it in and it sits in the house until somebody carries it to the **general store** at Gonzales, where Marta Ibarra trades **two food for every bale**, and takes as much as whoever went can carry. A cotton field is worth about twice a corn field in the end, and nothing at all until then.

**Coin is scarce, and the store would rather barter.** Your family starts with no coin at all — money really was that scarce here. At the counter the storekeeper asks how you want to be paid or to pay: a bale of cotton fetches two food or one real, three food fetch a real, and powder and seed can be paid for in food or in coin. A new hoe from the smith costs two reales and nothing else will do; mending the old one at home costs nothing. The store only has so much coin, too: once the storekeeper's purse is empty, she can pay only in goods, and you find that out at the counter. Coin counts for something at the end of the game. The same storekeeper sells the seed and the powder, so a family with a crop has a reason to go and something to go with.

**Anybody can be taught to shoot, and it costs.** If the person you want to send has never had the knack, set up a mark behind the cabin and spend an afternoon at it. It takes **two powder out of a house that holds three** — which is most of what you have, and the same powder a hunt would spend. A steadier hand makes the long shot and brings more home, and a hand tops out after two afternoons.

Shooting is the only thing anybody can practise. Nobody gets better at farming or at mending a hoe by trying harder; for those, a family that has nobody handy still has to go into Gonzales or ask a neighbour.

**The woods are where they were.** On the real map, a class made now reads where the timber stands from the government's map of the vegetation before settlement: pine round Bastrop and in the east, broad timbered bottoms on the lower Brazos and Colorado with live oak near the coast, post oak savanna open and park-like with thickets in it, coastal and blackland prairie with a clump of oaks here and there and timber along the creeks, mesquite brush west of the Guadalupe. Close up, every tree is drawn where it stands; further out the timber is a canopy, and further still a shade. Every tree is a tree of a kind: what it gives for a house comes with felling. A class made before keeps its timber along the water.

**Far from Gonzales, your own settlement calls.** On the real map, when the express brings the news to your door, your settlement asks what it asked in 1835: San Felipe to turn out and march for Gonzales, Matagorda and Columbia to gather at Kerr's on the Lavaca, the Trinity and the Colorado to join the men gathering. Send somebody sixteen or older with the family's rifle and powder, or keep them home; on the coast, keeping the coast is its own answer. Whoever goes rides to the gathering and waits there.

**There is a deer.** Out in the timber, a deer stands ahead of whoever is hunting while they wait downwind, and comes closer if you tell them to wait for it; it is gone once the shot is taken or they turn for home. Deer are what the settlers of the colonies hunted.

**Anybody on a horse is drawn the size of a horse with somebody riding it.**

**Your family hunts its own timber.** There are no hunting grounds set aside: a hunter goes to the timber or brush nearest your house, which is a few hundred yards off for a family on a wooded creek and miles across the prairie for a family out in the open, so the country you were dealt decides how far a hunt is. The place is named for its water, *the timber on Kerr Creek*.

**A hunt is something you take part in.** Send somebody to the timber and they work in from the edge, move up through the trees, wait downwind — and then **the work stops and asks you**. They are downwind of something, with a shot, and it is not a close one:

- **Take the shot.** Whether it goes home depends on the person standing there: a tired hand misses at that range, and so does somebody who never had the knack. The button says which of those applies to *them*, before you press it.
- **Wait for it to come closer.** Three more hours, and then it is a certainty — but those are three hours of an afternoon your family may need elsewhere.
- **Leave it and come home.** Nothing to carry, and the rest of the day is yours.

Nobody stands there for ever. If you are busy with something else for two hours, they decide alone, and your family's record says that is what happened.

**How you sent them decides what they can do when they get there.** A long walk to a far stand arrives somebody tired; the horse barely tires them at all. That is the same fatigue the road has always cost — it is just that now it reaches all the way to whether they can shoot straight.

**A hunt is something you watch.** Send somebody to the timber and they work in from the edge, move up through the trees, wait downwind and still, and take the shot — four stages in four places, with the pose changing at each. The shot is a puff of smoke in the trees. Then they walk home carrying it.

**No animal is ever shown or named.** That is not a gap: buffalo is the only game documented for this stretch of country, and this game will not invent a species and present it as natural history. What you see is a person hunting and what they bring back.

**A farm is something a family makes, not something it is given.** You start with a cabin, one patch of broken ground, and no fence.

- **Clear a staked plot.** Choose one of your staked plots on the map and send somebody to clear it: ten spells of work for prairie, twenty for brush, thirty for timber, which also wants the felling axe. Send more of the family and it goes faster; call them home and the work done stays. The field is every plot you have cleared, wherever it lies — planting takes two seed a plot and walks out to each, and a plot a mile off costs the walk. A plot cleared after planting has nothing growing on it until the next planting. From three plots in crop the harvest wants the ox and wagon in the yard.
- **Fence a cleared plot.** Stock here run loose and are not fed; they get into whatever is not fenced. Each plot is railed on its own, and a third of what grows on an unfenced plot goes to the stock. The number is on both buttons before either is pressed.

Clearing early is worth it and clearing late is not, because a crop still has to ripen. That is the decision: an afternoon now against a harvest that may not come in before the day ends.

**News arrives as a person, and nothing announces it.** A rider reins in at your farm and stops one member of your family — the one he happened to find. You see him: he is drawn there, on his horse, and the person he stopped carries a mark over their head. Click that person and their panel offers **Listen**, beside their other instructions, because that is what listening is. Nobody else in the family can take that conversation; the rider spoke to who he spoke to.

The exchange plays out a line at a time. You can ask him things — where he came from, whether he saw it himself, how many of them there were — and a rider who was only told says so, names who told him, and will not guess. Everything said is written into the first page of your **family journal**, with how far the word travelled and how old it already was, and the whole conversation can be read back after he has ridden on.

**Whoever goes upriver stands with the Texian volunteers.** When the fight comes, your family member is drawn with the men they came with, not among the Mexican tents, and when it is over they walk home from where they stood.

**The call to go upriver comes from what you were told in town.** Somebody of yours standing in Gonzales when the men cross the river hears it happening and is asked whether to come; somebody who gets there hours later is told how long ago the men left, and asked whether to follow.

**How somebody goes is a decision, and there are three of them.** Every family owns a horse, an ox and a wagon, and a panel on the person you have selected says which way they will set out.

- **On foot.** Three miles an hour. Always possible, never blocked, and it is the legs that pay: walking is the only thing that tires anybody enough to matter.
- **On the horse.** Near three times the pace and barely tiring, which is what lets a family nineteen miles from Gonzales arrive fit to do something rather than arrive worn out. It carries very little.
- **With the ox and wagon.** Slower than the people walking beside it, and it brings home four times what a person can carry. It will not go over the ford.

There is one of each between four people, and the thing you take is genuinely away from the farm while you have it: the ox that walked to Gonzales is standing in Gonzales, and the next person who wants it is told who has it and where. A hunt in the timber kills far more than one person can carry; the button says how much will come home before it is pressed, and the family is told plainly what was left behind.

**A class runs at a pace the teacher chooses.** Study, Brisk or Quick on the Host page. The afternoon is identical in all three — the same distances, the same arrivals, the same decisions — and only the number of real minutes spent watching it changes. **Study** is the default and the honest one: a settler walks three miles an hour, and at that pace they cross about their own length of ground each second, which is what walking looks like. It also makes the Gonzales slice fill a class period rather than running out in under five minutes. Quick is the old pace, for a teacher who is behind.

**Click a name in your roster and the camera goes to that person** and stays with them while they walk — useful the moment one of your family is in the timber and another is in town, because the frame that holds both shows neither. **Follow** gives the whole family back. Moving the camera never changes what you are allowed to see; it moves over the same projection either way.

**You see other people only where your own family is standing.** Walk into town and the residents are there, along with any other student's family member who happens to be in town, and any rider passing through. Standing beside somebody shows who they are, where they are and what they appear to be doing — never their family's stores, their errand, or what a courier is carrying. Nobody who is not yours takes an order.

**There is work to do.** Each family holds a field of corn or cotton, two seed, and one hoe. Planting spends seed and puts a crop in the ground; the crop comes on by itself while the family does other things; bringing it in feeds them. The hoe wears by a fixed amount every time it is used, and the uses left are shown before anyone picks it up, so running it into the ground is a decision a student can see coming rather than a dice roll that happens to them. A worn hoe is mended at home by whoever has the hands for it, or replaced in Gonzales. Seed runs out, and the only way to get more is to send somebody into town — which takes as long as that family's own road takes, because the distances are real.

Every family member can be sent to work, and they are not interchangeable. Each person has a fixed aptitude for farming, hunting and handwork, so the one who mends the hoe best may be the one already away hunting. Only the household's principal answers the historical call; the farm is the whole family's.

**Instructions are given by clicking a person.** Their card opens beside them with what they are doing and what they can be asked to do. When something is waiting for someone — a neighbour at the door — a **`!`** appears over that person's head, and clicking them is how it is answered. Nothing on screen explains this; if it needs explaining it is not finished. A student may also reach every person and control from the keyboard through the hidden roster.

Only the household's principal can be given orders today. Selecting another family member shows what they are doing and offers nothing, which is honest about what is built.

**Travel to Gonzales** sends Thomas down the road. He leaves his land, walks the route the map draws, and arrives at Gonzales as the same person, taking as long as the distance from his own home requires. **Return home** sends him back the same way. **Work** and **Rest** change his assignment when he is not traveling. A travel instruction cannot teleport him home or replace an active journey.

Food changes through a deliberately simple routine based on people present and working at home. Leaving changes the household's labor. The ox and wagon are persistent objects with location/condition references, but the student cannot yet drive, lend or load the wagon. Broader property arrangements and unresolved service are exercised by foundation fixtures, not complete student systems. Rest currently changes a task; it is not a general health-treatment system.

The country is built from researched pattern rather than a grid. One map unit is one mile. The Guadalupe runs past Gonzales with the town on its east bank, the contested ford lies opposite the town, and the battle site sits about seven miles upriver on the far bank. Homesteads are scattered along the road and the water at genuinely different distances: in a fifteen-household class the nearest family is under two road miles from town and the farthest is nearly nineteen, a walk of six hours. **Where a family lives now changes what it can reach and when.** Crossing the river means using the ford, because nothing else crosses the water.

Individual coordinates, the exact course of the drawn roads, and the outlines of fields and timber are invented for gameplay; the pattern behind them is cited in [HISTORY.md](HISTORY.md). Building shapes remain placeholder art, and visible formations are representative groups of miniature people, not exact troop counts, researched uniforms or a precise battlefield reconstruction. The art contract is in [docs/ASSETS.md](docs/ASSETS.md).

## Information arrives unevenly

The server knows objective events before everyone hears about them. Each household has separate reports, and the Host has its own public reports. A family's news panel shows what it received, its source, confidence and age. The model distinguishes when the report arrived from how old the reported observation is.

A family present at Gonzales can observe the situation there. Everyone else is told by a person who rode from where it happened — the cannon news from the town, and how the fight ended from the camp upriver — **delivery requires somebody to be there to hear it**, not a courier reaching a map pin, and an empty cabin is told nothing.

**How far you live decides what kind of news you get, not only how late it is.** A rider carries word about twelve miles and then hands it to somebody going further, at a fork of the road or at the ford. So a family beside Gonzales meets the person who saw the camp and has a confirmed report; a family at the far edge of the county meets the third or fourth person to carry it, who says plainly that they did not see any of this themselves, names who told them and where, and leaves that family holding a rumor. The account is older too: the journal says how long ago it happened, not just when it arrived. A rider also stops for anybody they come alongside who does not already know, so word sometimes reaches you from a rider who was never sent to you at all.

The projected Host cannot disclose private household knowledge or show an unseen battle just because the server already knows its outcome. Students may still discuss information aloud, consistent with the vision. **There is still no student chat**, and no way to send anything to a household you are not standing beside: the only household-to-household interaction is a trade offered face to face, which carries goods and no message.

Visibility is deliberately narrow, and it is narrow by *place* rather than by kind. A student always sees their own people and property, plus an eligible Gonzales battle view; beyond that they see **whoever is standing where one of their own family is standing** — another student's family member, a Gonzales resident, a rider passing through. That shows who somebody is, where they are, what they appear to be doing and their visible condition, and never their household's stores, their skills, their errand, or what a courier is carrying. Nobody who is not yours takes an order. There is one exception, and it is about news rather than about people: **a rider carrying word can be seen some miles off**, coming up the road and riding away again, because watching somebody arrive is half of what an arrival is. Seeing one tells you a rider is there and nothing whatever about what they carry. **Looking at another family's home from a distance still reveals nothing**, and there is no way to see across the county; that is what makes going somewhere worth doing.

## One request, two valid stories

After the household learns about the cannon confrontation, a fictional neighbor asks whether Thomas can carry food to the people gathering near Gonzales. The request is offered once. It closes when the opening battle phase arrives; ignoring it does not make history wait.

| Choice | Current physical action and lasting result |
| --- | --- |
| **Help** | Costs two food, records a service commitment, and sends the same Thomas physically to Gonzales. After his help arrival and the historical resolution, the neighbor relationship increases by one, Thomas becomes tired, and consequence/memory events are recorded. His actual location or return journey remains unchanged. |
| **Stay home** | Available when Thomas is home and not traveling. He keeps working, the household marks itself prepared and sets aside one food. Its choice, consequence and memory are recorded immediately. The request does not recur. |

If Thomas already reached Gonzales before accepting, help is recorded at his existing location. A family lacking two food can still choose to stay. The amounts, gratitude and fatigue are explicit gameplay inventions; they are not measured historical household outcomes or hidden success rolls.

The causal chain is retained in the Event Log: historical situation → received information → personal request → choice → departure/travel/arrival where applicable → consequence → memory. Refusal has its own complete consequence and memory. A returning helper is not teleported back to Gonzales or home when the director settles the result.

## Gonzales and the autonomous Host

The historical anchors are the September 29 confrontation over the cannon and the October 2 clash. The fixed outcome is that the Mexican detachment withdraws and the Texian side retains the cannon. It does not depend on how many players help, remain home or arrive late. See stable claims `HIST-GONZ-001` through `HIST-GONZ-006` in [HISTORY.md](HISTORY.md).

The launched default advances 20 fictional minutes per one-second server tick. The sequence's within-day timing and travel duration are deliberately simplified. Assuming uninterrupted default stepping, the thin slice reaches its preservation stop after approximately **4 minutes 44 seconds**. This is not the intended full game's approximately 45-minute classroom duration.

| Sequence point | Elapsed fictional minutes | Approximate default elapsed runtime |
| --- | ---: | ---: |
| First household hears the cannon situation | 600 | 0:30 |
| Initial news becomes public | 1440 | 1:12 |
| People gather | 3000 | 2:30 |
| Texian approach / request closes | 4680 | 3:54 |
| Brief exchange | 4760 | 3:58 |
| Mexican withdrawal | 4840 | 4:02 |
| Historical outcome / eligible help consequence | 4920 | 4:06 |
| Public outcome / Host reconstruction | 5400 | 4:30 |
| Slice stops with state preserved | 5680 | 4:44 |

These are prototype pacing values, not documented times of day or performance promises. Pauses and processing delays lengthen runtime. The interface shows a historical date derived from September 29, 1835 plus elapsed fictional minutes; the approach is dated October 2. Report ages still explain how long news took to arrive and how old its observation is.

Households with a member at Gonzales can see the gathering and simple approach, exchange, withdrawal and resolution. The opposing formations consist of actual small drawn people generated from aggregate formation state. There is no tactical army-control game and no gore.

When outcome news later becomes public, the Host automatically changes focus and presents a clearly labeled delayed educational reconstruction using stored battle-phase samples. The teacher does not trigger Gonzales or move the camera through a presentation. This is a minimal public regional view plus reconstruction; a sophisticated Host Director, narration, sound and full debrief remain later work.

## Preserving the story

Refresh or a temporary disconnect returns a browser with its existing credential to the same household and current world. The server checkpoints successful state changes, including travel, knowledge, property, request choices, relationships and memory. A save failure visibly pauses the live class; it does not silently discard a successful-looking consequence. Operational limits and recovery steps are in [docs/RECOVERY.md](docs/RECOVERY.md).

The separate time-compression foundation summarizes routine life while preserving unresolved travel/service, borrowed or absent property, relationships and aging knowledge. Registered important moments and significant help/service arrival interrupt a jump so live play can show them. Compression creates no surprise principal death, capture or severe injury. It is currently a developer/test primitive, not a student button or automatic later-chapter system.

At the end of this slice the game stops advancing and retains the world. Thomas may still be away; the wagon and ox stay where they actually are; memories remain. That stop is a prototype boundary, not a fictional end to the Revolution. There is no inventory reset, automatic return home, final omniscient revelation or polished household epilogue yet.

## What Claude should expand carefully

The next work should deepen the interaction of the existing systems: researched geography and plausible travel, richer local visibility, meaningful noncombat opportunities, representative researched households, balancing and accessible classroom controls. Preserve the household perspective and valid refusal while doing so.

Later historical arcs, mature social/economic simulation, diverse household archetypes, full autonomous pacing over 45 minutes, final art/audio, complete migration/recovery tools, Runaway Scrape payoff and the ending's deterministic epilogues/revelation are not implemented. Independent physical-device LAN and district-network acceptance are also outstanding. Use [TECH.md](TECH.md) for the implementation seams and [HANDOFF.md](HANDOFF.md) for the next concrete tasks and actual test evidence.
