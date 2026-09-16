using System.Diagnostics;

namespace TexasRevolution.Launcher;

/// <summary>
/// Removing it, and asking first about the one thing that cannot be got back.
/// </summary>
/// <remarks>
/// An application cannot delete itself while it is running, so the deletion is handed to a
/// script that waits for this process to exit. The teacher's saved classes are a separate
/// question and a separate answer: everything else is replaceable by downloading it again,
/// and a class is not.
/// </remarks>
public static class Uninstaller
{
    public static int Run()
    {
        var root = AppPaths.Root;
        var data = AppPaths.Resolve()?.DataDir;
        var hasClasses = data is not null && File.Exists(Path.Combine(data, "classroom.json"));

        var answer = MessageBox.Show(
            "Remove Texas Revolution from this computer?" + Environment.NewLine + Environment.NewLine + root,
            "Texas Revolution", MessageBoxButtons.OKCancel, MessageBoxIcon.Warning);
        if (answer != DialogResult.OK) return 1;

        var keepClasses = false;
        if (hasClasses)
        {
            // Default to keeping. Somebody removing an application is not necessarily asking
            // to throw away the class they taught with it.
            var classes = MessageBox.Show(
                "Keep your saved classes?" + Environment.NewLine + Environment.NewLine
                + $"They are in:{Environment.NewLine}{data}{Environment.NewLine}{Environment.NewLine}"
                + "Choose Yes to leave them on the computer, or No to delete them with everything else.",
                "Texas Revolution", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            keepClasses = classes == DialogResult.Yes;
        }

        // Stop the class first, properly, so nothing is left holding a save lock.
        try { new ServerControl().StopAsync().GetAwaiter().GetResult(); } catch { /* it may not be running */ }
        try { new ServerControl().StopSoloAsync().GetAwaiter().GetResult(); } catch { /* nor a solo playtest */ }

        Shortcuts.Remove();
        Installer.Unregister();

        var script = Path.Combine(Path.GetTempPath(), "texas-uninstall.cmd");
        var keepInside = keepClasses && data is not null && data.StartsWith(root, StringComparison.OrdinalIgnoreCase);
        var lines = new List<string>
        {
            "@echo off",
            $"powershell.exe -NoProfile -Command \"Wait-Process -Id {Environment.ProcessId} -Timeout 60 -ErrorAction SilentlyContinue\"",
        };
        if (keepInside)
        {
            // The class data lives inside the application folder, so take everything else and
            // leave that one folder standing.
            lines.Add($"for /d %%d in (\"{root}\\*\") do if /i not \"%%~nxd\"==\"data\" rd /s /q \"%%d\"");
            lines.Add($"for %%f in (\"{root}\\*\") do del /q \"%%f\"");
        }
        else
        {
            lines.Add($"rd /s /q \"{root}\"");
            if (!keepClasses && data is not null && !data.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                lines.Add($"rd /s /q \"{data}\"");
        }
        lines.Add($"del /q \"{script}\"");
        File.WriteAllLines(script, lines);
        Process.Start(new ProcessStartInfo("cmd.exe", $"/c \"{script}\"")
        {
            UseShellExecute = true,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden,
        });

        MessageBox.Show(
            keepClasses
                ? "Texas Revolution has been removed. Your saved classes were kept."
                : "Texas Revolution has been removed.",
            "Texas Revolution", MessageBoxButtons.OK, MessageBoxIcon.Information);
        return 0;
    }
}
