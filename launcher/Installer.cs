using System.IO.Compression;
using System.Reflection;
using Microsoft.Win32;

namespace TexasRevolution.Launcher;

/// <summary>
/// Putting the classroom on a machine.
/// </summary>
/// <remarks>
/// This application is one binary with two jobs. Run from a folder that has no classroom
/// beside it, it is a setup program: it unpacks the game it carries, copies *itself* in
/// beside it as the launcher, and makes the shortcuts. Run from inside an installation, it
/// is the launcher. That is why the payload it carries is the game and not the launcher -
/// embedding the launcher inside the launcher would ship .NET twice, and the download is
/// already large enough.
///
/// <para>Everything is per-user, under LOCALAPPDATA. No administrator, no Program Files, no
/// UAC prompt and nothing a managed machine is likely to refuse. A teacher who cannot
/// install software can still run a lesson.</para>
/// </remarks>
public static class Installer
{
    public const string PayloadResource = "TexasRevolution.Launcher.payload.zip";
    private const string UninstallKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\TexasRevolution";

    public static string DefaultTarget => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "Programs", "TexasRevolution");

    /// <summary>True when this copy carries a game to install.</summary>
    public static bool HasPayload =>
        Assembly.GetExecutingAssembly().GetManifestResourceNames().Contains(PayloadResource);

    /// <summary>True when this copy is sitting in an installation rather than a download folder.</summary>
    public static bool IsInsideInstallation => Directory.Exists(Path.Combine(AppPaths.Root, "server"));

    public static bool AlreadyInstalled(string target) =>
        File.Exists(Path.Combine(target, "server", "main.mjs"));

    /// <summary>
    /// Unpack the game, put this exe beside it, and make the shortcuts.
    /// </summary>
    /// <remarks>
    /// An existing installation is written over rather than removed first, and the class
    /// data folder is never touched: a teacher updating between lessons keeps the class they
    /// were running. Nothing is deleted by this method at all.
    /// </remarks>
    public static void Install(string target, bool desktopShortcut, IProgress<(int Percent, string What)> progress, bool register = true)
    {
        progress.Report((0, "Preparing…"));
        Directory.CreateDirectory(target);

        using var payload = Assembly.GetExecutingAssembly().GetManifestResourceStream(PayloadResource)
            ?? throw new InvalidOperationException("This copy carries nothing to install. Download the setup file again.");
        using var archive = new ZipArchive(payload, ZipArchiveMode.Read);
        // The archive holds one TexasRevolution folder; its contents go straight into the
        // chosen folder, so nobody ends up with TexasRevolution\TexasRevolution.
        //
        // Separators are normalised first and then everything is decided on the normalised
        // string. Windows writes these entries with backslashes, and testing the original
        // for a trailing '/' said every folder was a file - which failed on the first folder
        // deep enough to need creating.
        var items = archive.Entries.Select(entry =>
        {
            var full = entry.FullName.Replace('\\', '/');
            var slash = full.IndexOf('/');
            return (Entry: entry, Relative: slash >= 0 ? full[(slash + 1)..] : full, IsFolder: full.EndsWith('/') || entry.Name.Length == 0);
        }).Where(item => item.Relative.Length > 0
                         // A teacher's saved classes are not ours to overwrite.
                         && !item.Relative.StartsWith("data/", StringComparison.OrdinalIgnoreCase)).ToList();
        var total = items.Count(item => !item.IsFolder);
        var done = 0;
        foreach (var item in items)
        {
            var destination = Path.Combine(target, item.Relative.Replace('/', Path.DirectorySeparatorChar));
            if (item.IsFolder) { Directory.CreateDirectory(destination); continue; }
            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            item.Entry.ExtractToFile(destination, overwrite: true);
            done++;
            if (total > 0) progress.Report((done * 90 / total, $"Unpacking… {done} of {total} files"));
        }

        progress.Report((92, "Installing the launcher…"));
        var installedExe = Path.Combine(target, "TexasRevolution.exe");
        var runningExe = Environment.ProcessPath
            ?? throw new InvalidOperationException("Windows did not say where this program is running from.");
        // Copying ourselves in is what makes one download do both jobs. If we are somehow
        // already running from the target, there is nothing to copy.
        if (!string.Equals(Path.GetFullPath(runningExe), Path.GetFullPath(installedExe), StringComparison.OrdinalIgnoreCase))
            File.Copy(runningExe, installedExe, overwrite: true);

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
            key.SetValue("DisplayIcon", exe);
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
