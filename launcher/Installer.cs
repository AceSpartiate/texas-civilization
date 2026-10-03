using Microsoft.Win32;

namespace TexasRevolution.Launcher;

/// <summary>
/// Putting the classroom on a machine.
/// </summary>
/// <remarks>
/// The setup program is the launcher with the game appended (<see cref="SetupLayout"/>, from
/// 2026-10-03). Run from a folder that has no classroom beside it, it is a setup program: it
/// unpacks the game it carries, writes the launcher it carries - the first part of itself, with
/// no game in it - beside it, and makes the shortcuts. Run from inside an installation, it is the
/// launcher. .NET is in the download once, and the installed launcher is the same file a set of
/// changes carries when the launcher changes, so a launcher change no longer costs the whole game.
///
/// <para>Until 2026-10-03 the setup copied <i>itself</i> into place, game and all, so every
/// installed launcher was a 690 MB setup program and a launcher change could reach it only as
/// another whole setup program.</para>
///
/// <para>Everything is per-user, under LOCALAPPDATA. No administrator, no Program Files, no
/// UAC prompt and nothing a managed machine is likely to refuse. A teacher who cannot
/// install software can still run a lesson.</para>
/// </remarks>
public static class Installer
{
    private const string UninstallKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\TexasRevolution";

    public static string DefaultTarget => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "Programs", "TexasRevolution");

    /// <summary>True when this copy carries a game to install: a setup program, not an installed launcher.</summary>
    public static bool HasPayload => SetupLayout.ReadFile(Environment.ProcessPath) is not null;

    /// <summary>True when this copy is sitting in an installation rather than a download folder.</summary>
    public static bool IsInsideInstallation => Directory.Exists(Path.Combine(AppPaths.Root, "server"));

    public static bool AlreadyInstalled(string target) =>
        File.Exists(Path.Combine(target, "server", "main.mjs"));

    /// <summary>
    /// Unpack the game, put the launcher this setup carries beside it, and make the shortcuts.
    /// </summary>
    /// <remarks>
    /// An existing installation is written over rather than removed first, and the class
    /// data folder is never touched: a teacher updating between lessons keeps the class they
    /// were running. Nothing is deleted by this method at all.
    /// </remarks>
    public static void Install(string target, bool desktopShortcut, IProgress<(int Percent, string What)> progress, bool register = true)
    {
        progress.Report((0, "Preparing…"));
        var runningExe = Environment.ProcessPath
            ?? throw new InvalidOperationException("Windows did not say where this program is running from.");
        // The game, and then the launcher this setup carries - never this whole setup program.
        SetupLayout.Extract(runningExe, target, progress);

        // Unpacking somewhere to carry it about is not installing: no shortcuts pointing
        // into a folder that may not be there tomorrow, and no Add/Remove entry for a copy
        // nobody installed.
        if (register)
        {
            progress.Report((96, "Making shortcuts…"));
            Shortcuts.CreateFor(target, desktopShortcut);
            RegisterForAddRemove(target);
        }
        progress.Report((100, register ? "Installed." : "Unpacked."));
    }

    /// <summary>
    /// So it appears in Settings ▸ Apps like anything else, and can be removed there.
    /// </summary>
    /// <remarks>
    /// HKCU rather than HKLM: this is a per-user installation, and writing to the machine
    /// hive would need the administrator we deliberately do not ask for.
    /// </remarks>
    private static void RegisterForAddRemove(string target)
    {
        try
        {
            using var key = Registry.CurrentUser.CreateSubKey(UninstallKey);
            if (key is null) return;
            var exe = Path.Combine(target, "TexasRevolution.exe");
            key.SetValue("DisplayName", "Texas Revolution");
            key.SetValue("DisplayVersion", ReleaseOf(target) ?? "unreleased");
            key.SetValue("Publisher", "Texas Revolution");
            key.SetValue("InstallLocation", target);
            // Add/Remove Programs is a list of installed things, so it gets the plain
            // emblem rather than the setup emblem the executable itself carries.
            var emblem = Path.Combine(target, Branding.EmblemFileName);
            key.SetValue("DisplayIcon", File.Exists(emblem) ? emblem : exe);
            key.SetValue("UninstallString", $"\"{exe}\" --uninstall");
            key.SetValue("NoModify", 1, RegistryValueKind.DWord);
            key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
            key.SetValue("EstimatedSize", FolderSizeKilobytes(target), RegistryValueKind.DWord);
        }
        catch { /* a machine that will not let us register still runs the class */ }
    }

    public static void Unregister()
    {
        try { Registry.CurrentUser.DeleteSubKeyTree(UninstallKey, throwOnMissingSubKey: false); }
        catch { /* nothing to undo */ }
    }

    private static string? ReleaseOf(string target)
    {
        try
        {
            var file = Path.Combine(target, "release.txt");
            return File.Exists(file) ? File.ReadAllText(file).Trim() : null;
        }
        catch { return null; }
    }

    private static int FolderSizeKilobytes(string target)
    {
        try
        {
            long bytes = 0;
            foreach (var file in Directory.EnumerateFiles(target, "*", SearchOption.AllDirectories))
            {
                try { bytes += new FileInfo(file).Length; } catch { /* skip */ }
            }
            return (int)Math.Min(int.MaxValue, bytes / 1024);
        }
        catch { return 0; }
    }
}
