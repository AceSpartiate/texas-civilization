namespace TexasRevolution.Launcher;

/// <summary>
/// Putting the classroom where a teacher will find it again.
/// </summary>
/// <remarks>
/// A folder unpacked to the Desktop is lost the first time somebody tidies the Desktop. The
/// Start menu is where Windows users look for an application, so an entry goes there; a
/// desktop icon is a matter of taste and clutter, so that one is asked for.
///
/// Shortcuts are made through WScript.Shell by late binding rather than a COM reference,
/// which keeps this to one file and no build-time dependency.
/// </remarks>
public static class Shortcuts
{
    private static string StampFile => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "TexasRevolution", "installed.txt");

    private static string StartMenuPath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Texas Revolution.lnk");

    private static string DesktopPath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Texas Revolution.lnk");

    /// <summary>True the first time this copy is opened on this machine.</summary>
    public static bool IsFirstRun()
    {
        try { return !File.Exists(StampFile) || File.ReadAllText(StampFile).Trim() != AppPaths.Root; }
        catch { return false; }
    }

    public static void RememberInstalled() => RememberInstalled(AppPaths.Root);

    public static void RememberInstalled(string target)
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(StampFile)!);
            File.WriteAllText(StampFile, target);
        }
        catch { /* a machine that will not let us remember simply asks again */ }
    }

    public static bool Create(bool desktop) => CreateFor(AppPaths.Root, desktop);

    public static bool CreateFor(string target, bool desktop)
    {
        var exe = Path.Combine(target, "TexasRevolution.exe");
        if (!File.Exists(exe)) return false;
        var made = Write(StartMenuPath, exe, target);
        if (desktop) made &= Write(DesktopPath, exe, target);
        // An installation that made its own shortcuts should not then ask the launcher to.
        RememberInstalled(target);
        return made;
    }

    public static void Remove()
    {
        foreach (var link in new[] { StartMenuPath, DesktopPath })
        {
            try { if (File.Exists(link)) File.Delete(link); } catch { /* leave it */ }
        }
        try { if (File.Exists(StampFile)) File.Delete(StampFile); } catch { /* leave it */ }
    }

    private static bool Write(string linkPath, string exe, string workingDirectory)
    {
        try
        {
            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType is null) return false;
            dynamic? shell = Activator.CreateInstance(shellType);
            if (shell is null) return false;
            dynamic link = shell.CreateShortcut(linkPath);
            link.TargetPath = exe;
            link.WorkingDirectory = workingDirectory;
            link.Description = "Texas Revolution — a classroom simulation of Gonzales, 1835";
            link.IconLocation = exe + ",0";
            link.Save();
            return true;
        }
        catch { return false; }
    }
}
