# Money, glory, and the end of the game

**Status: decided; money (steps 1–2) and hidden glory (step 3) built 2026-09-12** ([money](evidence/money.json),
[glory](evidence/glory-hidden.json)). The ending (steps 4–5) built 2026-09-16 ([tests and drills](evidence/ending.json), [browser](evidence/ending-browser.json)); see §7.1. **The balance gate in §8 cannot be measured yet** — §7.1 says why. The owner has made every design decision it needs (§6); read
it in full before starting any of the rest.

**Where it sits in the plan.** Steps 1–2 (§7) belong to Macro-Phase 1D, economy. Steps 3–5
belong to 3A, epilogue and revelation, but step 3 — glory, hidden — should land as soon as
the Gonzales slice can end, so that every event built after it writes glory as it is built
rather than being retrofitted. Balance is 3E.

---

## 1. What the owner asked for

> "i do want money. players should have to trade or spend money. winning the game at the
> end will be through a combination of who has the most money, multiplied by glory. glory
> will be attained by participating in major historical events. glory will be a hidden stat
> that players don't see. it's revealed at the end of the game."
>
> — 2026-09-12

Three things, and they are separable. **Money** is a resource and a medium of exchange.
**Glory** is a hidden measure of how far a household took part in what happened. **The
ending** multiplies them and names a winner.

---

## 2. This amends VISION.md, and the amendment is recorded there

`VISION.md` §20 said "No rankings. No 'best patriot.'", and §11 forbids "hidden rewards for
compliance". A hidden stat earned by taking part in historical events, multiplied into a
score that decides who wins, is both of those by the letter. **The owner changed the
constitution on 2026-09-12**, and the amendment is written into §20 and noted in §11 of
`VISION.md` itself, dated and attributed. `CLAUDE_DEVELOPMENT_ROADMAP.md` 1D, 3A and 3E, the
`HIST-GONZ-022` implication in `HISTORY.md`, `GAME.md`, `TECH.md` and `HANDOFF.md` were
updated the same day. If any of those still forbids this, the amendment was lost — stop and
ask.

### What the old rules were protecting, and how this design keeps it

The two rules existed to stop one specific failure: a class learning that *the right answer
was to join the fight*, and a child who kept their family home being shown, at the end, that
they lost. That is also bad history — most families did not fight, §8 says "a family that
sends nobody to battle should still be capable of a compelling story", and the Runaway Scrape
depends on it being true.

Three decisions below keep that failure out while delivering exactly what was asked:

1. **Glory comes from participation of every kind**, weighted so that fighting counts for
   more than supporting (§4). A family that never fired a shot still earns glory.
2. **Glory multiplies money and cannot erase it**: `max(money, 1) × (1 + glory)` (§5; the floor of one real is the owner's amendment of 2026-09-16). A family that
   stayed home and prospered finishes with a real number.
3. **Fighting costs money.** Every day somebody is at the camp or the battle is a day they are
   not working the farm, and powder spent on the fight is powder not sold or hunted with. The
   two halves of the formula pull against each other. **Owner decision, 2026-09-12: a family
   that never fights can win, but it should be difficult.** Fighting is meant to be the
   stronger road to first place; staying home is a harder one, and it must stay a road.

---

## 3. Money

### What it is

**Reales.** `HIST-GONZ-023`, DOCUMENTED from TSHA: coin was so scarce in Mexican Texas that Juan
Almonte reported in 1834 not ten transactions in a hundred used it, and the coin that circulated
included Spanish eight-real pieces, cut for change. A household deals in whole reales.

**As built (prices are `FIC-GONZ-022`, invented):** every family starts with none. At the store
counter a whole bale of cotton fetches 2 food or 1 real, and 3 food fetch 1 real; powder costs 2
food or 1 real and seed 3 food or 1 real; a new hoe is **coin only**, 2 reales. The counter asks
how to pay or be paid, in the same shape as every other decision; nobody answering pays the first
way the family can. The store would rather barter than pay out coin, which is the scarcity showing
in the prices. **The store's purse is limited** (owner's choice, 2026-09-12): Marta Ibarra holds 2 reales
a family, pays out no more than she holds — what she cannot pay for comes home again — and coin paid
to her goes back into the purse. A family finds out she is short at the counter, not before.

### Money is scarce, and players have to use it

`HIST-GONZ-022` records that hard coin was scarce enough on this frontier that **barter was the
ordinary way of doing business**, and that small denominations were the scarcest. The owner
also said players "should have to trade or spend money". Both hold at once:

- **Money is necessary for something real.** At least one purchase a family will want — a new
  hoe, or powder and shot beyond a small ration — is priced in coin at the store, so money is a
  medium a family must deal in, not decoration.
- **Barter does not disappear.** The store still takes cotton for food, and neighbours still
  trade seed for powder. The daily farm loop — plant, harvest, eat, trade with a neighbour,
  answer the call — never requires a coin.
- **Spending is a real cost, because money is half the ending.** A family choosing to buy
  powder is choosing against its final number. That tension is the mechanic.
- **Prices should feel dear.** Round to whole reales; a resource that needs decimals produces
  "you have 3.7 reales" in front of a twelve-year-old.

### Where it comes from, and what it is for

| Source | Note |
| --- | --- |
| Selling cotton at the store for coin instead of food | The main one. A choice at the counter: food now, or coin. |
| Selling surplus food | A family with more than it eats has something the town wants. |
| Trading with a neighbour | Coin is one of the `GOODS`, so it changes hands face to face like anything else. |
| Work for somebody else | Held. It needs wages, employers and a labour model, and none exist. |

| Sink | Note |
| --- | --- |
| Powder, seed, a new hoe | Some priced in coin only, some in coin *or* goods (see above). |
| Hiring a neighbour's wagon | Only once lending exists. |
| A new horse | Owner, 2026-09-12: a horse taken into a battle where people died can die, and the family goes without or buys another. Needs a horse for sale in town and a price (`FIC-GONZ-022`), and the battle itself; see `docs/FAMILY_CREATION.md` §5. |
| Later chapters | The Runaway Scrape is the obvious one: coin is what a fleeing family can carry. |

### What counts as "money" at the end

**Default: coin on hand when the class ends.** Goods, crops, land and livestock do not count.
That is the owner's word — "who has the most money" — and it gives the ending a decision of its
own: a family can sell its stores for coin before the end, and in the later chapters a family
fleeing with coin is better placed than one fleeing with a barn full of corn, which is true.
The alternative, net worth at the store's prices, is gentler on a family that bartered
everything; **change this only on the owner's say-so.**

### Implementation notes

- `household.resources.money` — absent reads as none, which is correct for every class saved
  before this. **No save version moves**; `sim/trade.mjs` and the powder work are the worked
  examples.
- Add it to `GOODS` in `sim/trade.mjs` so neighbours can trade in it.
- It is **not** hidden. It shows in the supplies line beside food, seed, powder and cotton.
- **Retire the tripwire deliberately.** `tests/store.test.mjs` asserts *"there is no money in
  it"* — no household resource and no tradeable good named for a currency — precisely so this
  change could not happen by accident. Step 1 replaces that test with one asserting money is
  whole reales and barter still works. The comments that say money was declined, in
  `sim/chores.mjs` (the store rate) and at the top of `tests/store.test.mjs`, change with it.

---

## 4. Glory

### What it is

A whole number per household counting how far that family took part in major historical
events. It is **not** a score for virtue, patriotism or obedience, and nothing in the interface
may call it any of those.

### It must be genuinely hidden until the end

This is the part most likely to be got wrong, and it is testable.

- **It never appears in `projectWorld` for a student before the ending** — not as a number, a
  label, a rank, a "your family is doing well" hint, or by inference from an event's wording.
- **The Host does not show it before the ending either.** The Host is projected in front of the
  class and reflects public knowledge (`VISION.md` §18).
- **Events that cause glory are visible; the counting is not.** A family knows it carried food
  to Gonzales. No event, choice label or cost line may say that something "was worth
  something", and no answer may be labelled by the glory it would earn.
- **Nothing reads glory to decide what to offer.** The directors write it and never consult it.
  §11's question stays "What pressures exist in this place right now?", never "Has this student
  participated enough?" — a director that offered more to a family with less glory would be
  exactly that question.
- Copy the existing wire-isolation tests: `tests/trade.test.mjs` and
  `scripts/relay-browser-proof.mjs` assert a thing the server knows never reaches a client by
  searching the serialised payload. Plant a distinctive glory value and assert it appears in
  **no** student or Host payload at any tick across a whole played slice, then assert it does
  appear once the ending is reached.

### How it is earned — every kind of participation, fighting weighted highest

**Owner decision, 2026-09-12: both, weighted.** Every kind of taking part counts, and taking part
in the fighting counts for more than supporting it. Every number below is invented and becomes a
`FIC-GONZ-*` claim when built; the tiers are the decision, the values are a starting point for 3E.

| Tier | Earned by | Suggested weight | Already modelled? |
| --- | --- | --- | --- |
| Support | Answering the call and carrying food or powder to Gonzales | 1 | Yes — `handleChoice` in `sim/directors.mjs` |
| Support | Carrying word onward that reached another family | 1 | Yes — the relay chain in `sim/world.mjs` |
| Support | Helping a neighbour who asked; sheltering or feeding another household | 1 | Partly — trading exists; asking and sheltering need later work |
| Present | Being where a documented event happened when it happened | 2 | Yes — `witnessing()` in `sim/directors.mjs` |
| Present | Going upriver to the camp | 2 | Yes — `handleMarch` |
| Fighting | A family member taking part in a battle | 3 | Partly — `world.participation.gonzales` records `supplied` and `present` per person (2026-09-12); nobody fights at Gonzales, so `fought` waits for a later battle |

Rules that apply to every row:

- **Only major historical events earn glory**, meaning events registered as `HIST-GONZ-*` (and
  later arcs' equivalents). Farm work, hunting and ordinary trade never do.
- **Weight by what it cost the family, as well as by tier.** A household nineteen miles out that
  walked its food in did more than one two miles out, and the code already knows both distances.
- **A casualty never adds glory.** A family member hurt, captured or lost earns the household
  exactly what their participation earned and nothing more. The ending presents that with
  dignity and never as a reward for a death.
- **Once per person per event.** Sending the same person back and forth does not farm glory.
- **Fighting should be the stronger strategy, never the only one.** A family that never fights
  winning should be difficult, not impossible. The balance gate in §8 is the check.

### A woman sent to fight — owner decision, 2026-09-14, built at Concepción 2026-09-16

**As built** (`fightConcepcion` in `sim/army.mjs`, `docs/COLONIES.md` §6i): the owner chose on 2026-09-16 to keep the penalty
and label it as the game's own reading, since no source read documents it (`HIST-TEX-023`). A woman killed in the fight has
her award taken away twice over, with the note shown in the ending; one who comes through keeps her ordinary award. At
Concepción every fate resolves in the fight, so the unresolved case does not yet arise. A family's glory below nothing
counts as nothing in the final number, so the coin is never erased.

> "if a family sends a woman to battle, they should receive - glory. it wouldn't have been socially or culturally
> acceptable. if the woman dies, they should receive 2x - glory. if the woman survives battle however, they should
> receive full normal glory without any - points. glory is a hidden stat until the end of the game anyways."
>
> — 2026-09-14

| Question | Owner's answer, 2026-09-14 |
| --- | --- |
| How big is the penalty? | **What her part would have earned**: her part's weight times the distance multiplier, negative. |
| If she dies | **Twice that, negative.** |
| If she comes through a battle alive | **Her normal award, and no penalty.** |
| Which parts count | **Only fighting** (`fought`). Carrying supplies, being present and going to the camp earn ordinary glory for anybody. Nobody fights at Gonzales, so this first applies in the battles after October 2 (`docs/COLONIES.md`). |
| Her fate unresolved when the class ends | **The penalty stands.** Only coming through a battle alive clears it. |
| History | **Researched and registered as a claim**, and the reveal words it as the period's judgement of the family, never as the woman having done wrong: *"In 1835, sending a woman to fight was held against a family."* |

This amends one rule above: **a casualty never adds glory** still holds — a death here only ever takes more away.
The balance gate (§8) must be re-run once `fought` exists, because this makes sending a mother to fight both very
likely fatal (`docs/FAMILY_CREATION.md` §5) and costly. It is hidden like every other award, and a woman's
survival is decided by her hidden stats exactly as a man's is; the penalty never changes the odds.

**Automatic neighbours are never ranked** (owner, 2026-09-14, `docs/COLONIES.md` §5.9): when the ending is built it ranks only families with `household.played`; an automatic family's money and glory are counted but it is never named winner or placed in a ranking.

### Where it lives

**As built: `world.glory[householdId]`, not `household.glory`** — a household is projected to its own
student whole, so a field on it would have been on the wire. A whole number, absent reads as zero,
written only by `sim/glory.mjs` from `world.participation`, never by anything a student triggers
directly. Weights as built: supplied 1, present 2, fought 3, times one more for every 15 road miles
from where it happened (`FIC-GONZ-023`). Record each award in the household's own event log with
its cause, flagged so the projection strips it until the ending — that record is what the reveal
explains.

---

## 5. The ending

### The formula

**Owner decision, 2026-09-12:**

```
final = max(money, 1) × (1 + glory)
```

A household with no glory keeps its money.

**Amended by the owner, 2026-09-16:**

> "families with zero coin should be treated as if they have one coin so glory has something to multiply."

The formula as first written finished a household with no money at zero whatever its glory. Built, that was the common case: a family that sent its man to the army and sold nothing finished at 0, and a class where nobody sold for coin tied every family at 0 (§7.1). Now a household with no coin is counted as holding one real, so its glory multiplies something. The floor lifts nobody who holds a real or more, and the ending says the real was counted rather than implying the family had it.

### What each family sees

At the end the fog lifts (`VISION.md` §20) and each family sees, for the first time:

1. **Its own money and its own glory, with what earned each** — drawn from that household's own
   event log, the same log the epilogue is built from.
2. **Its final number**, with the multiplication shown, never a bare total.

### What the Host shows — a named winner

**Owner decision, 2026-09-12: the Host names a winner.**

- Every family's money, glory and final number, **listed in household order** — the three
  numbers are visible for everyone, but the screen is not a sorted leaderboard.
- **The family with the highest final number is named as the winner.** A tie names every family
  that shares it.
- Beside it, §20's discussion hooks: *why* these families ended up so differently — who heard
  news first, who lived far out, who stayed to farm and who went. The numbers are the way into
  that conversation, not the end of it.
- **Name the winner, never a virtue.** "Family 7 finished first" is a fact. "Most patriotic",
  "bravest" or "best patriot" is a judgement, and the last is the phrase the constitution still
  forbids by name.

---

## 6. Decisions, all made

| Question | Owner's answer, 2026-09-12 |
| --- | --- |
| Is there money? | Yes. Players have to trade or spend it. |
| How is the winner decided? | Most money, multiplied by glory. |
| Is glory visible? | No. Hidden from players until the end, then revealed. |
| What earns glory? | Participating in major historical events — **every kind, with fighting weighted above supporting**. |
| A family with no glory? | **`money × (1 + glory)`** — glory multiplies money and cannot erase it. |
| A family with no coin? | **Counted as holding one real** (owner, 2026-09-16), so glory has something to multiply. |
| How is the result shown? | **The Host names a winner**, showing every family's money, glory and final number. |
| Can a family that never fights win? | **Yes, but it should be difficult.** |
| What counts as money at the end? | Not asked. Default is coin on hand (§3); change only on the owner's say-so. |

---

## 7. Build order

Bounded steps, each shippable and provable alone, in order. This mirrors
`docs/LIVING_INFORMATION.md`: each step is worth having even if the next never happens.

1. ~~**Money as a resource.**~~ **Done 2026-09-12.** `household.resources.money`, in `GOODS`, in the supplies line,
   tradeable between neighbours. Nothing earns or spends it yet. Replace the no-money tripwire
   in `tests/store.test.mjs`. Prove: save compatibility, no version bump, and a class that never
   sees a coin plays exactly as before.
2. ~~**The store deals in coin.**~~ **Done 2026-09-12**, with the prices above. Selling cotton or surplus offers food *or* reales; some purchases
   take coin only, others coin or goods. Register the currency `HIST-GONZ-*` claim and the prices
   as a `FIC-GONZ-*` claim. Prove: a family can farm, eat, trade and answer the call without coin,
   and a family with coin has something only coin buys.
3. ~~**Glory, hidden.**~~ **Done 2026-09-12.** The awards, the directors that write them, the causes in the event log, and
   the isolation test — **before anything reveals it**. Prove: a planted glory value appears in no
   student or Host payload across a played slice, and no director reads it.
4. ~~**The ending, per family.**~~ **Done 2026-09-16** (§7.1). The reveal, both numbers, the multiplication, the per-household
   causes. Prove: a household that stayed home and sold its cotton finishes with a non-zero number
   and an epilogue that reads as a story.
5. ~~**The Host's closing view.**~~ **Done 2026-09-16** (§7.1). Every family's three numbers, the named winner, ties, and the
   discussion hooks. Prove: no virtue word appears anywhere on it.

---

### 7.1 As built: the ending (2026-09-16)

`sim/ending.mjs` and `public/ending.js`; claim `FIC-GONZ-035`. Tests `tests/ending.test.mjs` (six, fourteen injected regressions each caught), browser proof `npm run test:ending`.

**When.** The ending exists when `world.status` is `'ended'` — the slice preserving itself, or the teacher ending the session — and not a moment before. `endingProjection` is the one gate: before it `projectWorld` carries no `ending` key at all, and a paused class has not ended. Glory stays sealed everywhere else: the sealed award events are still dropped from the log, and the ending carries the awards in words instead.

**A family sees** its coin, its glory and its final number; the multiplication written out (`5 reales × (1 + 16 glory) = 85`, or with no coin `0 reales, counted as 1 real × (1 + 16 glory) = 17`); a short story — how many road miles it lived from Gonzales, the day word of the cannon reached it, and, if nobody went, that they stayed with the land; every sale, payment and trade that moved coin, dated, with the amount; and every award, dated, as a sentence (*Cipriano was there for the army made at Gonzales, 115 road miles from home.*). It sees nobody else's numbers. It can close the ending to look at the map and open it again.

**The Host sees** every family in household order — never sorted — with road miles from Gonzales, the day it heard, who went, coin, glory and final number; the family that finished first named in a sentence, and highlighted; *Final number = coin × (1 + glory). A family with no coin is counted as having 1 real.*; and four questions for the class. A tie names every family level on the highest number. A family nobody played is shown with its numbers and marked, and is never named first (owner, 2026-09-14).

**Where coin went.** Every event that moves coin now carries `coin` (a signed whole number): a sale at the store, a payment in town (a new event, *X paid 2 reales in town.*, since paying had no line of its own), and each side of a trade. Nothing projected changes shape; the field is read only by the ending. A class saved before this has untagged events and shows fewer lines, never a wrong number: the number is the coin in the house.

**No virtue words.** The test and the browser proof search every string on both screens for good, better, best, brave, loyal, patriot, hero, virtue, honour, worthy, courage, coward, deserve, right and wrong.

**What it found, and what changed.** As first built, the browser proof's one family holding coin finished first at 5 and every family that sent somebody to the army finished at **0**, whatever its glory. Reported to the owner, who amended the formula the same day: no coin counts as one real (§5). The same class now finishes the volunteer's family first, `0 reales, counted as 1 real × (1 + 16 glory) = 17`, above the family holding 5 reales. Measured on three thirty-family classes with nobody playing: **no family ends with any coin or any glory at all**, because automatic neighbours neither sell for coin nor answer the call, so every family now finishes at 1. **The balance gate (§8, *winning without fighting is hard, not impossible*) still cannot be run until automatic families can earn both.** With the floor, it is now the other half of that gate that wants watching: a family that never fights needs more than a few reales to overtake one that did.

`ceiling:` the discussion questions are fixed text, not drawn from what this class did. `ceiling:` the tutorial card and the person's controls can still show behind the ending on a student's screen; they do nothing once the class has ended.

---

## 8. Gates

Nothing here is finished until all of these hold.

| Gate | What it means |
| --- | --- |
| Hidden means hidden | A planted glory value appears in no student and no Host payload at any tick before the ending, asserted by searching the serialised wire the way trade and relay isolation already are, and does appear once the ending is reached. |
| Nothing reads glory | No director or opportunity rule consults `household.glory`. |
| Money is used | At least one thing a family will want is bought only with coin. |
| Barter survives | A family that never touches coin can still plant, harvest, hunt, trade, answer the call and reach the end. |
| No annihilation | A household with zero glory finishes with its money intact (`money × 1`). |
| Winning without fighting is hard, not impossible | In 3E's headless runs at 5–30 players, households that send nobody to fight win **some** runs, and **well below their share of the class**; households that fight win more often than their share. If non-fighting households never win, or win as often as fighting ones, the weights are wrong. |
| Casualties earn nothing extra | A family member hurt, captured or lost adds no glory beyond their participation. |
| No virtue labels | Nothing in the interface, the epilogue or the Host view names a family good, loyal, brave or patriotic. |
| Save compatibility | A class saved before any of this opens, and no save version moves. Absent money reads as none; absent glory reads as zero. |
| Claims registered | Every weight, price and earning rule carries a `FIC-GONZ-*` id, and the currency a `HIST-GONZ-*` id with honest sourcing. |

---

## 9. What this must never become

- **A patriotism meter.** `VISION.md` §11 still forbids it, and this is the mechanic most likely to
  turn into one by accident.
- **A reason to repeat a request a family already refused.** §11: "a refusal should normally reduce
  repeated identical requests."
- **A number that leaks mid-class.** The value of hiding it is the reveal; a leak turns the afternoon
  into a scoreboard chase and changes every decision a student makes.
- **A replacement for the epilogue.** §20's epilogue is a story selected from causal threads. The
  numbers sit beside it.
