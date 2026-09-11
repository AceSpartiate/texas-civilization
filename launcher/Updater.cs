using System.Diagnostics;
using System.IO.Compression;

namespace TexasRevolution.Launcher;

/// <summary>
/// Replacing this copy with a newer published one.
/// </summary>
/// <remarks>
/// An application cannot overwrite itself while it is running, so the swap is done by a
/// script that waits for this process to exit, copies the new files over the old ones and
/// starts the launcher again. Everything is downloaded and unpacked *before* anything is
/// replaced, so a failed or interrupted download leaves the working copy untouched.
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
        if (release.DownloadUrl is null) throw new InvalidOperationException("That release has no downloadable build attached.");
        if (Directory.Exists(Staging)) Directory.Delete(Staging, recursive: true);
        Directory.CreateDirectory(Staging);
        var archive = Path.Combine(Staging, "update.zip");

        progress.Report((0, "Downloading…"));
        using (var response = await Http.GetAsync(release.DownloadUrl, HttpCompletionOption.ResponseHeadersRead, cancel))
        {
            response.EnsureSuccessStatusCode();
            var total = response.Content.Headers.ContentLength ?? release.Size;
            await using var source = await response.Content.ReadAsStreamAsync(cancel);
            await using var target = File.Create(archive);
            var buffer = new byte[81920];
            long done = 0;
            int read;
            while ((read = await source.ReadAsync(buffer, cancel)) > 0)
            {
                await target.WriteAsync(buffer.AsMemory(0, read), cancel);
                done += read;
                // Downloading is most of the wait, so it owns most of the bar.
                if (total > 0) progress.Report(((int)(done * 85 / total), $"Downloading… {done / 1048576} of {total / 1048576} MB"));
            }
        }

        progress.Report((88, "Unpacking…"));
        var unpacked = Path.Combine(Staging, "unpacked");
        ZipFile.ExtractToDirectory(archive, unpacked, overwriteFiles: true);
        // The archive holds a single TexasRevolution folder; take what is inside it.
        var payload = Directory.GetDirectories(unpacked).FirstOrDefault() ?? unpacked;
        if (!File.Exists(Path.Combine(payload, "server", "main.mjs")))
            throw new InvalidOperationException("The downloaded build does not look like Texas Revolution, so nothing was replaced.");
        progress.Report((95, "Ready to install."));
        return payload;
    }

    /// <summary>
    /// Hand the swap to a script and get out of its way.
    /// </summary>
    /// <remarks>
    /// robocopy rather than a hand-written copy loop: it is on every Windows machine, it
    /// retries a file that is briefly held, and /XD data keeps the teacher's class out of
    /// it. Exit codes below 8 are success in robocopy's own terms.
    /// </remarks>
    public static void InstallAndRestart(string payload)
    {
        var script = Path.Combine(Staging, "install.cmd");
        var target = AppPaths.Root;
        var exe = Path.Combine(target, "TexasRevolution.exe");
        var lines = new[]
        {
            "@echo off",
            "setlocal",
            $"echo Waiting for Texas Revolution to close...",
            $"powershell.exe -NoProfile -Command \"Wait-Process -Id {Environment.ProcessId} -Timeout 60 -ErrorAction SilentlyContinue\"",
            $"robocopy \"{payload}\" \"{target}\" /E /R:3 /W:1 /XD data >nul",
            "if errorlevel 8 (",
            "  echo The update could not be written. The previous version is still installed.",
            "  pause",
            "  exit /b 1",
            ")",
            $"start \"\" \"{exe}\"",
            "endlocal",
        };
        File.WriteAllLines(script, lines);
        Process.Start(new ProcessStartInfo("cmd.exe", $"/c \"{script}\"")
        {
            UseShellExecute = true,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden,
        });
    }
}
