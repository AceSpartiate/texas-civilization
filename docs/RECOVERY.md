# Save ownership and recovery

Maturity: **PROTOTYPE**. This describes the current implementation in `server/app.mjs`, `server/storage.mjs`, and `server/main.mjs`. Read `DEPLOYMENT.md` for the remaining packaging and physical-network acceptance work. Run these procedures only against the intended local classroom repository and save.

## What is saved

The normal save is `classroom.json` inside the resolved **class data folder** — `<application folder>\data` while that folder is writable, otherwise `%LOCALAPPDATA%\TexasRevolution\data`, or `TEXAS_DATA_DIR` when set. Run `node scripts/appinfo.mjs` to print the folder this installation actually uses before following any procedure here. `SAVE_PATH` can select another save file for development without moving the rest of the folder. A save contains the session identity, Host credential, student credential hashes and household assignments, accepted-command ledgers, and authoritative world including persistent people, property, locations, knowledge, and events. Treat saves and `data/host-url.txt` as private application data.

Every successful mutation is validated before its new revision is broadcast. Joining, recovering a family key, every Host command (Start, Pause, Resume, End, the next period, New Class, Stop Server) and Play Solo are also checkpointed before they are answered or shown. A tick and a student's order are checkpointed within **five seconds** of being shown (`SAVE_WITHIN_MS`), or with the third unsaved tick at a quicker pace, whichever is sooner (since 2026-09-17, [PERFORMANCE_SERVER.md](PERFORMANCE_SERVER.md)): a crash or a forced process kill can lose at most those few seconds of play, and a graceful stop — Stop Server, `Stop.vbs`, Ctrl+C — writes them first. A checkpoint is written to `<save>.tmp`, flushed with `fsync`, and renamed over the main save. The main file is the last completed checkpoint; the temporary file is never loaded automatically. Do not promote a leftover temporary file over the main save without developer inspection.

Atomic replacement prevents clients from being told that an uncommitted mutation succeeded, and the previous main checkpoint survives an ordinary write/rename failure. This is not a rotating backup system or a guarantee against every power-loss/filesystem failure: the parent directory is not explicitly flushed after rename. Keep independent backups before migrations. Do not restore, edit, copy over, or delete the active save while its server owns it.

The one exception is the `archive` subfolder. Choosing **New Class** on the Host page copies the last completed checkpoint to `archive\classroom-<sessionId>-<timestamp>.json` before the new class replaces it. Those files are deliberate, additive copies of finished classes; nothing reads them automatically, and nothing removes them. There is still no rotating backup of an ongoing class and no UI for restoring an archive — to inspect one, stop the server and open the file, and involve a developer before copying it over a live save.

The `revision` is the latest committed revision; the save on disk is at most the five seconds described above behind it, and `fault.lastSavedRevision` names the last completed checkpoint when a write fails. Headless `createClassroom()` instances without `savePath` are intentionally ephemeral; they have no disk persistence or save lease. Normal `server/main.mjs` always supplies a save path.

## One owner per save

The server acquires `<save>.lock` before reading or initializing a save. The lock includes a format version, `processId`, random ownership `token`, and creation timestamp. It is held for the lifetime of the server, independently of the chosen HTTP port. Opening the same save on another port or from another in-process server instance is refused. A second process must not fork an independent world from the same checkpoint and overwrite the first process's history.

Paths are canonicalized before lock acquisition. Use ordinary local files in a writable directory; network shares, synchronized folders, and cross-machine lock ownership are not supported or tested. A local PID is not a valid ownership authority across multiple computers.

Clean `app.close()` stops the timer and connections and removes only the lock bearing its own token and PID. Failed initial save loading, failed initialization, and failed HTTP listening release the acquired lease as well. Never delete a live server's lock: existing servers do not revalidate it on every write, so removing it would permit a second writer.

## Clean stop and restart

For a teacher-run hidden server, use either graceful stop. Both authenticate as the Host, checkpoint the class as paused, tell connected browsers what happened, and let the process exit so the save lease is released:

- **Host page → Stop Server**, confirmed with a second click.
- **Stop.vbs**, when the Host window is already closed.

`Stop.vbs` never terminates a process. If the server does not exit it reports that and stops, because forcing the process is exactly what leaves a stale lock. Stopping an already-stopped classroom is a safe no-op that clears leftover launcher metadata.

For a developer-run server, start Node directly in a visible PowerShell terminal at the repository root:

```powershell
node server/main.mjs
```

Choose **Pause** on the Host and verify the class is paused without a fault. Then press **Ctrl+C once in that server's terminal** and wait for the process to exit. The `SIGINT` handler awaits `app.close()` and releases the save lease. The server also installs a `SIGTERM` handler on platforms that deliver it; do not assume Windows process-termination tools deliver a graceful Node signal. `Stop-Process`, Task Manager End Task, and forced process termination can leave a stale lock, and lose up to the last five seconds of ticks and orders.

Restart with the same save path and the same student address. Existing browser credentials reconnect to their saved households. A saved paused class remains paused; choose **Resume** when the class is ready. A saved running class starts advancing automatically on restart, even before the Host is reopened. Therefore a successfully checkpointed Pause is preferable before an intentional stop.

Closing a Host or student browser tab does not stop the server. **End Game** persists the ended game state; it does not exit the server or release the save lease. A saved ended class remains ended on restart — choose **Stop Server** to close the process, or **New Class** to archive it and return to a fresh lobby.

## Save failure during a class

When a checkpoint fails, the live class goes back to the last completed checkpoint: the failed tick or command, and any ticks and orders shown in the few seconds since that checkpoint, are undone. The server changes the live class to paused and broadcasts a transient `fault` object to authenticated clients. The latest main save is retained. Fault fields are:

| Field | Meaning |
| --- | --- |
| `code` | `SAVE_FAILED` for persistence failure; `SIMULATION_FAILED` for a simulation exception |
| `unsaved` | `true`: the live emergency pause itself has not been checkpointed |
| `lastSavedRevision` | Last completed checkpoint revision; `null` for an ephemeral instance |
| `resumeStatus` | State to restore after a successful retry; a failed lobby operation returns to lobby |
| `message` | Explanation suitable for the Host/student fault banner |

The snapshot retains the last committed revision while showing the emergency pause. A fault is deliberately not serialized as though it were saved successfully. A browser refresh receives the same live fault. Restarting the process instead reads the last completed checkpoint, which can still say `running`; a fault pause is not a substitute for a durable Pause.

1. Keep the server running and the class paused. Preserve the main save.
2. Inspect `data/server.stderr.log` for a launcher-started process, or the visible terminal for a directly started process. A failed background tick logs the underlying filesystem error. An HTTP command failure returns status 503 and a safe explanation; it does not currently log its underlying filesystem error separately.
3. Restore access to the save directory or resolve the identified storage problem. Check free space and ordinary file access. Do not weaken machine-wide permissions or replace the main save as a recovery shortcut.
4. Choose **Resume**. The server retries a complete validated checkpoint before clearing the fault or advancing. If it fails again, the class remains paused and the response is 503. The failed command ID is not accepted, so a retry is safe within the command ledger's retention window.
5. Confirm the fault clears and the expected state returns. A failure in the lobby returns to the lobby, where the usual five-household Start requirement still applies. A recovered running class resumes advancing.

For `SIMULATION_FAILED`, have the developer inspect and fix the cause before retrying. Resume does not repair invalid logic; a recurring simulation exception will pause again. The timer remains available for recovery instead of disappearing while the UI still claims the world is running.

## A student has lost their place

This is the common classroom failure, and it is now recoverable without touching the save.

Every household is given a **family key** when it joins: eight letters and numbers, shown in that household's own family journal and nowhere else. It is derived from the class secret rather than stored, so it is the same key every time and no key survives **New Class**.

**The student still has their key.** On any device, at the student join address, choose **I already have a family key**, type it, press **Rejoin my family**. No class code is needed and it works after Start. Case, spaces and the letters that look like digits are all forgiven — `o` is read as `0`, `i` and `l` as `1` — because the alphabet contains no I, L, O or U. Their old browser is signed out, which is what keeps one household to one player.

**The student has lost the key as well.** On the Host page, open **Recover a student**, choose their family by the name they joined under, and press **Show this family's key**. One family at a time, cleared after thirty seconds. *Read it to that student rather than projecting it* — the panel is closed by default for exactly that reason, and the ordinary Host screen carries no family's key at all.

**It refuses in two cases, both deliberate.**

| Refusal | Why | What to do |
| --- | --- | --- |
| *Someone is already playing that family. If that is you on another device, close it there first.* | A family with a live connection is not a family that got locked out. This is what stops a key read off a neighbour's screen from evicting them. | Close the other tab or device, wait a moment, try again. |
| *Too many tries. Wait N seconds, then try again.* | Five wrong keys from one address start a thirty-second cooldown, so guessing is expensive. | Wait it out, then read the key back carefully. |

**What this does not fix.** A key from an archived class opens nothing, because **New Class** rotates the session the key is derived from — after a New Class, everybody joins again with the new class code. Rejoining is not joining: it never creates a household, so it cannot get a latecomer into a class that has already started.

## Was that student disconnected, or did they leave?

The Host line reads **`12 here · 1 away of 15`**. *Here* means a live connection right now. *Away* means a household whose connection closed within the last ninety seconds and has not come back.

A phone drops its connection within seconds of the screen locking, and picks it up again on unlock. That is normal mobile behaviour and it is why the count separates the two: a number that simply fell would have told you a student had left when they had not. A household that stays away past the grace window drops out of both counts; only *joined* still includes them.

Presence is held in memory and never saved. Restarting the server resets it to nobody here, and it fills in again as browsers reconnect.

## Recovering a stale lock after an abnormal stop

The application never automatically removes an existing lock. When the recorded PID definitely no longer exists it reports a stale lock. An active PID, inaccessible process information, reused PID, malformed lock, or interrupted lock write is treated as ambiguous ownership and startup is refused. This conservative behavior avoids races between competing recovery attempts.

Only recover after confirming the classroom process has exited and nobody is launching another instance. Keep the launcher closed during recovery. Do not kill a process solely because a lock contains its PID: Windows can reuse PIDs. If the PID exists, inspect its executable/start time and the launcher metadata with a developer before proceeding. An existing unrelated process does not make deleting a lock automatically safe.

The following PowerShell example is for the **default save inside this repository only**. It verifies the project and exact paths, rejects reparse points on the target path, requires a well-formed lock, checks that the recorded process no longer exists, backs up the main save, rechecks the lock content, and removes that single lock file. It never removes the save or any directory. These are recovery instructions, not a procedure run as part of foundation development.

```powershell
$ErrorActionPreference = 'Stop'
$recoveryRoot = (Resolve-Path -LiteralPath '.').Path
if (-not (Test-Path -LiteralPath (Join-Path $recoveryRoot 'server\storage.mjs') -PathType Leaf) -or
    -not (Test-Path -LiteralPath (Join-Path $recoveryRoot 'VISION.md') -PathType Leaf)) {
    throw 'Open PowerShell in the intended Texas Civilization repository first.'
}
$recoveryData = [IO.Path]::GetFullPath((Join-Path $recoveryRoot 'data'))
$recoverySave = [IO.Path]::GetFullPath((Join-Path $recoveryData 'classroom.json'))
$recoveryLock = [IO.Path]::GetFullPath((Join-Path $recoveryData 'classroom.json.lock'))
$recoveryPrefix = $recoveryRoot.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
foreach ($recoveryTarget in @($recoveryData, $recoverySave, $recoveryLock)) {
    if (-not $recoveryTarget.StartsWith($recoveryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Recovery target is outside the repository.'
    }
    $recoveryItem = Get-Item -LiteralPath $recoveryTarget -Force
    if (($recoveryItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw 'This recovery example does not support linked save files or directories.'
    }
}
if (((Get-Item -LiteralPath $recoveryRoot -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw 'Use the actual repository directory, not a linked directory.'
}
$recoveryText = [IO.File]::ReadAllText($recoveryLock)
$recoveryOwner = $recoveryText | ConvertFrom-Json
$recoveryPid = 0
if ($recoveryOwner.version -ne 1 -or
    -not [int]::TryParse([string]$recoveryOwner.processId, [ref]$recoveryPid) -or
    $recoveryPid -le 0 -or [string]$recoveryOwner.token -notmatch '^[a-f0-9]{48}$') {
    throw 'Malformed lock: preserve it and ask the developer to inspect ownership.'
}
$recoveryProcess = $null
try { $recoveryProcess = [Diagnostics.Process]::GetProcessById($recoveryPid) }
catch [ArgumentException] { } # Only definite "PID does not exist" is accepted.
if ($null -ne $recoveryProcess) {
    $recoveryProcess.Dispose()
    throw 'The recorded PID still exists. Preserve the lock and inspect the process.'
}
$recoveryBackup = Join-Path $recoveryData ('classroom.before-lock-recovery-' + [guid]::NewGuid().ToString('N') + '.json')
Copy-Item -LiteralPath $recoverySave -Destination $recoveryBackup
if ([IO.File]::ReadAllText($recoveryLock) -cne $recoveryText) {
    throw 'Lock changed during inspection. Stop recovery and recheck server ownership.'
}
Remove-Item -LiteralPath $recoveryLock
Write-Output "Removed the verified stale lock only. Backup: $recoveryBackup"
```

This is a manual recovery procedure requiring exclusive human control over launch/recovery activity; its final check and deletion are not an atomic cross-process recovery protocol. Do not run concurrent recovery commands. A custom `SAVE_PATH`, a missing save, a malformed lock, a PID that still exists, or linked directories require developer inspection rather than adapting deletion paths casually. Preserve the evidence and the last main checkpoint.

After recovery, relaunch the application with the same save. Confirm the expected session, household identities, world minute, and last remembered events before continuing. A stale lock is not a reason to initialize a new world.

## Launcher limitations and next operational work

`Launch.vbs` starts the server hidden through `scripts/launch.ps1`. Reopening the launcher reuses a verified existing process when its recorded project, port, save, executable, PID/start time, health identity, and session agree. The separate `data/launcher.lock` only serializes launcher startup; it is not the lifetime save lock described here.

The launcher now has a graceful **Stop Server** control on the Host page and a `Stop.vbs` helper, and a graceful stop removes its own `launcher-process.json` record. What is still missing is an always-visible running/stopped indicator while the server is hidden: the Host page is the only status surface, so a teacher who closes it has no window telling them the class is still running. A tray icon or small native lifecycle window remains operational work. An abnormal stop — power loss, Task Manager, `Stop-Process` — can still require the stale-lock recovery above.

An update never touches the class data folder, whichever way it comes: only what changed (the release's list of files and one set of changes, from 2026-09-26) or the whole setup program. Nothing in the installation is replaced until the new build is complete in `%TEMP%\TexasRevolutionUpdate`, so a download cut off part way leaves the installed copy as it was, and a swap that fails part way - or is cut off by the power - is rolled back, on the spot or at the next launch, from `.update-backup` beside the launcher. If the small update cannot be used, the launcher says why in one line and downloads the whole setup program instead. See [DEPLOYMENT: Updating](DEPLOYMENT.md#updating-launcher-included).

The `/health` response identifies the server process for launcher verification. Its `ok: true` is a listener/application identity response; it does not prove that simulation time is progressing or that saving is healthy. Inspect the authenticated snapshot's `fault` and world status for those checks. Launcher logging and the private Host URL use the repository `data` directory even when `SAVE_PATH` points elsewhere.

The runtime checkpoint format currently has a version check, world validation, and credential/household persistence; it does not provide migrations, a rotating backup history, or a damaged-save repair wizard. **Identity recovery does now exist** — the family key described above returns a household to any device, and a teacher can look one up — but it is per-class rather than account-based, and a key does not survive **New Class**. Ordinary silent reconnection still needs the browser cookie to survive and the student address to stay usable; the family key is what covers the case where either does not. Migrations, backups and a damaged-save repair path remain explicit follow-up tasks, not completed classroom-readiness features.

## Regression coverage

From the repository root:

```powershell
node --test tests/reliability.test.mjs
npm test
```

`tests/reliability.test.mjs` checks competing save owners, clean release/reload, stale and malformed locks that fail closed, lease cleanup on failed initialization, filesystem fault injection without OS-specific permission assumptions, durable rollback, failed and successful Resume retries, continued timer progression, unchanged launcher health fields, and recovery from a failed lobby join without bypassing minimum class size. `tests/network.test.mjs` also exercises restart and credential-based household continuity.

These tests do not simulate sudden power loss, all filesystem failure modes, a district-managed device, or two independent physical computers. Keep those acceptance limits visible in `HANDOFF.md`.
