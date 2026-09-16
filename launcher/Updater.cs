using System.Diagnostics;
using System.IO.Compression;

namespace TexasRevolution.Launcher;

/// <summary>
/// Replacing this copy with a newer published one - the launcher as well as the game.
/// </summary>
/// <remarks>
/// Everything is downloaded and unpacked *before* anything is replaced, so a failed or
/// interrupted download leaves the working copy untouched. The replacement itself is
/// <see cref="UpdateSwap"/>, which renames the running launcher out of the way rather than
/// waiting for it to exit, and rolls every part back if any part fails.
///
/// <para>What is downloaded is the release's setup program when it has one. It is the
/// launcher with the game inside it, and it already knows how to unpack itself
/// (<c>--extract</c>), so the staged copy is exactly what a fresh install would be - the
/// installed launcher still carries its own payload, and can still be copied onto a memory
/// stick. Running it to unpack is also the proof that the new launcher starts at all, before
/// anything of the old one is touched. A release with no setup program falls back to the
/// update archive, which carries the game and leaves the launcher as it is.</para>
///
/// <para>The class data folder is never touched. A teacher updating between lessons keeps
/// the class they were running.</para>
/// </remarks>
public sealed class Updater
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromMinutes(10) };
    private static string Staging => Path.Combine(Path.GetTempPath(), "TexasRevolutionUpdate");

    /// <summary>Fetch and unpack a release. Reports 0-100 as it goes.</summary>
    public async Task<string> StageAsync(ReleaseInfo release, IProgress<(int Percent, string What)> progress, CancellationToken cancel)
    {
        var url = release.SetupUrl ?? release.DownloadUrl;
        if (url is null) throw new InvalidOperationException("That release has no downloadable build attached.");
        ResetStaging();
        var file = Path.Combine(Staging, release.SetupUrl is not null ? "TexasRevolutionSetup.exe" : "update.zip");

        progress.Report((0, "Downloading…"));
        using (var response = await Http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancel))
        {
            response.EnsureSuccessStatusCode();
            var total = response.Content.Headers.ContentLength ?? (release.SetupUrl is not null ? release.SetupSize : release.Size);
            await using var source = await response.Content.ReadAsStreamAsync(cancel);
            await using var target = File.Create(file);
            var buffer = new byte[81920];
            long done = 0;
            int read;
            while ((read = await source.ReadAsync(buffer, cancel)) > 0)
            {
                await target.WriteAsync(buffer.AsMemory(0, read), cancel);
                done += read;
                // Downloading is most of the wait, so it owns most of the bar.
                if (total > 0) progress.Report(((int)(done * 80 / total), $"Downloading… {done / 1048576} of {total / 1048576} MB"));
            }
        }
        return await UnpackAsync(file, release.Tag, progress, cancel);
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
        if (!File.Exists(Path.Combine(payload, "server", "main.mjs")))
            throw new InvalidOperationException("The downloaded build does not look like Texas Revolution, so nothing was replaced.");
        // The stamp is what the next update check compares with. A build stamped with some
        // other tag would be offered again, forever, so it is refused rather than installed.
        var stamp = UpdateSwap.ReleaseOf(payload);
        if (stamp is null) throw new InvalidOperationException("The downloaded build carries no release stamp, so nothing was replaced.");
        if (expectedTag is not null && !string.Equals(stamp, expectedTag, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"The downloaded build says it is {stamp}, not {expectedTag}, so nothing was replaced.");
        progress.Report((90, "Ready to install."));
        return payload;
    }

    /// <summary>Put the staged build in place of this installation, or leave it exactly as it was.</summary>
    public static void Install(string payload, IProgress<(int Percent, string What)> progress)
    {
        progress.Report((92, "Installing…"));
        UpdateSwap.Apply(payload, AppPaths.Root);
        // Several hundred megabytes that have done their job.
        try { Directory.Delete(Staging, recursive: true); } catch { /* emptied by the next update */ }
        progress.Report((100, "Installed."));
    }

    /// <summary>Open the launcher that is now installed. The caller closes this one.</summary>
    public static void Restart() =>
        Process.Start(new ProcessStartInfo(Path.Combine(AppPaths.Root, UpdateSwap.ExeName)) { UseShellExecute = true, WorkingDirectory = AppPaths.Root });
}
