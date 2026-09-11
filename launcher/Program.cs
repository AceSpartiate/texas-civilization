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

    [STAThread]
    private static int Main(string[] args)
    {
        // A launcher that cannot find the classroom beside it is a launcher in the wrong
        // folder, and saying so is more use than any button it could offer.
        if (!Directory.Exists(Path.Combine(AppPaths.Root, "server")))
        {
            var message = "This launcher must sit in the Texas Revolution folder, beside the server and public folders.\n\n"
                        + $"It is currently in:\n{AppPaths.Root}";
            if (args.Length > 0) { Console.Error.WriteLine(message); return 2; }
            MessageBox.Show(message, "Texas Revolution", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 2;
        }
        // Before anything tries to run a script. A copy that came down through a browser
        // carries a mark that makes PowerShell refuse the launcher's own scripts, and the
        // failure that produces has no error file and reads like a blocked machine.
        Unblocker.ClearApplicationFolder();

        if (args.Length > 0) { AttachConsole(ParentProcess); return Headless(args[0]).GetAwaiter().GetResult(); }

        ApplicationConfiguration.Initialize();
        Application.Run(new LauncherForm());
        return 0;
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
    private static async Task<int> Headless(string verb)
    {
        var server = new ServerControl();
        switch (verb.TrimStart('-', '/').ToLowerInvariant())
        {
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
                Console.Error.WriteLine("Use --status, --start, --stop or --check-updates, or open it with no arguments for the window.");
                return 2;
        }
    }
}
