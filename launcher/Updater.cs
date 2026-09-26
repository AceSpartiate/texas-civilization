using System.Diagnostics;
using System.IO.Compression;

namespace TexasRevolution.Launcher;

/// <summary>A build staged and ready to swap in, and how it came.</summary>
/// <param name="ChangesOnly">True when only the changed files were downloaded (<see cref="DeltaUpdate"/>).</param>
/// <param name="Downloaded">Bytes actually fetched over the network.</param>
/// <param name="WhyWhole">Why the whole game was downloaded instead of the changes, in plain words.</param>
/// <param name="ChangedFiles">How many files came in the set of changes.</param>
public sealed record StagedUpdate(string Payload, bool ChangesOnly, long Downloaded, string? WhyWhole, int ChangedFiles = 0);

/// <summary>
/// Replacing this copy with a newer published one - the launcher as well as the game.
/// </summary>
/// <remarks>
/// Everything is downloaded and unpacked *before* anything is replaced, so a failed or
/// interrupted download leaves the working copy untouched. The replacement itself is
/// <see cref="UpdateSwap"/>, which renames the running launcher out of the way rather than
/// waiting for it to exit, and rolls every part back if any part fails.
///
/// <para>From 2026-09-26 an update first tries to download only what changed
/// (<see cref="DeltaUpdate"/>): the release's list of files, then the one set of changes from
/// the installed release, a few hundred kilobytes where the whole game is a quarter of a
/// gigabyte. The unchanged files are copied from the installation into staging, so what is
/// swapped in is the complete new build, verified file by file, through the same swap and
/// rollback. It keeps the launcher that is running, which is why a set of changes is only ever
/// published between releases whose launcher is the same.</para>
///
/// <para>Otherwise - and whenever the small download cannot be used for any reason - it
/// downloads the release's setup program. That is the launcher with the game inside it, and it
/// already knows how to unpack itself (<c>--extract</c>), so the staged copy is exactly what a
/// fresh install would be. Running it to unpack is also the proof that the new launcher starts
/// at all, before anything of the old one is touched. A release with no setup program falls
/// back to the update archive, which carries the game and leaves the launcher as it is.</para>
///
/// <para>The class data folder is never touched. A teacher updating between lessons keeps
/// the class they were running.</para>
/// </remarks>
public sealed class Updater
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromMinutes(10) };
    private static string Staging => Path.Combine(Path.GetTempPath(), "TexasRevolutionUpdate");
    /// <summary>A list of a few hundred files is tens of kilobytes; anything near this is not one.</summary>
    private const int ManifestLimit = 16 * 1024 * 1024;

    /// <summary>Fetch and stage a release: only its changes when that is possible, else all of it. Reports 0-100 as it goes.</summary>
    public async Task<StagedUpdate> StageAsync(ReleaseInfo release, IProgress<(int Percent, string What)> progress, CancellationToken cancel)
    {
        var installedTag = AppPaths.InstalledRelease;
        var why = DeltaUpdate.Refusal(release, installedTag, DeltaUpdate.LauncherId);
        if (why is null)
        {
            try { return await StageChangesAsync(release, AppPaths.Root, installedTag!, progress, cancel); }
            catch (OperationCanceledException) when (cancel.IsCancellationRequested) { throw; }
            catch (DeltaUnusable unusable) { why = unusable.Message; }
            catch (Exception error) { why = $"downloading the changes failed ({error.Message})"; }
        }
        return await StageWholeAsync(release, why, progress, cancel);
    }

    /// <summary>
    /// The small update: the list, the installed files that already match it, and one set of changes.
    /// </summary>
    /// <exception cref="DeltaUnusable">The changes cannot make this installation into that release; take the whole download.</exception>
    public async Task<StagedUpdate> StageChangesAsync(ReleaseInfo release, string installed, string installedTag, IProgress<(int Percent, string What)> progress, CancellationToken cancel)
    {
        ResetStaging();
        progress.Report((0, "Checking what has changed…"));
        var manifestBytes = await DownloadSmallAsync(release.ManifestUrl ?? throw new DeltaUnusable("that release has no list of its files"), cancel);
        var manifest = ReleaseManifest.Parse(manifestBytes);
        if (DeltaUpdate.Refusal(manifest, release.Tag, DeltaUpdate.LauncherId) is { } why) throw new DeltaUnusable(why);

        var payload = Path.Combine(Staging, "changes", "TexasRevolution");
        Directory.CreateDirectory(payload);
        var total = Math.Max(1, manifest.Files.Sum(file => file.Size));
        var read = new Progress<long>(done => progress.Report(((int)(done * 35 / total), "Checking the files already on this computer…")));
        var needed = await Task.Run(() => DeltaUpdate.CopyUnchanged(installed, manifest, payload, read, cancel), cancel);

        long downloaded = manifestBytes.Length;
        if (needed.Count > 0)
        {
            if (release.Patches is null || !release.Patches.TryGetValue(installedTag, out var patch))
                throw new DeltaUnusable($"that release has no set of changes from {installedTag}");
            var file = Path.Combine(Staging, "changes.patch");
            var size = patch.Size > 0 ? patch.Size : needed.Sum(entry => entry.Size);
            var files = needed.Count == 1 ? "1 file" : $"{needed.Count} files";
            progress.Report((36, $"Downloading {DeltaUpdate.Plain(size)} of changes ({files})…"));
            downloaded += await DownloadAsync(patch.Url, file, size,
                (done, of) => progress.Report((36 + (int)(done * 50 / of), $"Downloading {DeltaUpdate.Plain(of)} of changes… {DeltaUpdate.Plain(done)} so far")), cancel);
            progress.Report((87, "Putting the new version together…"));
            await Task.Run(() => DeltaUpdate.ApplyPatch(file, needed, payload, cancel), cancel);
        }
        File.WriteAllBytes(Path.Combine(payload, ReleaseManifest.FileName), manifestBytes);
        DeltaUpdate.VerifyStaged(payload, manifest);
        Check(payload, release.Tag);
        progress.Report((90, $"Ready to install. Downloaded {DeltaUpdate.Plain(downloaded)} instead of the whole game."));
        return new StagedUpdate(payload, true, downloaded, null, needed.Count);
    }

    /// <summary>The whole release: its setup program, or failing that its update archive.</summary>
    private async Task<StagedUpdate> StageWholeAsync(ReleaseInfo release, string? why, IProgress<(int Percent, string What)> progress, CancellationToken cancel)
    {
        var url = release.SetupUrl ?? release.DownloadUrl;
        if (url is null) throw new InvalidOperationException("That release has no downloadable build attached.");
        ResetStaging();
        var file = Path.Combine(Staging, release.SetupUrl is not null ? "TexasRevolutionSetup.exe" : "update.zip");
        var expected = release.SetupUrl is not null ? release.SetupSize : release.Size;

        progress.Report((0, why is null ? "Downloading…" : $"Downloading the whole game ({DeltaUpdate.Plain(expected)}), because {why}."));
        // Downloading is most of the wait, so it owns most of the bar.
        var downloaded = await DownloadAsync(url, file, expected,
            (done, total) => progress.Report(((int)(done * 80 / total), $"Downloading the whole game… {done / 1048576} of {total / 1048576} MB")), cancel);
        return new StagedUpdate(await UnpackAsync(file, release.Tag, progress, cancel), false, downloaded, why);
    }

    /// <summary>
    /// Stage a build already on this computer: a setup program or an update archive. This is
    /// what <c>--install-update</c> uses, and what proves the swap without a published release.
    /// </summary>
    public async Task<string> StageLocalAsync(string path, IProgress<(int Percent, string What)> progress, CancellationToken cancel)
    {
        if (!File.Exists(path)) throw new FileNotFoundException("No build at that path.", path);
        ResetStaging();
        var file = Path.Combine(Staging, Path.GetExtension(path).Equals(".exe", StringComparison.OrdinalIgnoreCase) ? "TexasRevolutionSetup.exe" : "update.zip");
        File.Copy(path, file);
        return await UnpackAsync(file, expectedTag: null, progress, cancel);
    }

    private static void ResetStaging()
    {
        if (Directory.Exists(Staging)) Directory.Delete(Staging, recursive: true);
        Directory.CreateDirectory(Staging);
    }

    /// <summary>Download to a file, reporting (done, total) as it goes. Returns the bytes fetched.</summary>
    /// <remarks>
    /// ceiling: an interrupted download starts again from nothing the next time rather than
    /// resuming with a Range request. Nothing is replaced until the staged build is complete, so
    /// an interruption costs time and never an installation; resuming is worth writing if a
    /// school's connection is found dropping the whole-game download part way.
    /// </remarks>
    private static async Task<long> DownloadAsync(string url, string file, long expected, Action<long, long> report, CancellationToken cancel)
    {
        using var response = await Http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancel);
        response.EnsureSuccessStatusCode();
        var total = response.Content.Headers.ContentLength ?? expected;
        await using var source = await response.Content.ReadAsStreamAsync(cancel);
        await using var target = File.Create(file);
        var buffer = new byte[81920];
        long done = 0;
        int read;
        while ((read = await source.ReadAsync(buffer, cancel)) > 0)
        {
            await target.WriteAsync(buffer.AsMemory(0, read), cancel);
            done += read;
            if (total > 0) report(Math.Min(done, total), total);
        }
        // A connection closed early can look like a finished one; the length says which.
        if (total > 0 && done != total) throw new IOException($"The download stopped after {DeltaUpdate.Plain(done)} of {DeltaUpdate.Plain(total)}.");
        return done;
    }

    private static async Task<byte[]> DownloadSmallAsync(string url, CancellationToken cancel)
    {
        using var response = await Http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancel);
        response.EnsureSuccessStatusCode();
        if (response.Content.Headers.ContentLength > ManifestLimit) throw new DeltaUnusable("its list of files is too large to be one");
        await using var source = await response.Content.ReadAsStreamAsync(cancel);
        using var memory = new MemoryStream();
        var buffer = new byte[81920];
        int read;
        while ((read = await source.ReadAsync(buffer, cancel)) > 0)
        {
            memory.Write(buffer, 0, read);
            if (memory.Length > ManifestLimit) throw new DeltaUnusable("its list of files is too large to be one");
        }
        return memory.ToArray();
    }

    private static async Task<string> UnpackAsync(string file, string? expectedTag, IProgress<(int Percent, string What)> progress, CancellationToken cancel)
    {
        progress.Report((82, "Unpacking…"));
        var unpacked = Path.Combine(Staging, "unpacked");
        string payload;
        if (file.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
        {
            payload = Path.Combine(unpacked, "TexasRevolution");
            var start = new ProcessStartInfo(file, $"--extract \"{payload}\"") { UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = Staging };
            using var process = Process.Start(start) ?? throw new InvalidOperationException("Windows would not start the downloaded setup program, so nothing was replaced.");
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancel);
            timeout.CancelAfter(TimeSpan.FromMinutes(5));
            try { await process.WaitForExitAsync(timeout.Token); }
            catch (OperationCanceledException) { try { process.Kill(); } catch { } throw new InvalidOperationException("The downloaded setup program did not finish unpacking, so nothing was replaced."); }
            if (process.ExitCode != 0) throw new InvalidOperationException($"The downloaded setup program could not unpack itself (exit {process.ExitCode}), so nothing was replaced.");
            if (!File.Exists(Path.Combine(payload, UpdateSwap.ExeName)))
                throw new InvalidOperationException("The downloaded setup program unpacked no launcher, so nothing was replaced.");
        }
        else
        {
            ZipFile.ExtractToDirectory(file, unpacked, overwriteFiles: true);
            // The archive holds a single TexasRevolution folder; take what is inside it.
            payload = Directory.GetDirectories(unpacked).FirstOrDefault() ?? unpacked;
        }
        Check(payload, expectedTag);
        progress.Report((90, "Ready to install."));
        return payload;
    }

    /// <summary>Is the staged folder a Texas Revolution build stamped as the release it came from?</summary>
    private static void Check(string payload, string? expectedTag)
    {
        if (!File.Exists(Path.Combine(payload, "server", "main.mjs")))
            throw new InvalidOperationException("The downloaded build does not look like Texas Revolution, so nothing was replaced.");
        // The stamp is what the next update check compares with. A build stamped with some
        // other tag would be offered again, forever, so it is refused rather than installed.
        var stamp = UpdateSwap.ReleaseOf(payload);
        if (stamp is null) throw new InvalidOperationException("The downloaded build carries no release stamp, so nothing was replaced.");
        if (expectedTag is not null && !string.Equals(stamp, expectedTag, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"The downloaded build says it is {stamp}, not {expectedTag}, so nothing was replaced.");
    }

    /// <summary>Put the staged build in place of this installation, or leave it exactly as it was.</summary>
    public static void Install(string payload, IProgress<(int Percent, string What)> progress)
    {
        progress.Report((92, "Installing…"));
        // What the installed build's own list shipped at the top level and the new one does not
        // goes into the backup with everything replaced, so the result is what a fresh install
        // of the new build would be (plus the class data), and a rollback restores it.
        UpdateSwap.Apply(payload, AppPaths.Root, DeltaUpdate.Retired(AppPaths.Root, payload));
        // Several hundred megabytes that have done their job.
        try { Directory.Delete(Staging, recursive: true); } catch { /* emptied by the next update */ }
        progress.Report((100, "Installed."));
    }

    /// <summary>Open the launcher that is now installed. The caller closes this one.</summary>
    public static void Restart() =>
        Process.Start(new ProcessStartInfo(Path.Combine(AppPaths.Root, UpdateSwap.ExeName)) { UseShellExecute = true, WorkingDirectory = AppPaths.Root });
}
