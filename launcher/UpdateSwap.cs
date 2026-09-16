namespace TexasRevolution.Launcher;

/// <summary>
/// Putting a staged build in place of the installed one - the launcher included - and putting
/// the old one back if anything goes wrong.
/// </summary>
/// <remarks>
/// Windows will not overwrite a running executable, but it will rename one. So the running
/// <c>TexasRevolution.exe</c> becomes <c>TexasRevolution.exe.old</c>, the new one is copied in
/// under the real name, and the next launch deletes the old. Until 2026-09-16 the update
/// archive carried the game and never the launcher, and a launcher change reached a machine
/// only when its teacher ran a newer setup program over the top.
///
/// <para>Every top-level file or folder the new build carries is first moved aside into
/// <c>.update-backup</c> (a rename, on the same volume) and only then copied in. A journal in
/// that folder records what was moved and what was added, so a failure part way - a file held
/// open, a full disk - is undone from what is actually on disk, not from what this process
/// remembers. A marker file says a swap is under way; a launch that finds it (the power went
/// in the middle) rolls back before doing anything else.</para>
///
/// <para><c>data</c> is never in a build and never touched. The emblem written beside the
/// executable at install is not in a build either, so it stays; the next launch rewrites it
/// from the new executable, which keeps the setup emblem and the installed emblem apart.</para>
/// </remarks>
public static class UpdateSwap
{
    public const string ExeName = "TexasRevolution.exe";
    public const string OldExeName = "TexasRevolution.exe.old";
    public const string FailedExeName = "TexasRevolution.exe.failed";
    public const string BackupFolder = ".update-backup";
    private const string Marker = "swap-in-progress.txt";
    private const string Journal = "journal.txt";

    /// <summary>Replace the installation at <paramref name="target"/> with <paramref name="payload"/>.</summary>
    /// <exception cref="Exception">Anything that stopped the swap, after it has been rolled back.</exception>
    public static void Apply(string payload, string target)
    {
        var backup = Path.Combine(target, BackupFolder);
        // An earlier swap that was interrupted is undone first; a finished one is only tidied.
        if (File.Exists(Path.Combine(backup, Marker))) Rollback(target);
        if (Directory.Exists(backup)) Retry(() => Directory.Delete(backup, recursive: true));
        // Left by the last update if its launcher had not exited when the new one started.
        foreach (var leftover in new[] { OldExeName, FailedExeName })
        {
            var path = Path.Combine(target, leftover);
            if (File.Exists(path)) Retry(() => File.Delete(path));
        }

        Directory.CreateDirectory(backup);
        File.WriteAllText(Path.Combine(backup, Marker), $"Update swap started {DateTime.UtcNow:o}. If this file is here, the swap did not finish; the launcher rolls it back when it next opens.");
        var journal = Path.Combine(backup, Journal);
        void Note(string line) => File.AppendAllLines(journal, new[] { line });
        try
        {
            // The launcher first, so its rollback is exercised by every failure after it.
            var newExe = Path.Combine(payload, ExeName);
            if (File.Exists(newExe))
            {
                var exe = Path.Combine(target, ExeName);
                if (File.Exists(exe))
                {
                    Note("exe-moving");
                    Retry(() => File.Move(exe, Path.Combine(target, OldExeName)));
                }
                Note("exe-new");
                File.Copy(newExe, exe);
            }
            var entries = Directory.EnumerateFileSystemEntries(payload)
                .Select(Path.GetFileName).OfType<string>()
                .Where(name => !name.Equals(ExeName, StringComparison.OrdinalIgnoreCase)
                               && !name.Equals("data", StringComparison.OrdinalIgnoreCase)
                               && !name.Equals(BackupFolder, StringComparison.OrdinalIgnoreCase))
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase);
            foreach (var name in entries)
            {
                var destination = Path.Combine(target, name);
                if (Exists(destination))
                {
                    Retry(() => Move(destination, Path.Combine(backup, name)));
                    Note("moved:" + name);
                }
                else Note("added:" + name);
                Copy(Path.Combine(payload, name), destination);
            }
            File.Delete(Path.Combine(backup, Marker));
        }
        catch
        {
            Rollback(target);
            throw;
        }
        // Committed. The previous build is no longer needed; whatever cannot be deleted now
        // the next launch deletes.
        try { Directory.Delete(backup, recursive: true); } catch { /* CleanUp */ }
    }

    /// <summary>
    /// Undo a swap that did not finish, from the backup folder and its journal. Does nothing
    /// when there is no swap under way.
    /// </summary>
    public static void Rollback(string target)
    {
        var backup = Path.Combine(target, BackupFolder);
        if (!File.Exists(Path.Combine(backup, Marker))) return;
        var journal = Path.Combine(backup, Journal);
        var lines = File.Exists(journal) ? File.ReadAllLines(journal) : Array.Empty<string>();

        foreach (var line in lines.Where(line => line.StartsWith("added:", StringComparison.Ordinal)))
        {
            var added = Path.Combine(target, line["added:".Length..]);
            if (Exists(added)) Retry(() => Delete(added));
        }
        // What is in the backup folder is what was moved, whether or not the journal got the line.
        foreach (var entry in Directory.EnumerateFileSystemEntries(backup).ToList())
        {
            var name = Path.GetFileName(entry);
            if (name is Marker or Journal) continue;
            var original = Path.Combine(target, name);
            if (Exists(original)) Retry(() => Delete(original));
            Retry(() => Move(entry, original));
        }
        var old = Path.Combine(target, OldExeName);
        if (lines.Contains("exe-moving") && File.Exists(old))
        {
            var exe = Path.Combine(target, ExeName);
            if (File.Exists(exe))
            {
                // It may be the one running - a launch that found an interrupted swap - and a
                // running executable can be renamed but not deleted.
                try { File.Delete(exe); }
                catch
                {
                    var failed = Path.Combine(target, FailedExeName);
                    if (File.Exists(failed)) File.Delete(failed);
                    File.Move(exe, failed);
                }
            }
            Retry(() => File.Move(old, exe));
        }
        else if (lines.Contains("exe-new") && !lines.Contains("exe-moving"))
        {
            // There was no launcher before this swap, so the one it added goes.
            var exe = Path.Combine(target, ExeName);
            try { if (File.Exists(exe)) File.Delete(exe); } catch { /* running; harmless */ }
        }
        Retry(() => Directory.Delete(backup, recursive: true));
    }

    /// <summary>
    /// On every launch of an installed copy: finish the last update's housekeeping, or roll back
    /// one that was cut off. Never throws; a launcher that cannot tidy up still opens.
    /// </summary>
    /// <returns>True when an interrupted update was rolled back.</returns>
    public static bool CleanUp(string target)
    {
        var rolledBack = false;
        try
        {
            var backup = Path.Combine(target, BackupFolder);
            if (File.Exists(Path.Combine(backup, Marker))) { Rollback(target); rolledBack = true; }
            else if (Directory.Exists(backup)) Directory.Delete(backup, recursive: true);
        }
        catch { /* tried again next launch, and by the next update */ }
        // Once now, which is enough whenever the old launcher has already gone - and a headless
        // run exits before any background work would get a turn.
        foreach (var leftover in new[] { OldExeName, FailedExeName })
        {
            try { File.Delete(Path.Combine(target, leftover)); } catch { /* still closing; below */ }
        }
        // The launcher that started this one may still be closing, so anything left is
        // deleted in the background, with a few seconds' patience.
        _ = Task.Run(async () =>
        {
            foreach (var leftover in new[] { OldExeName, FailedExeName })
            {
                var path = Path.Combine(target, leftover);
                for (var attempt = 0; attempt < 20 && File.Exists(path); attempt++)
                {
                    try { File.Delete(path); }
                    catch { await Task.Delay(500); }
                }
            }
        });
        return rolledBack;
    }

    /// <summary>The staged build's release stamp, or null.</summary>
    public static string? ReleaseOf(string folder)
    {
        try
        {
            var file = Path.Combine(folder, "release.txt");
            return File.Exists(file) ? File.ReadAllText(file).Trim() : null;
        }
        catch { return null; }
    }

    private static bool Exists(string path) => File.Exists(path) || Directory.Exists(path);

    private static void Move(string from, string to)
    {
        if (Directory.Exists(from)) Directory.Move(from, to);
        else File.Move(from, to);
    }

    private static void Delete(string path)
    {
        if (Directory.Exists(path)) Directory.Delete(path, recursive: true);
        else File.Delete(path);
    }

    /// <summary>Copied rather than moved: the staging folder may be on another volume.</summary>
    private static void Copy(string from, string to)
    {
        if (!Directory.Exists(from)) { File.Copy(from, to, overwrite: true); return; }
        Directory.CreateDirectory(to);
        foreach (var file in Directory.EnumerateFiles(from)) File.Copy(file, Path.Combine(to, Path.GetFileName(file)), overwrite: true);
        foreach (var folder in Directory.EnumerateDirectories(from)) Copy(folder, Path.Combine(to, Path.GetFileName(folder)));
    }

    /// <summary>
    /// A file briefly held - an antivirus scan, a status check's node process finishing - is
    /// not a failed update. Five tries over two seconds, then it is.
    /// </summary>
    private static void Retry(Action action)
    {
        for (var attempt = 1; ; attempt++)
        {
            try { action(); return; }
            catch (Exception error) when (attempt < 5 && error is IOException or UnauthorizedAccessException)
            {
                Thread.Sleep(400);
            }
        }
    }
}
