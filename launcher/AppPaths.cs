using System.Diagnostics;
using System.Text.Json;

namespace TexasRevolution.Launcher;

/// <summary>
/// Where the application is, and where this machine's class data went.
/// </summary>
/// <remarks>
/// The data folder is not guessed. The server resolves it - beside the application when
/// that folder is writable, otherwise under LOCALAPPDATA, or wherever TEXAS_DATA_DIR
/// says - and <c>scripts/appinfo.mjs</c> prints the answer. Guessing here would mean two
/// opinions about where a teacher's class lives, and the wrong one loses it.
/// </remarks>
public sealed record AppInfo(string DataDir, int Port);

public static class AppPaths
{
    /// <summary>The installed application folder: the launcher sits in its root.</summary>
    public static string Root { get; } = AppContext.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);

    public static string Scripts => Path.Combine(Root, "scripts");
    public static string BundledNode => Path.Combine(Root, "runtime", "node.exe");

    /// <summary>The release this copy was packaged from, or null for a working copy.</summary>
    public static string? InstalledRelease
    {
        get
        {
            try
            {
                var file = Path.Combine(Root, "release.txt");
                return File.Exists(file) ? File.ReadAllText(file).Trim() : null;
            }
            catch { return null; }
        }
    }

    /// <summary>Node: the bundled runtime if this package has one, else whatever is on PATH.</summary>
    public static string? NodePath()
    {
        if (File.Exists(BundledNode)) return BundledNode;
        var paths = Environment.GetEnvironmentVariable("PATH")?.Split(Path.PathSeparator) ?? Array.Empty<string>();
        foreach (var directory in paths)
        {
            try
            {
                var candidate = Path.Combine(directory.Trim(), "node.exe");
                if (File.Exists(candidate)) return candidate;
            }
            catch { /* a malformed PATH entry is not an error worth showing a teacher */ }
        }
        return null;
    }

    /// <summary>Ask the server's own code where the data folder and port are.</summary>
    /// <param name="solo">Solo Mode's own folder and port rather than the class's.</param>
    public static AppInfo? Resolve(bool solo = false)
    {
        var node = NodePath();
        if (node is null) return null;
        try
        {
            var start = new ProcessStartInfo(node, $"\"{Path.Combine(Scripts, "appinfo.mjs")}\"{(solo ? " --solo" : "")}")
            {
                WorkingDirectory = Root,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var process = Process.Start(start);
            if (process is null) return null;
            var text = process.StandardOutput.ReadToEnd();
            process.WaitForExit(10_000);
            using var document = JsonDocument.Parse(text);
            var root = document.RootElement;
            return new AppInfo(root.GetProperty("dataDir").GetString() ?? "", root.GetProperty("port").GetInt32());
        }
        catch { return null; }
    }

    /// <summary>The private Host URL the running server wrote, credential and all.</summary>
    public static string? HostUrl(AppInfo info)
    {
        try
        {
            var file = Path.Combine(info.DataDir, "host-url.txt");
            return File.Exists(file) ? File.ReadAllText(file).Trim() : null;
        }
        catch { return null; }
    }
}
