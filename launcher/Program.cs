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
            return Uninstaller.Run();
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
        Application.Run(new LauncherForm());
        return 0;
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
                var (play, host, error) = await server.NewSoloGameAsync();
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
                    Console.WriteLine("refused: stop the class (and any solo playtest) first");
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
                var release = await Updates.LatestAsync();
                if (release is null) { Console.WriteLine("could not reach GitHub"); return 1; }
                Console.WriteLine($"latest={release.Tag} installed={AppPaths.InstalledRelease ?? "(working copy)"} newer={Updates.IsNewerThanInstalled(release)?.ToString() ?? "(unknown)"}");
                return 0;
            }
            default:
                Console.Error.WriteLine("Use --status, --start, --stop, --solo, --stop-solo, --check-updates, --install-update <file> or --uninstall, or open it with no arguments for the window. A setup copy also takes --install [folder] [--desktop] and --extract [folder].");
                return 2;
        }
    }
}
