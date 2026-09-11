namespace TexasRevolution.Launcher;

/// <summary>
/// Putting the classroom where a teacher will find it again.
/// </summary>
/// <remarks>
/// A folder unpacked to the Desktop is lost the first time somebody tidies the Desktop. The
/// Start menu is where Windows users look for an application, so an entry goes there without
/// being asked; a desktop icon is a matter of taste and clutter, so that one is asked for
/// once and never again.
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

    public static void RememberInstalled()
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(StampFile)!);
            File.WriteAllText(StampFile, AppPaths.Root);
        }
        catch { /* a machine that will not let us remember simply asks again */ }
    }

    public static bool Create(bool desktop)
    {
        var target = Path.Combine(AppPaths.Root, "TexasRevolution.exe");
        if (!File.Exists(target)) return false;
        var made = Write(StartMenuPath, target);
        if (desktop) made &= Write(DesktopPath, target);
        return made;
    }

    private static bool Write(string linkPath, string target)
    {
        try
        {
            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType is null) return false;
            dynamic? shell = Activator.CreateInstance(shellType);
            if (shell is null) return false;
            dynamic link = shell.CreateShortcut(linkPath);
            link.TargetPath = target;
            link.WorkingDirectory = AppPaths.Root;
            link.Description = "Texas Revolution — a classroom simulation of Gonzales, 1835";
            link.IconLocation = target + ",0";
            link.Save();
            return true;
        }
        catch { return false; }
    }
}
