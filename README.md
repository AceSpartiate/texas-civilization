# Texas Revolution family simulation

A local, browser-based multiplayer **foundation prototype**. Guide a fictional household through a short Gonzales sequence; keep its people, knowledge, property and memories in one persistent world.

**Start here for development:** [VISION.md](VISION.md) → [HANDOFF.md](HANDOFF.md) → [TECH.md](TECH.md) → [GAME.md](GAME.md). Historical facts and fiction are separated in [HISTORY.md](HISTORY.md).

## Run

Requires Node 22 or later. No runtime dependencies or build step.

```powershell
cd 'C:\Users\zachw\Texas Civilization'
npm.cmd start
```

Open the private Host URL printed at startup. Share the student LAN URL and class code displayed inside the Host page. At least five independent student browser profiles/devices must join before Start.

A student who stays in the same browser is reconnected automatically. One who does not — a cleared browser, a borrowed laptop, a replaced device — types their **family key**, eight letters and numbers shown in their own family journal, and gets their household back on any device; it works after the class has started. If they have lost the key too, the teacher can look theirs up from the Host page, one family at a time. See [recovery](docs/RECOVERY.md).

Windows launcher prototype: double-click **Launch.vbs** to start, **Stop.vbs** to stop. The launcher prefers the bundled `runtime/node.exe`, refusing it if it does not match its recorded checksum, and falls back to installed Node. Both VBS entry points have been run through the real double-click path on the development machine; district application-control policy and a signed installer are still outstanding. Class data lives beside the application when that folder is writable, otherwise under `%LOCALAPPDATA%\TexasRevolution\data`. Teacher controls include a graceful **Stop Server** and a **New Class** that archives the finished class. Details: [deployment](docs/DEPLOYMENT.md), [recovery](docs/RECOVERY.md).

Students guide a whole family: everyone can be sent to plant, harvest, hunt or mend, and families standing in the same place can **trade seed and food with each other**. Gonzales has residents to deal with. Nobody sees another household's stores, and nobody who is not theirs takes an order.

The launched slice lasts about **4 minutes 44 seconds**, plus pauses. This is not the complete 45-minute lesson. It stops after Gonzales while preserving the household story. Existing saves resume, and **New Class** on the Host page archives a finished class and opens a fresh lobby.

## Verify

```powershell
npm.cmd test
npm.cmd run simulate -- repeatable-seed 15 mixed
```

That is **80 automated tests**, requiring no external packages. Browser proofs require separately installed Playwright and Chromium/Chrome; exact setup and commands are in [HANDOFF.md](HANDOFF.md). Tests create isolated temporary classes and leave the normal classroom save alone.

The classroom server has no Internet or AI-service dependency. One independent physical device has now joined over a LAN; five devices, thirty devices and district Wi-Fi remain **NOT YET TESTED**. Read [gate evidence](docs/GATES.md) before treating this as classroom ready.
