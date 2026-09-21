# Deployment foundation

Maturity: **PROTOTYPE**. This document describes the supported deployment direction and the remaining classroom acceptance work. Read `../HANDOFF.md` for the actual foundation test results and exact current test commands. A successful same-computer browser test must never be presented as a physical classroom-network test.

## What the deployment evidence means

| Evidence level | What it proves | What it does not prove | Status |
| --- | --- | --- | --- |
| Automated server/transport tests | Authority, identity, persistence, synchronization, and recovery under controlled inputs | Real browser behavior or traffic between computers | Results recorded in `../HANDOFF.md` |
| Five isolated browser contexts using the development computer's LAN address | Actual browser client behavior and the server listener on a non-loopback interface | Access-point forwarding, another device's policy, or Windows inbound treatment of remote traffic | Results recorded in `../HANDOFF.md` |
| Independent physical devices on an ordinary LAN | Reachability between computers, real disconnect/rejoin, browser behavior across those devices | District network policy or all 30 classroom clients | **NOT YET TESTED** |
| Actual district/school network and managed student devices | The intended teacher-to-student deployment path in the actual classroom | Other school sites or future policy changes | **NOT YET TESTED** — mandatory before classroom use |

The foundation brief allows development to continue without district access. It does not make same-computer testing equivalent to a physical LAN trial. Keep the two remaining deployment checks visible in every readiness decision. Record a FAIL with the observed restriction when a trial fails; do not relabel an unavailable network as a pass.

## A package that came from the Internet

Windows marks every file unpacked from a downloaded zip as having come from the Internet, and PowerShell's `RemoteSigned` policy then refuses to load an unsigned script carrying that mark. The launcher used to fail at exactly that point, before it could write an error file, so the teacher saw a failure with no explanation — the failure mode that looks most like a blocked machine and is not one.

`Launch.vbs` now clears the mark on its own folder before it starts anything, which is the same thing as ticking **Unblock** on the zip by hand. `Bypass` is scoped to that one inline command; the launcher itself still runs under `RemoteSigned`, and an enforced school policy still overrides both. Reproduced with a real `Zone.Identifier` stream before the change (blocked) and after it (loads).

A teacher can still do it first, and it is one click: right-click the zip → Properties → tick **Unblock** → OK, then unpack.

## The setup program

`TexasRevolutionSetup.exe` is the same binary as the launcher, carrying the game inside it
as an embedded zip. Run from a folder with no classroom beside it, it is a setup program;
run from inside an installation, it is the launcher. That is why the payload it carries is
the **game and never the launcher**: the setup copies *itself* into place once it has
unpacked, so .NET is downloaded once rather than twice. A download of 136 MB becomes an
installation of about 267 MB, the difference being that the installed copy still carries its
own payload — which is also what lets a teacher copy that one exe onto a memory stick and
install it on the next machine.

It installs per-user, under `%LOCALAPPDATA%\Programs\TexasRevolution`: no administrator, no
Program Files, no UAC prompt, and nothing a managed machine is likely to refuse. It registers
under `HKCU` so it appears in Settings ▸ Apps with a working uninstall entry. Installing over
an existing copy replaces the files and never touches `data`, so a teacher keeps every class
they have saved.

**Not signed.** SmartScreen will show *"Windows protected your PC"* on first run, and a
teacher has to choose **More info ▸ Run anyway**. That is the same class of obstacle as the
Mark of the Web and it has the same cause: nobody has paid for a certificate. It should be
expected rather than discovered in front of a room.

```powershell
.\TexasRevolutionSetup.exe --install "C:\path" --desktop   # silent, with shortcuts
.\TexasRevolutionSetup.exe --extract "C:\path"             # unpack only, registers nothing
.\TexasRevolution.exe --uninstall                          # asks about saved classes first
```

## The launcher application

`TexasRevolution.exe` is a small WinForms application in the package root. It does not
reimplement starting or stopping the classroom: it drives `scripts/launch.ps1` and
`scripts/stop.ps1`, which already authenticate with the private Host credential, checkpoint
and pause the class, and wait rather than ending the process. A second copy of that protocol
would be a second thing to get wrong.

It is self-contained — about 60 MB of .NET inside the exe — so it needs no runtime installed
and no administrator. That is the whole reason for the size: a school machine may have
neither. The presentation window is WebView2, which Windows 11 already ships, rather than a
bundled browser.

The class code and the number of households joined are read by **authenticating as the Host**
with the credential the running server wrote to its own data folder - not from an open
endpoint. The code is shown on a projector, but this document is explicit that Host
information must not become available because somebody guessed a route, and the launcher has
no more right to widen that than anything else does. It is on the same machine and reads the
same file the teacher's browser was given; that is the whole of its privilege.

It also recognises one failure and explains it in words: a save lock left behind by a power
cut or a force-quit. It never clears one. The lock exists to stop two servers writing one
class, and an application that quietly removed its own safety catch whenever it was
inconvenient would be no safety catch at all; [recovery](RECOVERY.md) owns that procedure,
and it checks the owning process and backs the save up first.

**Headless use, for a support person or a script:**

```powershell
.\TexasRevolution.exe --status
.\TexasRevolution.exe --start
.\TexasRevolution.exe --stop
.\TexasRevolution.exe --check-updates
.\TexasRevolution.exe --solo            # Solo Mode: start or reuse, new game, print its address
.\TexasRevolution.exe --stop-solo
.\TexasRevolution.exe --install-update <TexasRevolutionSetup.exe or update .zip> [--no-restart]
```

These call exactly the code the buttons call. One caveat found by measuring: do not capture
the output of `--start` (or `--solo`). The server it leaves running inherits the console handle,
so a parent that redirects and waits will wait for the whole lesson. Ask `--status` instead.

### The window's face — 2026-09-20

Owner, 2026-09-20: *"use this image to update the launcher and how it looks"*, with a mockup of the window they
wanted, and then the art for it the same day — a title painting and eight cast button plates. The window is now a
painting with things drawn on it rather than a stack of grey boxes. **No function moved, and none was lost**: start
and stop, the class view, a player window, the two copies, Play Solo, updates, the progress bar, the notice line and
the uninstall link are all still there and all still do exactly what they did.

**Where the art lives.** `launcher/art/` — `background.png` (1086 × 1448) and ten `button-*.png` (2172 × 724 each,
except the stop sign at 1774 × 887 and the update badge at 1536 × 1024). Every one is an **`<EmbeddedResource>`** in `TexasRevolution.Launcher.csproj`, read from
the assembly's manifest stream exactly as `Branding.cs` reads the emblem. That is not a preference. The launcher
updates *itself*: `Updater.cs` downloads the release's setup program and `UpdateSwap` puts the new **single
executable** in place of the old one, so art left as loose files beside the exe would survive an install and vanish on
the first *update* — and nobody would find out until a classroom did. The cost is the download: the self-contained
setup is **79.5 MB** where it was about 62 MB, and roughly 19 MB of that is the new art. Proved by publishing the way
`scripts/package.ps1` does, copying the one exe into a temporary folder with none of the repository beside it, and
opening it: the painting and all eight plates were there.

**The painting is cropped, never squashed** (`launcher/TitleScene.cs`). It is 3:4 and the window is taller and
narrower, so it is scaled to cover and the overflow is cut, anchored 36% down — everything worth seeing is in the top
half and what is lost is foreground grass. Over it go two washes, dark from the top and dark from the bottom, because
the painting is pale parchment at the top left and dark cloud at the top right, and cream lettering laid straight on
it would read against one half and vanish against the other. The scene is rendered once to a bitmap the size of the
client area, and **every control paints its own slice of that bitmap behind itself** (`Scene.Backdrop`): WinForms has
no real transparency, and `BackColor = Transparent` half-works over a custom-painted parent, which is worse than not
working.

**The plates keep their own shape.** A straight plate is 5.47 wide to 1 tall; the stop sign is 2.55 to 1, because its
torn flag hangs off the left end. The layout works out one width that makes the whole column fit the window and gives
each plate its own height from that, so nothing is stretched. At start-up each plate is trimmed to the sign, resampled
once to 1600 pixels wide, and its black field **flooded away from the edge inwards** so the chamfered corners and the
torn flag sit on the painting rather than in a black box (`launcher/PlateArt.cs`). The threshold is per picture and
was measured, not guessed: the seven straight plates lie on textured dark stone no brighter than their own darkest
interior, so their flood is held to the near-black that only appears in the corners; the stop sign lies on pure black
while its darkest weathered red is luminance 19, so it is flooded harder. **Flooding the stop sign at the straight
plates' threshold was what made the owner report "I can sort of see through it"** — the flood crept through the sign's
dark veins and the one-pixel softening pass then took most of the red field down to about two-thirds opacity.
Border-flooding, not colour-keying, is what keeps a dark patch *inside* a sign opaque.

The one exception is **`button-update-available.png`**, which the owner delivered as RGBA with a real alpha channel.
It is cut to what its own alpha covers and composited as it is: no flood, no key, `FloodBelow` of 0 in
`PlateArt.Cuts`. Flooding it would eat the darks in its red field for no gain, because its shape is already in the
file. It is the state, not the action: "Check for updates" keeps its slate plate for the ordinary case, and the same
button wears the badge once `Updates.LatestAsync` has found a newer release, so a teacher opening the launcher sees
at a glance that there is something to take. Its roundel and exclamation mark overhang its left edge, so its row gets
80% of the column's width and the overhang hangs into the margin, exactly as the stop sign's flag does. Because the
badge is nearly twice as tall as the plate it replaces, the column's width is worked out from the plates the window
is *actually carrying* rather than from a constant — which is why every plate shrinks a little the moment an update
appears, and then holds that size.

**A plate that does not apply is not on the window.** Owner: *"there's no reason for us to see the greyed out plates
when they're not being used... Have them appear and disappear (expand and condense) instead."* The four that need a
running class — the class view, a player window and the two copies — are absent until one is running and expand into
place over about a fifth of a second as it starts; the primary plate swaps *Start the class* for the *Stop the class*
sign. The distinction that matters is **does not apply yet** against **busy for a moment**: while the server is
starting, or an update is installing, the plates already on screen stay exactly where they are and simply stop
answering, because a window that rearranges itself under a teacher's hand mid-click is worse than a button that waits.
The column's size is worked out from the running state, the one with the most on it, and then held, so a plate never
changes size as plates come and go. The movement follows `SystemInformation.UIEffectsEnabled`; with effects off it is
a plain show and hide. Keyboard focus never lands on a plate that is not on the window.

**Size.** Owner: *"Looked better when it was bigger."* The window takes nine tenths of the working area's height on
the screen it opens on and derives its width from that, in the proportion the layout was drawn in; on a 4K panel at
150% that is about 610 × 1240 ordinary pixels. Every measurement on the window — the masthead's face, the rules, the
class code, the plates, the gaps — is a share of the window's width, so a bigger window is the same window bigger and
not the same furniture with more painting round it. It is clamped to the desk space Windows reports and never grows
off the bottom of the screen, and below about 780 ordinary pixels of height the masthead gives its room back to the
plates. The size and place a teacher leaves it at are kept as four numbers in
`%LOCALAPPDATA%\TexasRevolution\window.txt`, which the uninstall already removes with the rest of that folder; a
remembered place on a monitor that has since been unplugged is ignored.

**Nothing about how it looks may put a dialog in front of a teacher.** `TitleScene`, `PlateArt` and `Branding` each
return null rather than throw, and a window with no art is a plain coloured one with drawn plates that still works.
Under that, every custom paint swallows rather than bubbles — a paint that throws throws again on the very next
paint, which is a stream of Windows error dialogs — and `Program.Main` catches what is left and appends it to
`data/launcher-error.txt`, where [recovery](RECOVERY.md) already looks. This was not hypothetical: an early version of
this work read `Control.Font` back and disposed whatever came out, which the first time round disposes
`Control.DefaultFont` — a static shared with every control in the process, including the dialog WinForms puts up when
something goes wrong, so the failure it caused was the failure it then could not report. The owner saw those dialogs.

**Evidence, on this computer only** (`docs/evidence/launcher/`): `launcher-stopped.png` and `launcher-running.png`,
both taken from the packaged single executable running in a temporary folder with no `art` directory beside it;
`launcher-laptop-height.png`, the running window squeezed to 704 pixels tall — what a 1366 × 768 panel leaves — with
all seven plates, the notice and the uninstall link still on it; and `launcher-keyboard-focus.png`, two tabs from the
top, showing the gold focus ring on a plate. High-DPI was exercised by moving the window between a 150% monitor and a
100% one, which re-fits it. `ceiling:` it is not proved on a real 1366 × 768 machine, only by squeezing the window to
that height on this one, and `scripts/verify-launcher.ps1` tests the launch protocol rather than the window, so none
of the above is held by a gate.

### Uninstalling from the launcher, and a launcher older than its game — 2026-09-17

**Uninstall Texas Revolution…**, in small text at the bottom of the launcher (owner: *"an uninstall button that remove
everything that the game installed"*), runs the same `--uninstall` that Settings ▸ Apps runs, in a process of its own
with `--after <launcher pid>`: it asks first (Cancel is the default button, so a stray Enter removes nothing), asks
whether to keep saved classes if there are any (Yes keeps them), stops the class and Play Solo, and the launcher closes so
its folder can go. It removes the installed folder, the Start menu and desktop shortcuts, the Add/Remove entry, and what
the game leaves outside its folder: `%LOCALAPPDATA%TexasRevolution` (the install stamp, and the class data if it fell
back there and was not kept), the class view's browser profile `%TEMP%TexasRevolutionView`, the update download folder
`%TEMP%TexasRevolutionUpdate`, the files .NET unpacks for the single-file program `%TEMP%.netTexasRevolution`, and
the launch logs `%TEMP%	exas-*.log`.

The setup is now stamped with its release tag (`-p:InformationalVersion=<tag>` in `scripts/package.ps1`). When the
launcher's tag and the game's `release.txt` differ, the release line reads *Release v… · launcher v…* and the launcher
says to download the setup again and choose Update. Found 2026-09-17: the owner's second computer showed *Release
v2026.09.17.2* with no Solo Mode button - new game files beside a launcher from before 2026-09-16, which could only ever
update the game (see *Updating, launcher included*). A launcher from before this release cannot show the warning.

Proved on this computer only, against a scratch copy with the real install's shortcuts backed up and restored: the
release's setup unpacked and its launcher showed Play Solo; a launcher stamped with another tag showed the warning; the
link started `--uninstall --after`, and after OK the launcher closed and the folder, the shortcuts, the stamp and the
view profile were gone. `ceiling:` the Cancel path and the keep-classes question were not driven to completion by UI
automation (the automated presses did not find the message box's buttons); both are the unchanged dialogs Settings ▸ Apps
already used, with Cancel now the default.

## Solo Mode (playtesting)

**Saved games, 2026-09-17.** Owner: *"When pressing Solo Game, a popup should ask if the player wants to start a new game, or
continue an old one. they can't continue a multiplayer game from there."* By multiple choice, a list of every saved solo game.
Every solo game is kept in `data/solo/games/<session>.json`: written when another game takes its place, and when the solo
server starts over a game left in its live save (`server/main.mjs`). **Play Solo** starts the server, asks it for the list
(`POST /api/solo/games` with the solo Host key), and, if there is any, asks **New game** or **Continue** with the newest
selected (`launcher/SoloGameDialog.cs`); Continue reopens that game where it was left (`POST /api/solo` with `continue`),
a paused game running again. Only solo games are in that folder, so a class cannot be continued from here. Headless:
`TexasRevolution.exe --solo --list` and `--solo --continue <id>`. Proved: `tests/solo.test.mjs`;
on this computer the built launcher against a scratch data folder dealt two games, listed three (one kept from the live
save at start), continued the oldest on its own date, and after a stop and restart listed it again, paused. `ceiling:` the
dialog itself is not driven by UI automation.

**Deleting one, 2026-09-21.** Owner: *"I need a way to delete solo games"*, and asked where it should live: *"When I click
Play Solo a menu appears. This menu has the saves. That's where a little trash can emblem should appear and let me delete
the save."* So each row of that list carries a trash can at the end of it. Pressing it asks once, naming the family, and
says where the game goes; the server then **sets it aside** rather than destroying it (`POST /api/solo/games/delete` with
the solo Host key → `deleteSoloGame` in `server/app.mjs`). The file moves to `data/solo/games/deleted/`, which the listing
never reads — it takes only `*.json` from `games/` itself — so a game deleted by a mis-click is still on the disk and can
be put back by hand.

The game the server is **holding** is not a special case, by the owner's decision: deleting it sets its state aside and
the server goes on holding the world until something replaces it. What makes it leave the list is that the listing drops
any id with a file in `deleted/` — the live game is listed from memory rather than from a file, so there has to be
somewhere the listing can look, and that also survives a restart where a note kept in memory would not.

Proved: `tests/solo.test.mjs` (four tests) and [`evidence/solo-games-injections.json`](evidence/solo-games-injections.json)
— **8 of 8 caught**, with two more recorded as *not provable over HTTP*: the `if (!solo)` guards inside `soloGames` and
`deleteSoloGame` are second locks on a door the route already bolts, so removing one changes nothing a test can see. They
are kept as defence in depth and the record says why they cannot be shown to matter. `ceiling:` a deleted game that is
still the one being held is written to `games/` again next time another game replaces it; the file set aside keeps it out
of the list, and what is left behind is one file's worth of disk. **Not proved:** the trash can was never *clicked* by a
test — the dialog is drawn to a picture ([`evidence/solo-dialog.png`](evidence/solo-dialog.png), by
`scripts/solo-dialog-shot`) and read by eye. The hit region, the confirmation and the row disappearing are held up by
nothing but that picture and the server's own tests.


**Play Solo** on the launcher is for the owner trying the game, not for a class. One
click starts a solo server if none is running (or reuses it), deals a **fresh game**, joins one
player, rolls that family, starts the class, and opens that player's page **already joined** in
a window of its own. No class code, no join form, no Host Start. The other families of the class
are there as automatic neighbours, exactly as in a class nobody else joined. The window has
**Class view** (the solo Host page, for inspecting what the teacher would see), **New solo game**,
and developer tools. Closing the launcher stops a solo server it started, through the same
graceful stop as a class.

It cannot disturb a real class, by construction rather than by care:

- **Its own folder:** `<class data folder>\solo\` — its own `classroom.json`, save lock,
  `host-url.txt`, logs and launcher record (`soloPaths` in `server/deployment.mjs`). `SAVE_PATH`
  and `PORT` are deliberately ignored, because both are overrides for the real class.
- **Its own port:** 1836 (`SOLO_PORT` to change it), so a class running on 1835 is left running
  rather than having to be stopped first.
- **This computer only:** `server/main.mjs --solo` binds `127.0.0.1`, the classroom refuses to
  listen anywhere else when `solo` is set, and it answers no request from a non-loopback address.
  It advertises no join address.
- **Only a solo server has the door.** `POST /api/solo` (with the solo Host key, read from its
  own `host-url.txt`) and `GET /solo/enter?ticket=` exist only on a classroom created with
  `solo: true`. The ticket is one use and lasts two minutes; it becomes the player's cookie and
  redirects to `/`, so no credential is left in the address bar.

**On the real land, the whole game.** A solo game (and a class started from the launcher) is dealt on the real land of
the colonies (`MAP` unset means `colonies` since 2026-09-16; `MAP=gonzales` still starts the invented country). It has
to be: the winter and the spring only continue there, and until that day a solo playtest dealt the invented Gonzales
country and could never reach either. The **Class view** is where the game is continued into the winter and the spring
(*Continue to the winter of 1836*, then *Resume*), exactly as a teacher continues a class. `npm run test:solo-game` plays
one solo game from its dealt start to the road home through all three periods and then deals the next; it also starts
`server/main.mjs --solo` for real and checks what it deals.

ceiling: every Play Solo is a new game, and the last solo game is not archived or offered back;
a solo save is a scratch pad. "Continue the last solo game" would be reopening the same save.

For development without the launcher: `npm run solo` (add `-- --no-open` to print instead of
opening a browser). It starts `server/main.mjs --solo` in the terminal (Ctrl+C stops it) or
reuses one already answering, deals a new game and opens the play address. The solo Host address
is printed with it. `npm run test:solo` is the browser proof; `tests/solo.test.mjs` the server's.

## Updating, launcher included

Updating downloads the release's **setup program**, runs it with `--extract` into a staging
folder, checks that what it unpacked is a Texas Revolution build stamped with the release's own
tag, and only then replaces the installation (`launcher/Updater.cs`, `launcher/UpdateSwap.cs`).
An interrupted download, a setup that will not run, or a build stamped with some other tag leaves
the working copy untouched. The launcher refuses to update while a class runs, and stops a solo
playtest first.

The swap replaces the launcher as well as the game. Windows will not overwrite a running
executable but will rename one, so `TexasRevolution.exe` becomes `TexasRevolution.exe.old`, the
new one is copied in, and the next launch deletes the old one. Every top-level folder or file the
new build carries is moved aside into `.update-backup` before its replacement is copied in, with
a journal of what was moved and added; if anything fails part way, all of it - launcher, game and
`release.txt` - is put back, and the error says the previous version is still installed. A launch
that finds a swap marker (the power went mid-swap) rolls back before anything else. `data` is not
in a build and is never touched. The installed launcher is exactly what a fresh install makes -
the setup program, with its payload - so it can still be copied onto a memory stick, and the plain
emblem is rewritten beside it on each launch, keeping the setup and installed emblems apart. A
release with no setup program falls back to the update archive, which updates the game and keeps
the launcher.

Proved on this computer by `scripts/verify-update.ps1`, which builds three setup programs around
stand-in games and has an *installed* launcher update itself through `--install-update` (the same
stage-and-swap as the button): six PASS lines covering the swap by hash, the stamp and the class
data, deletion of the old launcher, rollback of a swap that fails part way, rollback after an
interrupted swap, and an archive without a launcher. Recorded in
[evidence/launcher-update.json](evidence/launcher-update.json). It does not download from GitHub
or use a published release; the first real proof is the release after the one that ships this.

**Reinstall the setup program once, for the release that ships this.** Every launcher installed
before it downloads only the update archive and cannot replace itself, so it would update the
game and keep the old launcher - without Solo Mode and without the self-update. That release is
the last one that needs `TexasRevolutionSetup.exe` run over the top; from then on the launcher
updates itself.

**Publishing a release that installed launchers will take.** The launcher asks GitHub for the
latest release, compares its tag with the installed `release.txt`, and downloads the release's
`TexasRevolutionSetup.exe`, or failing that its `.zip` whose name does **not** contain `NeedsNode`
(`launcher/Updates.cs`). So a release needs:

1. `scripts/package.ps1 -Stamp yyyy-MM-dd -Tag vyyyy.MM.dd -Destination <existing folder>` — the
   tag passed here is what gets stamped into `release.txt`, so it must equal the release tag; an
   updating launcher now refuses a build whose stamp differs.
2. All three outputs attached: `TexasRevolutionSetup.exe` (what updates the launcher and the game),
   `TexasRevolution-Gonzales-<stamp>.zip` (the update archive older launchers take) and the
   `-NeedsNode.zip`.
3. The release marked latest. Only the latest release is ever offered.

A release without the update archive is invisible to every launcher installed before this change:
the check reports a newer release and then "That release has no downloadable build attached." The
release of 2026-09-11 went out exactly that way; v2026.09.12 was the first to carry it.

ceiling: an update downloads the whole setup program (about 136 MB) rather than only what changed.
A delta, or a separate launcher asset, is the way out if release sizes or school bandwidth make
that hurt.

## A package that came from the Internet

The development entry point is `npm start`, which runs `node server/main.mjs` from the repository root. The teacher-facing prototype entry point is `Launch.vbs`, which delegates to `scripts/launch.ps1` without exposing a terminal workflow. The launcher is designed to use `runtime/node.exe` when supplied, otherwise an installed Node runtime.

Teacher flow:

1. Open `Launch.vbs`.
2. The Host page opens on the teacher computer. It displays the student join address and lobby.
3. Students enter the displayed address in their browsers and join their households.
4. The teacher starts the session. The authoritative server and Host own subsequent progression.

Use the displayed address for the current session, rather than copying an old address from documentation. `localhost` and `127.0.0.1` refer to each student's own computer and cannot be student join addresses. `0.0.0.0` is a server listening address, not a URL to share.

The Host URL carries a private control credential in its fragment. Project the Host page, but share only the student join address shown inside it. A URL fragment is not sent as part of an HTTP request; the Host client must supply its credential explicitly when making privileged requests. The server must validate that authority regardless of what the browser shows.

## One application architecture

Keep a single authoritative Node process serving local static assets, student action requests, and per-client server-sent event (SSE) streams from one origin. Students need only a browser. The public Host is another restricted presentation of server state; owning the server process does not make its projected view omniscient.

The path to a distributable application is a small Windows launcher plus the application files and a pinned Node executable in `runtime/node.exe`. This removes a teacher Node installation prerequisite without changing the server, world, protocol, or browser clients. A signed native launcher/installer can replace the prototype VBS/PowerShell wrapper later. No simulation should depend on the wrapper.

Packaging requirements and their current state:

| Requirement | State |
| --- | --- |
| Include the tested runtime and its license; record its version and checksum in the build manifest. Recheck runtime updates during release maintenance. | **Done.** `scripts/bundle-runtime.ps1` produces `runtime/node.exe`, `runtime/LICENSE` and `runtime/manifest.json`, and copies the manifest to `docs/evidence/runtime-manifest.json` as the tracked build record. `scripts/launch.ps1` refuses a bundled runtime whose SHA-256 does not match its manifest, and refuses a bundled runtime with no manifest at all. |
| Wait for server readiness before opening the Host browser; report startup or occupied-port errors in a useful window. | **Done.** The launcher polls an identity-checked `/health`, verifies the save and Host key agree, and writes `launcher-error.txt` plus a dialog on failure. |
| Prevent a second launch from silently creating a competing session; offer the existing Host or an explicit new-session path. | **Done.** A repeat launch reuses the verified process; an unverifiable listener on the port is refused without touching it. The explicit new-session path is the Host **New Class** control below. |
| Keep session saves in a writable application-data location; an install directory may be read-only. | **Done.** See *Where class data lives*. |
| Provide visible running/stopped/error state, a graceful stop that saves, and recovery instructions after power loss or process failure. | **Mostly done.** Graceful stop exists from the Host page and from `Stop.vbs`; the fault banner and lifecycle banner give error and stopping state. There is still **no always-visible tray or status window** while the server runs hidden: the Host page is the status surface. |
| Store every browser asset locally; no CDN, online AI service, or external font request. | **Done and enforced.** The server sends `default-src 'self'`, and no page references an external origin. |
| Validate that a standard teacher account can launch the package under district application-control policy. | **NOT DONE — district policy untested.** On this development machine, `.vbs` is associated with `WScript.exe`, and both `Launch.vbs` and `Stop.vbs` ran successfully through it. That is one unmanaged Windows 11 Pro computer, not a managed district image, and this prototype wrapper is not evidence that a signed packaged application is permitted. |
| Signed native launcher or installer. | **NOT DONE.** The VBS/PowerShell wrapper remains a prototype. |
| Generate any future QR code locally from the student URL. | **NOT DONE — optional.** No QR code is generated. A session code or QR image is a convenience; it does not make an unreachable server reachable. |

Bundling the runtime proves a viable packaging direction; this foundation does not claim to ship a signed installer or district-approved application.

## Where class data lives

The save, launcher records, logs, the private Host URL and archived classes all live in one **class data folder**, resolved in this order:

1. `TEXAS_DATA_DIR`, when set (developer or packager override).
2. `<application folder>\data`, whenever that folder is writable. This keeps ordinary development and any writable install exactly where it has always been.
3. `%LOCALAPPDATA%\TexasRevolution\data`, when the application folder is read-only — the normal case for a `Program Files` install.

`server/deployment.mjs` owns this rule. `scripts/appinfo.mjs` prints the resolved answer as JSON, and the launcher, the stop helper and the preflight script all read it from there rather than re-deriving it, so the launcher's artifacts can never land somewhere different from the save. `SAVE_PATH` still overrides the save file alone and does not move the rest of the folder.

A read-only install directory therefore no longer prevents a class from starting, and `Launch.vbs` names both possible error-file locations when it reports a failure.

## Graceful stop, and starting the next class

The hidden server previously had no way to stop except ending the process, which risks a stale save lock. Two controls now exist, and both go through the same authenticated Host command:

- **Host page → Stop Server.** Two clicks (the first arms the button, which disarms itself after six seconds). The class is checkpointed as **paused** first — a saved *running* class starts advancing again on restart, so a deliberate stop must leave a real pause — then every connected browser is told the teacher stopped the server, then the process exits and releases the save lease.
- **Stop.vbs.** For when the Host window is already closed. It authenticates with the private Host key from the class data folder, asks the server to stop, and waits for the process to exit. **It never terminates a process**; if the server does not exit it says so and tells you not to force it, because a forced stop is what leaves a stale lock.

**Host page → New Class** replaces the class without touching the server process. It refuses to run while a class is `running` or `paused`; end the class first. It then archives the current save to `<class data folder>\archive\`, issues a new session ID and class code, clears every student assignment, keeps the class size setting, builds a new world from a new seed, and returns to the lobby. The teacher's own Host credential is rotated in place, so the projected Host keeps working without reopening the launcher. Previous students' credentials belong to the archived class: their streams are closed and their browsers show the join form again.

Not yet built: a settings screen, choosing a seed or class size from the Host page, browsing or restoring archives from the UI, and a tray or status window while the server runs hidden.

## Preflight diagnostic

`scripts/preflight.ps1` records what this computer reports — Windows and PowerShell versions, execution policy per scope, the `.vbs` association, bundled-runtime version and checksum verification, the resolved class data folder, ranked join candidates, firewall profile state, and whether a local listener answers. It writes `docs/evidence/preflight-<timestamp>.json`.

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File scripts/preflight.ps1 -Tester 'name' -Network 'which network'
```

It is **read-only**: it creates, changes and removes nothing — no firewall rule, no policy, no registry value. Reading the firewall *rule* list needs an elevated session; without elevation the report says so instead of guessing. Most importantly, **preflight cannot prove that another device can reach this server.** A local `/health` response identifies the listener on this machine and nothing more. Only the physical-device procedure below can close that gap.

## Join-address discovery and networking

Enumerate interfaces through Node's `os.networkInterfaces()`, filter loopback and non-routable candidates, and rank physical Ethernet/Wi-Fi ahead of VPN and virtual adapters. Show a primary candidate plus readable alternatives when the machine has multiple networks. Interface enumeration identifies candidates; it cannot establish that another device can reach them. This uses the documented [Node network-interface API](https://nodejs.org/api/os.html#osnetworkinterfaces).

Observed during foundation work on 2026-09-08: the development computer had an Ethernet candidate `192.168.4.38`, a NordLynx VPN candidate `10.5.0.2`, and Hyper-V/WSL adapters. These are observations of one computer, not stable deployment settings. Taking the first non-loopback address would select the wrong network on some hosts.

Bind the student server to an appropriate LAN interface, or intentionally to all interfaces with the trusted-network limitations below. Detect and display the actual listening port; an occupied-port failure should be explicit. Node exposes the bound address through `server.address()` and allows an explicit listening host. See the [Node server listening API](https://nodejs.org/api/net.html#serverlisten).

Keep the join address stable for a running class. These credentials are cookies scoped to host/path, not to port. Changing hostname/IP or browser profile can make a browser appear to have no saved credential; merely changing the port does not isolate cookies. Cookie names include the persistent session ID so distinct classes on one host do not overwrite one another. Refresh/reconnect acceptance uses the same origin and browser profile. That is why a **family key** exists: eight derived symbols shown to each household, typed at the join screen on any device, working after Start, with a Host-side lookup for a student who has lost theirs. It is the deliberate recovery flow this note used to ask for, and it covers cleared storage, a different browser profile and a replacement device. It does **not** survive **New Class**, and it is not account-based identity across classes. The procedure is in [RECOVERY.md](RECOVERY.md).

SSE is appropriate for low-frequency authoritative snapshots and keeps the first transport small. HTTP/1 SSE connections share the browser's small per-origin connection limit. Five student tabs plus the Host in one profile can consume all six connections and stall other requests. Use isolated browser contexts/profiles for development multi-client tests; normal classroom devices each have their own pool. Test 30 physical clients before claiming the upper supported range. If future product requirements need many live tabs in one profile, use a shared stream or reconsider transport. The limit is documented by [MDN's SSE guide](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).

## Trusted-LAN boundary

This prototype is intended for a trusted local network. HTTP traffic and bearer credentials are not encrypted in transit. Household projections must still be filtered on the server: hiding private truth in CSS or in a renderer does not protect fog of war. Host controls and developer inspection must never become available merely because a student guesses a route or edits client code.

Do not expose the prototype directly to the public Internet. Before any hosted fallback, require HTTPS, appropriate session authorization and isolation, origin validation, request limits, and reviewed handling of stored session data. Fictional household names are sufficient; a deployment should not require student personal information.

School IT may need to approve a narrowly scoped inbound application/port rule on the correct network profile. No firewall, VPN, router, or district-policy changes were made by this documentation task. Microsoft documents application, port, scope, and profile restrictions in [Windows Firewall configuration](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/configure). A local successful URL fetch does not prove an inbound firewall rule permits remote student computers.

## Pre-classroom acceptance checklist

Run this on the actual teacher computer, actual student device types, and classroom network. Record date, tester, app revision, runtime/browser versions, network, displayed join origin, and observed outcome. Use fictional household names in evidence.

- [ ] Launch using only the intended application entry point as a standard teacher user; Host opens without terminal commands, address discovery, or configuration edits.
- [ ] At least five independent physical student devices join the same session. Then repeat at the intended class size; verify 30 before claiming the upper supported range.
- [ ] Each receives its own household and the correct restricted state. At least 100 sequential authoritative state updates arrive in order; record the first and last revisions and missing/duplicate counts.
- [ ] Refresh one student page. Its session and household identity remain the same and the world contains no duplicate people or property.
- [ ] Disconnect a student device from the network, allow the server to notice the loss, reconnect, and verify the same identity and current state.
- [ ] Confirm the Host reads that dropped device as **away** rather than simply subtracting it, and that it returns to **here** on reconnection. Lock a phone's screen and watch the same thing happen.
- [ ] Recover a household on a **second physical device** using its family key, mid-class, and verify it arrives with the same people, stores and story. Then verify the first device is signed out.
- [ ] Recover a household whose key has also been lost, using **Recover a student** on the Host, and confirm no other family's key was displayed.
- [ ] Have two students standing in the same place trade seed for food, and confirm neither can see the other's stores.
- [ ] Pause from the Host and verify the authoritative tick is unchanged across an interval exceeding several normal ticks. Resume and verify monotonic progression. Repeat during the slice.
- [ ] Save, stop, and restart the application. Rejoin on the same origin and verify identities, world locations, seed, knowledge, and remembered consequences persist.
- [ ] Run for the intended 45-minute lesson duration with the projected Host and real student browsers; test screen lock, background tabs, and normal Wi-Fi interruptions. Record maximum reconnect time and any stalled clients.
- [ ] Inspect the student network payloads as well as the UI. Confirm unauthorized household truth, Host credentials, and private debug data are absent.
- [ ] Confirm internet loss does not prevent local assets, ongoing simulation, reconnection, or save/reload on the reachable LAN.
- [ ] District test status is explicitly **PASS**, **FAIL**, or **NOT YET TESTED**, with evidence and remaining limitations. A class must not rely on a NOT YET TESTED path.

Use separate browser-context evidence as an automated regression aid, and retain the physical-device checklist as an operational acceptance test. A healthy `/health` response, a ping, or a screenshot alone is not synchronization evidence.

## Independent-device procedure

Run this whenever a second physical device is available. It takes a few minutes and is the only way to move the first outstanding gate off **NOT YET TESTED**.

1. On the teacher computer, run the preflight and note the **preferred** join URL. Ignore VPN and virtual-adapter candidates unless the class is genuinely on that network.
   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File scripts/preflight.ps1 -Tester 'name' -Network 'which network'
   ```
2. Start the class with `Launch.vbs`, or `npm.cmd start` for a visible terminal. Read the class code from the Host page.
3. On the second device, joined to the same network, open the preferred join URL and join with any display name and that code.
4. If Windows offers a firewall prompt for `node.exe`, allow it on the **Private** profile. If no prompt appears and the page does not load, an inbound rule is probably missing; record that rather than disabling the firewall.
5. Bring the class to at least five households, press **Start**, and leave the second device connected for at least 100 ticks (about 100 seconds at the launched one-second interval).
6. On the second device, confirm: its own household appears; refresh restores the same household; turning its Wi-Fi off and on returns it to the same household and current world; Pause on the Host freezes its clock and Resume restarts it.
7. Record the result below, then copy it into [GATES.md](GATES.md).

### Evidence template

| Field | Value |
| --- | --- |
| Date and tester | |
| Network described | |
| Teacher computer, OS, runtime version | |
| Student device, OS, browser version | |
| Join URL used | |
| Firewall prompt seen / rule required | |
| Households joined, of which physically independent | |
| First and last revision received by the remote device; missing or duplicate ticks | |
| Refresh, reconnect, Pause/Resume results | |
| Verdict | **PASS / FAIL / NOT YET TESTED** |
| Observed restriction if FAIL | |

Two things this procedure does not establish, however well it goes: one independent device is not the supported thirty, and any home or office LAN is not district Wi-Fi with managed student devices. Both remain separate records.

## If the actual network blocks hosting

Record the observed restriction first: client isolation, student/teacher VLAN separation, inbound firewall policy, blocked ports, proxy buffering of streams, application execution policy, or an incorrect advertised interface. Test the actual browser-to-server path; do not infer a cause from a generic connection failure.

Choose the smallest school-approved alternative that preserves browser access: an IT-approved wired host reachable from student Wi-Fi; a dedicated approved classroom network; or an approved HTTPS server reachable by all clients. Keep the same authoritative world and per-household projections. Do not require students to install a native game or weaken information isolation to get through a network gate. Do not bypass district controls.

## Available development tooling

Local inspection on 2026-09-08 found Node `v24.18.1`, npm `11.16.0`, Chrome `152.0.7977.76`, and Edge `152.0.4191.66`. These observations are not minimum-supported-version promises. Browser automation is available through the local Codex-bundled Playwright package; regression setup must also describe how to install its own declared development dependency on a fresh machine. The game runtime should remain independent of that machine-specific tooling location.
