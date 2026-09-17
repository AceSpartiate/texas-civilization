using System.Reflection;
using System.Diagnostics;

namespace TexasRevolution.Launcher;

/// <summary>
/// The teacher's control panel: start the class, show it, hand out the address, stop.
/// </summary>
/// <remarks>
/// Every control here answers a question a teacher actually asked while standing in front of
/// a room. Is it on. Where do the students type. Put it on the projector. Which version is
/// this, and is there a newer one. Nothing here configures anything: a seed, a port and a
/// class size are developer settings and have no business on this window.
///
/// <para>The layout is a single stack with an explicit height, because the first version of
/// this window was thirty pixels too short and quietly clipped the update button off the
/// bottom - a control that exists and cannot be seen is worse than one that does not.</para>
/// </remarks>
public sealed class LauncherForm : Form
{
    private readonly ServerControl _server = new();
    private readonly Updater _updater = new();

    private readonly Label _title = new() { Dock = DockStyle.Top, Height = 30, ForeColor = Color.WhiteSmoke };
    private readonly Label _release = new() { Dock = DockStyle.Top, Height = 20, ForeColor = Color.FromArgb(150, 168, 150) };
    private readonly Label _state = new() { Dock = DockStyle.Top, Height = 24, ForeColor = Color.FromArgb(214, 222, 210) };
    private readonly Label _code = new() { Dock = DockStyle.Top, Height = 34, ForeColor = Color.FromArgb(236, 224, 178) };
    private readonly Label _join = new() { Dock = DockStyle.Top, Height = 26, ForeColor = Color.FromArgb(168, 196, 170) };
    private readonly Button _power = Primary("Start the class");
    private readonly Button _showClass = Secondary("Open class view");
    private readonly Button _openPlayer = Secondary("Open a player window");
    private readonly Button _copyCode = Secondary("Copy the class code");
    private readonly Button _copyJoin = Secondary("Copy the join address");
    private readonly Button _updates = Secondary("Check for updates");
    // Solo Mode: the owner playtesting, not a class. It never touches the class above it.
    private readonly Button _solo = Secondary("Play Solo");
    private readonly ProgressBar _progress = new() { Dock = DockStyle.Top, Height = 14, Visible = false, Style = ProgressBarStyle.Continuous, Maximum = 100 };
    private readonly Label _notice = new() { Dock = DockStyle.Fill, ForeColor = Color.FromArgb(214, 190, 140) };
    // Small, at the very bottom, and out of the way of the class buttons (owner, 2026-09-17).
    private readonly LinkLabel _uninstall = new() { Dock = DockStyle.Bottom, Height = 22, Text = "Uninstall Texas Revolution…", TextAlign = ContentAlignment.MiddleRight, LinkColor = Color.FromArgb(150, 168, 150), ActiveLinkColor = Color.WhiteSmoke, Font = new Font("Segoe UI", 8f) };

    private readonly System.Windows.Forms.Timer _poll = new() { Interval = 1500 };
    private ServerStatus _status = ServerStatus.Stopped;
    private ReleaseInfo? _available;
    private bool _busy;
    private TeacherWindow? _classView;
    private TeacherWindow? _soloView;
    private TeacherWindow? _soloHostView;
    private bool _soloBusy;
    private bool _soloStarted;

    public LauncherForm()
    {
        Text = "Texas Revolution";
        Branding.Apply(this);
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(460, 580);
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        BackColor = Color.FromArgb(38, 48, 42);
        Padding = new Padding(18, 14, 18, 14);
        Font = new Font("Segoe UI", 9.5f);

        _title.Text = "Texas Revolution — Gonzales, 1835";
        _title.Font = new Font("Segoe UI", 13f, FontStyle.Bold);
        _release.Text = AppPaths.InstalledRelease is { } tag ? $"Release {tag}" : "Working copy (not an installed release)";
        // Found 2026-09-17: a computer showed Release v2026.09.17.2 and no Solo Mode button, because the game files were new
        // and the launcher was not. The setup stamps its tag into the launcher (scripts/package.ps1), so a mismatch is said.
        var launcherTag = LauncherTag;
        if (launcherTag is not null && AppPaths.InstalledRelease is { } game && !string.Equals(launcherTag, game, StringComparison.OrdinalIgnoreCase))
        {
            _release.Text = $"Release {game} · launcher {launcherTag}";
            Say("This launcher is from a different release than the game beside it. Download TexasRevolutionSetup.exe again from the release page and choose Update.");
        }
        _uninstall.LinkClicked += (_, _) => Uninstall();
        _join.Font = new Font("Consolas", 10f);
        // The six characters a student types are the thing a teacher reads out and writes on
        // the board, so they are the largest thing on this window after the button.
        _code.Font = new Font("Consolas", 17f, FontStyle.Bold);

        _power.Click += async (_, _) => await TogglePowerAsync();
        _showClass.Click += (_, _) => ShowClassView();
        _openPlayer.Click += (_, _) => OpenPlayerWindow();
        _copyCode.Click += (_, _) => CopyToClipboard(_status.ClassCode, "class code");
        _copyJoin.Click += (_, _) => CopyToClipboard(_status.PrimaryJoinUrl, "join address");
        _updates.Click += async (_, _) => await UpdatesClickedAsync();
        _solo.Click += async (_, _) => await PlaySoloAsync();
        _solo.BackColor = Color.FromArgb(62, 58, 76);

        // Dock=Top stacks in reverse of the order added, so this list reads bottom-up. The
        // notice fills whatever is left, which is what keeps a long message from pushing a
        // button off the window the way the first version of this did.
        Controls.Add(_notice);
        Controls.Add(_uninstall);
        foreach (var control in new Control[] { _progress, _updates, _solo, _copyJoin, _copyCode, _openPlayer, _showClass, _power, _join, _code, _state, _release, _title })
            Controls.Add(control);

        _poll.Tick += async (_, _) => await RefreshAsync();
        Load += async (_, _) =>
        {
            await RefreshAsync();
            _poll.Start();
            OfferShortcuts();
            // Asked once, quietly, on the way in. A teacher opening this two minutes before a
            // lesson should not be interrupted, so a failure here says nothing at all.
            await LookForUpdateAsync(announce: false);
        };
        FormClosing += (_, _) =>
        {
            _poll.Stop();
            // A playtest server this window started goes with it, through the same graceful
            // stop as a class. Not awaited: the script outlives the window, and a solo game is
            // a scratch pad with nothing in it worth holding the window open for.
            if (_soloStarted) _ = _server.StopSoloAsync();
        };
    }

    /// <summary>
    /// Solo Mode: one click from here to playing, for the owner testing the game.
    /// </summary>
    /// <remarks>
    /// Starts the solo server if it is not running (its own folder, its own save, its own port,
    /// this computer only - a running class is left exactly as it is), deals a new game with one
    /// player already joined, rolled and started, and opens that player's page in a window of
    /// its own. The window has a button for the solo class view, to inspect what the Host sees,
    /// and one for another new game.
    /// </remarks>
    private async Task PlaySoloAsync()
    {
        if (_soloBusy) return;
        _soloBusy = true;
        _solo.Enabled = false;
        try
        {
            Say("Starting a solo game…");
            // Only a server this window started is stopped when it closes; one already running
            // (say, from `npm run solo` in a terminal) belongs to whoever started it.
            var wasRunning = await _server.SoloRunningAsync();
            var (ok, output) = await _server.StartSoloAsync();
            if (!ok) { Say(string.IsNullOrWhiteSpace(output) ? "The solo server did not start, and said nothing about why." : output); return; }
            if (!wasRunning) _soloStarted = true;
            // New or continue (owner, 2026-09-17): asked only when there is a saved solo game to continue.
            var (games, listError) = await _server.ListSoloGamesAsync();
            if (games is null) { Say($"The solo server would not list its saved games. {listError}"); return; }
            string? continueId = null;
            if (games.Count > 0)
            {
                using var choice = new SoloGameDialog(games);
                if (choice.ShowDialog(this) != DialogResult.OK) { Say("Play Solo was cancelled."); return; }
                continueId = choice.ContinueId;
            }
            Say(continueId is null ? "Starting a new solo game…" : "Opening the saved game…");
            var (play, host, error) = await _server.NewSoloGameAsync(continueId);
            if (play is null) { Say($"The solo server started but would not deal a game. {error}"); return; }
            if (_soloView is { IsDisposed: false })
            {
                _soloView.Navigate(play);
                _soloView.Activate();
            }
            else
            {
                _soloView = new TeacherWindow(play, "Texas Revolution — Play Solo", developer: true,
                    ("Class view", _ => ShowSoloHost(host)),
                    ("New solo game", window => _ = NewSoloGameInAsync(window)));
                _soloView.FormClosed += (_, _) => _soloView = null;
                _soloView.Show();
            }
            Say(continueId is null
                ? "Solo game running: one family joined and the class started. Nobody else can reach it."
                : "Saved game continued where it was left. Nobody else can reach it.");
        }
        finally
        {
            _soloBusy = false;
            _solo.Enabled = true;
        }
    }

    private void ShowSoloHost(string? hostUrl)
    {
        if (hostUrl is null) { Say("The solo server has not written its Host address yet."); return; }
        if (_soloHostView is { IsDisposed: false })
        {
            // A new game rotates the session, so the class view is reopened rather than shown stale.
            _soloHostView.Navigate(hostUrl);
            _soloHostView.Activate();
            return;
        }
        _soloHostView = new TeacherWindow(hostUrl, "Texas Revolution — Play Solo class view", developer: true);
        _soloHostView.FormClosed += (_, _) => _soloHostView = null;
        _soloHostView.Show();
    }

    private async Task NewSoloGameInAsync(TeacherWindow window)
    {
        var (play, host, error) = await _server.NewSoloGameAsync();
        if (play is null) { Say($"No new solo game: {error}"); return; }
        window.Navigate(play);
        if (_soloHostView is { IsDisposed: false } && host is not null) _soloHostView.Navigate(host);
    }

    /// <summary>
    /// Asked once, the first time this copy is opened, and never again.
    /// </summary>
    /// <remarks>
    /// The Start menu entry is made without asking, because that is where Windows
    /// applications live and it is where a teacher will look. The desktop icon is asked
    /// for, because somebody else's desktop is not ours to decorate.
    /// </remarks>
    private void OfferShortcuts()
    {
        if (!Shortcuts.IsFirstRun()) return;
        var answer = MessageBox.Show(
            "Put a Texas Revolution shortcut on the desktop?" + Environment.NewLine + Environment.NewLine
            + "It will be added to the Start menu either way.",
            "Texas Revolution", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        Shortcuts.Create(desktop: answer == DialogResult.Yes);
        Shortcuts.RememberInstalled();
    }

    private static Button Primary(string text) => new()
    {
        Text = text, Dock = DockStyle.Top, Height = 50, FlatStyle = FlatStyle.Flat,
        BackColor = Color.FromArgb(74, 104, 80), ForeColor = Color.White,
        Font = new Font("Segoe UI", 11.5f, FontStyle.Bold),
    };

    private static Button Secondary(string text) => new()
    {
        Text = text, Dock = DockStyle.Top, Height = 38, FlatStyle = FlatStyle.Flat,
        BackColor = Color.FromArgb(54, 66, 58), ForeColor = Color.WhiteSmoke,
    };

    private void Say(string message) => _notice.Text = message;

    /// <summary>The release tag stamped into this launcher when the setup was built; null for a working copy's build.</summary>
    private static string? LauncherTag =>
        typeof(LauncherForm).Assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion?.Split('+')[0] is { } version
        && version.StartsWith('v') ? version : null;

    /// <summary>
    /// The same uninstall Add/Remove Programs runs, in a process of its own: it asks, and if the teacher goes ahead this
    /// window closes so its folder can be removed; if they cancel, nothing changes.
    /// </summary>
    private void Uninstall()
    {
        var exe = Environment.ProcessPath;
        if (exe is null || AppPaths.InstalledRelease is null) { Say("This is a working copy, not an installed release; there is nothing to uninstall."); return; }
        _uninstall.Enabled = false;
        var process = Process.Start(new ProcessStartInfo(exe, $"--uninstall --after {Environment.ProcessId}") { UseShellExecute = false });
        if (process is null) { _uninstall.Enabled = true; return; }
        process.EnableRaisingEvents = true;
        process.Exited += (_, _) => BeginInvoke(() =>
        {
            if (process.ExitCode == 0) { _soloStarted = false; Close(); }
            else _uninstall.Enabled = true;
        });
    }

    private async Task RefreshAsync()
    {
        if (_busy) return;
        _status = await _server.StatusAsync();
        var running = _status.Running;
        _power.Text = running ? "Stop the class" : "Start the class";
        _power.BackColor = running ? Color.FromArgb(122, 70, 52) : Color.FromArgb(74, 104, 80);
        _state.Text = running
            ? _status.Stopping ? "Stopping…"
                : _status.Joined == 1 ? "The class is running · 1 household joined"
                : $"The class is running · {_status.Joined} households joined"
            : "Not running.";
        // Both of the things a teacher has to hand out, on the face of the window, with a
        // button each. The first version had only the address and only a copy button for
        // that, which is how somebody came to press "copy" and not get the code.
        _code.Text = running ? _status.ClassCode ?? "" : "";
        _join.Text = running ? _status.PrimaryJoinUrl ?? "" : "Start the class to get a join address.";
        foreach (var button in new[] { _showClass, _openPlayer, _copyJoin }) button.Enabled = running;
        _copyCode.Enabled = running && !string.IsNullOrEmpty(_status.ClassCode);
    }

    private async Task TogglePowerAsync()
    {
        _busy = true;
        _power.Enabled = false;
        var starting = !_status.Running;
        _state.Text = starting ? "Starting…" : "Stopping. The class is being saved…";
        Say("");
        var (ok, output) = starting ? await _server.StartAsync() : await _server.StopAsync();
        _busy = false;
        _power.Enabled = true;
        await RefreshAsync();
        if (!ok) Say(string.IsNullOrWhiteSpace(output) ? "That did not work, and said nothing about why." : output);
        else if (starting && _status.Running) Say("Students can join at the address above.");
        else if (starting) Say("It reported success but is not answering yet. Give it a moment, then look again.");
        else Say("Stopped. The class was saved and continues where it left off.");
    }

    private void ShowClassView()
    {
        if (_status.HostUrl is null) { Say("The class is running but has not written its Host address yet."); return; }
        if (_classView is { IsDisposed: false }) { _classView.Activate(); return; }
        _classView = new TeacherWindow(_status.HostUrl);
        _classView.FormClosed += (_, _) => _classView = null;
        _classView.Show();
    }

    private void OpenPlayerWindow()
    {
        if (_status.PrimaryJoinUrl is not { } url) { Say("No join address yet."); return; }
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
        catch (Exception error) { Say(error.Message); }
    }

    /// <summary>
    /// Copy, and say what happened either way.
    /// </summary>
    /// <remarks>
    /// The clipboard belongs to whatever else is running, and Windows will refuse when
    /// another program is holding it. A silent failure there looks exactly like a broken
    /// button, so the failure path puts the text on screen where it can be read out or
    /// typed - which is all the teacher wanted the clipboard for.
    /// </remarks>
    private void CopyToClipboard(string? value, string what)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Say(_status.Running ? $"There is no {what} yet." : $"Start the class first — there is no {what} until it is running.");
            return;
        }
        try { Clipboard.SetText(value); Say($"Copied the {what}: {value}"); }
        catch { Say($"Windows would not let go of the clipboard. The {what} is {value}"); }
    }

    /// <summary>Look, and then - if there is something - offer to install it.</summary>
    private async Task UpdatesClickedAsync()
    {
        if (_available is not null) { await InstallAsync(_available); return; }
        await LookForUpdateAsync(announce: true);
        if (_available is not null) await InstallAsync(_available);
    }

    private async Task LookForUpdateAsync(bool announce)
    {
        if (announce) Say("Asking GitHub…");
        var release = await Updates.LatestAsync();
        if (release is null)
        {
            if (announce) Say("Could not reach GitHub. This copy works offline either way.");
            return;
        }
        switch (Updates.IsNewerThanInstalled(release))
        {
            case null:
                if (announce) Say($"This is a working copy rather than an installed release. The latest published is {release.Tag}.");
                break;
            case false:
                if (announce) Say($"Up to date — {release.Tag}.");
                break;
            case true:
                _available = release;
                _updates.Text = $"Update to {release.Tag}";
                _updates.BackColor = Color.FromArgb(96, 84, 46);
                Say($"A newer build is available: {release.Name}.");
                break;
        }
    }

    private async Task InstallAsync(ReleaseInfo release)
    {
        // Never mid-lesson. An update that restarts the launcher under a running class is
        // the one moment a teacher cannot afford a surprise.
        if (_status.Running)
        {
            Say("Stop the class first. Updating restarts the launcher, and a class should not be interrupted.");
            return;
        }
        if (MessageBox.Show(
                $"Download and install {release.Name}?" + Environment.NewLine + Environment.NewLine
                + "Texas Revolution will close and reopen. Your saved classes are not touched.",
                "Texas Revolution", MessageBoxButtons.OKCancel, MessageBoxIcon.Question) != DialogResult.OK) return;

        _busy = true;
        foreach (var button in new[] { _power, _updates, _showClass, _openPlayer, _copyJoin, _solo }) button.Enabled = false;
        _progress.Visible = true;
        _progress.Value = 0;
        var progress = new Progress<(int Percent, string What)>(step =>
        {
            _progress.Value = Math.Clamp(step.Percent, 0, 100);
            Say(step.What);
        });
        try
        {
            var payload = await _updater.StageAsync(release, progress, CancellationToken.None);
            // Nothing may be running out of this folder while it is replaced: no playtest server,
            // and no status check starting the bundled node every second and a half.
            _poll.Stop();
            if (await _server.SoloRunningAsync())
            {
                Say("Stopping Play Solo first…");
                await _server.StopSoloAsync();
                _soloStarted = false;
            }
            Say("Installing…");
            await Task.Run(() => Updater.Install(payload, progress));
            Say("Installed. Texas Revolution is reopening.");
            Updater.Restart();
            Close();
        }
        catch (Exception error)
        {
            _progress.Visible = false;
            Say($"The update did not finish, and the version you had is still installed. {error.Message}");
            foreach (var button in new[] { _power, _updates, _solo }) button.Enabled = true;
            _busy = false;
            _poll.Start();
            await RefreshAsync();
        }
    }
}
