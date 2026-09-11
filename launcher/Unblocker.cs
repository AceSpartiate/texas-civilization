using System.Runtime.InteropServices;

namespace TexasRevolution.Launcher;

/// <summary>
/// Takes the Mark of the Web off this folder.
/// </summary>
/// <remarks>
/// Windows marks every file unpacked from a downloaded zip as having come from the
/// Internet, and PowerShell's RemoteSigned policy then refuses to load an unsigned script
/// carrying that mark. The launcher drives exactly such scripts, so without this a
/// downloaded copy fails at the first button press with a security error and no error file
/// - the failure that looks most like a locked-down machine and is not one.
///
/// This is the same thing as ticking Unblock on the zip by hand, done once, on this folder
/// only. It is deliberately native rather than a PowerShell one-liner: the whole problem
/// is that PowerShell may be refusing to run things, so the fix should not need it.
///
/// A copy that was never downloaded has no mark, and every call here quietly does nothing.
/// </remarks>
public static class Unblocker
{
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DeleteFile(string name);

    /// <summary>Clears the mark from the application folder. Returns how many it cleared.</summary>
    public static int ClearApplicationFolder()
    {
        var cleared = 0;
        try
        {
            // Only the things a launch actually loads. Walking the art folder would mean
            // thousands of pointless calls on every start.
            foreach (var pattern in new[] { "*.ps1", "*.mjs", "*.js", "*.vbs", "*.json", "*.exe", "*.dll", "*.html" })
            {
                foreach (var file in SafeEnumerate(AppPaths.Root, pattern))
                {
                    // The stream is deleted by name. Nothing is read, and nothing else is touched.
                    if (DeleteFile(file + ":Zone.Identifier")) cleared++;
                }
            }
        }
        catch { /* a folder we cannot walk is a folder we leave alone */ }
        return cleared;
    }

    private static IEnumerable<string> SafeEnumerate(string root, string pattern)
    {
        try { return Directory.EnumerateFiles(root, pattern, SearchOption.AllDirectories); }
        catch { return Array.Empty<string>(); }
    }
}
