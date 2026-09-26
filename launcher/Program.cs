using System.Diagnostics;
using System.Runtime.InteropServices;

namespace TexasRevolution.Launcher;

internal static class Program
{
    // A WinExe has no console of its own, so a headless run would write into nothing. This
    // borrows the console of whoever called it, which is what makes `--status` usable from
    // a script or from a support person's terminal.
    [DllImport("kernel32.dll")] private static extern bool AttachConsole(int processId);
    private const int ParentProcess = -1;

    /// <summary>
    /// One binary, two jobs.
    /// </summary>
    /// <remarks>
    /// Sitting in a folder with a classroom beside it, this is the launcher. Sitting
    /// anywhere else - a Downloads folder, a memory stick - it is the setup program for the
    /// game it carries. The alternative was two downloads, or a setup program that embeds a
    /// launcher that embeds .NET, and both are worse.
    /// </remarks>
    [STAThread]
    private static int Main(string[] args)
    {
        var verb = args.FirstOrDefault()?.TrimStart('-', '/').ToLowerInvariant();

        if (verb == "uninstall")
        {
            ApplicationConfiguration.Initialize();
            // `--after <pid>`: the launcher window that asked, which has to be gone before its folder can be.
            var after = args.SkipWhile(arg => !arg.TrimStart('-', '/').Equals("after", StringComparison.OrdinalIgnoreCase)).Skip(1).FirstOrDefault();
            return Uninstaller.Run(int.TryParse(after, out var pid) ? pid : null);
        }

        if (!Installer.IsInsideInstallation)
        {
            // No classroom beside us. Either we carry one, and this is a setup program, or
            // somebody has moved the exe out of its folder and needs telling.
            ApplicationConfiguration.Initialize();
            if (Installer.HasPayload)
            {
                if (verb is "extract" or "install") return Unpack(args, register: verb == "install");
                Application.Run(new InstallerForm());
                return 0;
            }
            var message = "This launcher must sit in the Texas Revolution folder, beside the server and public folders.\n\n"
                        + $"It is currently in:\n{AppPaths.Root}";
            if (args.Length > 0) { AttachConsole(ParentProcess); Console.Error.WriteLine(message); return 2; }
            MessageBox.Show(message, "Texas Revolution", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 2;
        }

        // Before anything tries to run a script. A copy that came down through a browser
        // carries a mark that makes PowerShell refuse the launcher's own scripts, and the
        // failure that produces has no error file and reads like a blocked machine.
        Unblocker.ClearApplicationFolder();

        // The last update's leftovers: the old launcher, renamed out of the way while it ran,
        // and the backup of the build it replaced - or, if that update was cut off part way,
        // the old build put back (launcher/UpdateSwap.cs). Then the installed emblem is written
        // from this executable, so an update that brings a new emblem brings it to the shortcuts.
        var rolledBack = UpdateSwap.CleanUp(AppPaths.Root);
        if (File.Exists(Path.Combine(AppPaths.Root, Branding.EmblemFileName))) Branding.WriteEmblemTo(AppPaths.Root);

        if (args.Length > 0) { AttachConsole(ParentProcess); return Headless(verb!, args).GetAwaiter().GetResult(); }
        if (rolledBack)
            MessageBox.Show("The last update was interrupted before it finished, so the previous version was put back. Your classes were not touched. You can try the update again.",
                "Texas Revolution", MessageBoxButtons.OK, MessageBoxIcon.Information);

        ApplicationConfiguration.Initialize();
        // Nothing about how this window looks may put a dialog in front of a teacher. Since
        // 2026-09-20 the window is a painting and ten cast plates, all of them decoded at
        // start-up, and an image that cannot be read has to end in plain colour and a line in
        // the error file rather than in Windows' crash box - which is modal, which arrives
        // before the teacher has done anything, and which says nothing they can act on.
        // The launcher is built to fall back at each step (TitleScene, PlateArt, Branding all
        // return null rather than throw); this is the net under that, not a substitute for it.
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        Application.ThreadException += (_, problem) => WriteDown(problem.Exception);
        AppDomain.CurrentDomain.UnhandledException += (_, problem) => WriteDown(problem.ExceptionObject as Exception);
        try { Application.Run(new LauncherForm()); }
        catch (Exception error) { WriteDown(error); return 3; }
        return 0;
    }

    /// <summary>
    /// Put a failure where a support person already looks, and say nothing on screen.
    /// </summary>
    /// <remarks>
    /// <c>data/launcher-error.txt</c> is the file <c>scripts/launch.ps1</c> writes and
    /// <see href="../docs/RECOVERY.md">recovery</see> reads, so a window that fell over leaves
    /// its reason in the same place a server that would not start leaves its own. It is appended
    /// to rather than replaced, and the next launch rewrites it from scratch.
    /// </remarks>
    internal static void NoteQuietly(Exception? error) => WriteDown(error);

    private static void WriteDown(Exception? error)
    {
        if (error is null) return;
        try
        {
            var beside = Path.Combine(AppPaths.Root, "data");
            var folder = Directory.Exists(beside)
                ? beside
                : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TexasRevolution");
            Directory.CreateDirectory(folder);
            File.AppendAllText(Path.Combine(folder, "launcher-error.txt"),
                $"{Environment.NewLine}The launcher window struck a problem at {DateTime.Now:yyyy-MM-dd HH:mm:ss}. "
                + $"The class itself is not affected.{Environment.NewLine}{error}{Environment.NewLine}");
        }
        catch { /* a machine that will not let us write it down is not made better by a dialog */ }
    }

    /// <summary>
    /// Installing without the window.
    /// </summary>
    /// <remarks>
    /// `--install` is a real installation with shortcuts and an Add/Remove entry, for a
    /// school putting this on a room full of machines without a person clicking through a
    /// window on each one. `--extract` only unpacks, for a memory stick or a machine that
    /// will not have anything installed on it - no shortcuts pointing into a folder that may
    /// not be there tomorrow, and no Add/Remove entry for a copy nobody installed.
    /// </remarks>
    private static int Unpack(string[] args, bool register)
    {
        AttachConsole(ParentProcess);
        var target = args.Length > 1 ? args[1] : register ? Installer.DefaultTarget : Path.Combine(AppPaths.Root, "TexasRevolution");
        var desktop = args.Contains("--desktop", StringComparer.OrdinalIgnoreCase);
        try
        {
            var progress = new Progress<(int Percent, string What)>(step => Console.WriteLine(step.What));
            Installer.Install(target, desktop, progress, register);
            Console.WriteLine($"{(register ? "Installed" : "Unpacked")} to {target}");
            return 0;
        }
        catch (Exception error) { Console.Error.WriteLine(error.Message); return 1; }
    }

    /// <summary>
    /// The buttons, without the window.
    /// </summary>
    /// <remarks>
    /// This exists so the Start and Stop paths can be proved from a script rather than by a
    /// person clicking, and it earns its keep twice: it is also what a school's IT can run
    /// to see whether the thing works on a machine before a lesson depends on it. It calls
    /// exactly the same code the buttons call; a seam that tested something else would be
    /// worse than no seam.
    /// </remarks>
    private static async Task<int> Headless(string verb, string[] args)
    {
        var server = new ServerControl();
        switch (verb)
        {
            case "solo":
            {
                // Solo Mode without the window: start (or reuse) the playtest server, deal a new
                // game, and print the one-use address that opens it already joined.
                var (ok, output) = await server.StartSoloAsync();
                Console.WriteLine($"solo start ok={ok}");
                if (!ok) { if (!string.IsNullOrWhiteSpace(output)) Console.WriteLine(output); return 1; }
                // `--solo --continue <id>` continues a saved game; `--solo --list` lists them and deals nothing.
                if (args.Any(arg => arg.TrimStart('-', '/').Equals("list", StringComparison.OrdinalIgnoreCase)))
                {
                    var (games, listError) = await server.ListSoloGamesAsync();
                    if (games is null) { Console.WriteLine($"solo list failed: {listError}"); return 1; }
                    foreach (var game in games) Console.WriteLine($"game id={game.Id} family=\"{game.Family}\" date=\"{game.Date}\" period={game.Period} status={game.Status} savedAt={game.SavedAt}");
                    Console.WriteLine($"games={games.Count}");
                    return 0;
                }
                var continueId = args.SkipWhile(arg => !arg.TrimStart('-', '/').Equals("continue", StringComparison.OrdinalIgnoreCase)).Skip(1).FirstOrDefault();
                var (play, host, error) = await server.NewSoloGameAsync(continueId);
                if (play is null) { Console.WriteLine($"solo game failed: {error}"); return 1; }
                Console.WriteLine($"play={play}");
                Console.WriteLine($"classview={(host is null ? "(none)" : "found")}");
                return 0;
            }
            case "stop-solo":
            {
                var (ok, output) = await server.StopSoloAsync();
                Console.WriteLine($"stop-solo ok={ok}");
                if (!string.IsNullOrWhiteSpace(output)) Console.WriteLine(output);
                return ok ? 0 : 1;
            }
            case "install-update":
            {
                // An update from a build on this computer - a setup program or an update archive -
                // through exactly the stage-and-swap the Update button uses. It is how the swap and
                // its rollback are proved without publishing a release (scripts/verify-update.ps1).
                var file = args.Skip(1).FirstOrDefault(arg => !arg.StartsWith("--", StringComparison.Ordinal));
                if (file is null) { Console.Error.WriteLine("Use --install-update <TexasRevolutionSetup.exe or update .zip> [--no-restart]."); return 2; }
                if ((await server.StatusAsync()).Running || await server.SoloRunningAsync())
                {
                    Console.WriteLine("refused: stop the class (and Play Solo) first");
                    return 3;
                }
                var progress = new Progress<(int Percent, string What)>(_ => { });
                try
                {
                    var payload = await new Updater().StageLocalAsync(Path.GetFullPath(file), progress, CancellationToken.None);
                    Console.WriteLine($"staged release={UpdateSwap.ReleaseOf(payload) ?? "(none)"}");
                    Updater.Install(payload, progress);
                    Console.WriteLine($"installed release={AppPaths.InstalledRelease ?? "(none)"}");
                    if (!args.Contains("--no-restart", StringComparer.OrdinalIgnoreCase)) Updater.Restart();
                    return 0;
                }
                catch (Exception error)
                {
                    Console.WriteLine($"update failed, previous version kept: {error.Message}");
                    return 1;
                }
            }
            case "status":
            {
                var status = await server.StatusAsync();
                Console.WriteLine($"running={status.Running} pid={status.Pid} stopping={status.Stopping}");
                Console.WriteLine($"join={status.PrimaryJoinUrl ?? "(none)"}");
                Console.WriteLine($"classview={(status.HostUrl is null ? "(none)" : "found")}");
                Console.WriteLine($"release={AppPaths.InstalledRelease ?? "(working copy)"}");
                return status.Running ? 0 : 1;
            }
            case "start":
            {
                var watch = Stopwatch.StartNew();
                var (ok, output) = await server.StartAsync();
                Console.WriteLine($"start ok={ok} in {watch.Elapsed.TotalSeconds:F1}s");
                if (!string.IsNullOrWhiteSpace(output)) Console.WriteLine(output);
                var status = await server.StatusAsync();
                Console.WriteLine($"answering={status.Running} join={status.PrimaryJoinUrl ?? "(none)"}");
                return ok && status.Running ? 0 : 1;
            }
            case "stop":
            {
                var (ok, output) = await server.StopAsync();
                Console.WriteLine($"stop ok={ok}");
                if (!string.IsNullOrWhiteSpace(output)) Console.WriteLine(output);
                return ok ? 0 : 1;
            }
            case "check-updates":
            {
                var release = await Updates.LatestAsync(api: ReleaseApi(args));
                if (release is null) { Console.WriteLine("could not reach GitHub"); return 1; }
                Console.WriteLine($"latest={release.Tag} installed={AppPaths.InstalledRelease ?? "(working copy)"} newer={Updates.IsNewerThanInstalled(release)?.ToString() ?? "(unknown)"}");
                var (bytes, changes) = DeltaUpdate.Estimate(release, AppPaths.InstalledRelease, DeltaUpdate.LauncherId);
                Console.WriteLine($"download={bytes} changesOnly={changes} launcherId={DeltaUpdate.LauncherId ?? "(none)"}");
                return 0;
            }
            case "update":
            {
                // What the Update button does, without the window: ask for the latest release, take
                // only its changes if that can be done and the whole of it if not, and swap it in.
                // `--release-api <url>` asks somewhere other than GitHub, which is how the small
                // update and every way it falls back are proved against a local server
                // (scripts/verify-delta-update.ps1) without publishing anything.
                var release = await Updates.LatestAsync(api: ReleaseApi(args));
                if (release is null) { Console.WriteLine("could not reach the release server"); return 1; }
                switch (Updates.IsNewerThanInstalled(release))
                {
                    case null: Console.WriteLine("refused: this is a working copy, not an installed release"); return 2;
                    case false: Console.WriteLine($"up to date release={release.Tag}"); return 0;
                }
                if ((await server.StatusAsync()).Running || await server.SoloRunningAsync())
                {
                    Console.WriteLine("refused: stop the class (and Play Solo) first");
                    return 3;
                }
                string? last = null;
                // Written as it happens: a Progress<T> with no window posts to the thread pool, and the
                // lines would arrive after the result they led up to.
                var progress = new InlineProgress<(int Percent, string What)>(step =>
                {
                    // Each kind of message once, not every percent of it.
                    var kind = new string(step.What.TakeWhile(ch => !char.IsDigit(ch)).ToArray());
                    if (kind != last) { last = kind; Console.WriteLine($"  {step.What}"); }
                });
                try
                {
                    var staged = await new Updater().StageAsync(release, progress, CancellationToken.None);
                    Console.WriteLine($"staged release={UpdateSwap.ReleaseOf(staged.Payload) ?? "(none)"} mode={(staged.ChangesOnly ? "changes" : "whole")} downloaded={staged.Downloaded} files={staged.ChangedFiles}"
                                      + (staged.WhyWhole is null ? "" : $" because=\"{staged.WhyWhole}\""));
                    Updater.Install(staged.Payload, progress);
                    Console.WriteLine($"installed release={AppPaths.InstalledRelease ?? "(none)"}");
                    if (!args.Contains("--no-restart", StringComparer.OrdinalIgnoreCase)) Updater.Restart();
                    return 0;
                }
                catch (Exception error)
                {
                    Console.WriteLine($"update failed, previous version kept: {error.Message}");
                    return 1;
                }
            }
            default:
                Console.Error.WriteLine("Use --status, --start, --stop, --solo, --stop-solo, --check-updates, --update [--no-restart], --install-update <file> or --uninstall, or open it with no arguments for the window. A setup copy also takes --install [folder] [--desktop] and --extract [folder].");
                return 2;
        }
    }

    private sealed class InlineProgress<T> : IProgress<T>
    {
        private readonly Action<T> _report;
        private readonly object _gate = new();
        public InlineProgress(Action<T> report) => _report = report;
        public void Report(T value) { lock (_gate) _report(value); }
    }

    /// <summary>`--release-api &lt;url&gt;`: an http(s) address to ask instead of GitHub, or null.</summary>
    private static string? ReleaseApi(string[] args)
    {
        var value = args.SkipWhile(arg => !arg.TrimStart('-', '/').Equals("release-api", StringComparison.OrdinalIgnoreCase)).Skip(1).FirstOrDefault();
        return Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) ? uri.ToString() : null;
    }
}
