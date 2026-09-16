using System.Text.Json;

namespace TexasRevolution.Launcher;

/// <param name="DownloadUrl">The update archive: the game with its runtime, no launcher.</param>
/// <param name="SetupUrl">The setup program: the launcher with the game inside it. Preferred,
/// because it is the only asset that carries the launcher (launcher/Updater.cs).</param>
public sealed record ReleaseInfo(string Tag, string Name, string PageUrl, string? DownloadUrl, long Size, string? SetupUrl = null, long SetupSize = 0);

/// <summary>
/// Whether a newer build has been published.
/// </summary>
/// <remarks>
/// GitHub's own releases endpoint answers unauthenticated for a public repository, at sixty
/// requests an hour per address. That is the whole update mechanism: no account, no service
/// to keep paid for, nothing to run. A teacher's machine asks once when the launcher opens.
///
/// The comparison is tag against tag rather than version arithmetic. Releases here are dated
/// rather than numbered, and "is this the same release I installed" is the honest question -
/// it cannot be fooled by a tag format changing under it.
/// </remarks>
public static class Updates
{
    private const string LatestApi = "https://api.github.com/repos/AceSpartiate/texas-civilization/releases/latest";
    private static readonly HttpClient Http = CreateClient();

    private static HttpClient CreateClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        // GitHub refuses a request with no User-Agent, and an honest one costs nothing.
        client.DefaultRequestHeaders.UserAgent.ParseAdd("TexasRevolutionLauncher");
        client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        return client;
    }

    public static async Task<ReleaseInfo?> LatestAsync(CancellationToken cancel = default)
    {
        try
        {
            using var response = await Http.GetAsync(LatestApi, cancel);
            if (!response.IsSuccessStatusCode) return null;
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancel));
            var root = document.RootElement;
            var tag = root.GetProperty("tag_name").GetString() ?? "";
            var page = root.GetProperty("html_url").GetString() ?? "";
            var name = root.TryGetProperty("name", out var title) ? title.GetString() ?? tag : tag;
            string? download = null, setup = null;
            long size = 0, setupSize = 0;
            if (root.TryGetProperty("assets", out var assets))
            {
                foreach (var asset in assets.EnumerateArray())
                {
                    var assetName = asset.GetProperty("name").GetString() ?? "";
                    // The self-contained build: the one a teacher can open with nothing installed.
                    if (download is null && assetName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase) && !assetName.Contains("NeedsNode", StringComparison.OrdinalIgnoreCase))
                    {
                        download = asset.GetProperty("browser_download_url").GetString();
                        size = asset.TryGetProperty("size", out var bytes) ? bytes.GetInt64() : 0;
                    }
                    // The launcher travels only inside the setup program, so that is what updates it.
                    if (setup is null && assetName.Equals("TexasRevolutionSetup.exe", StringComparison.OrdinalIgnoreCase))
                    {
                        setup = asset.GetProperty("browser_download_url").GetString();
                        setupSize = asset.TryGetProperty("size", out var bytes) ? bytes.GetInt64() : 0;
                    }
                }
            }
            return new ReleaseInfo(tag, name, page, download, size, setup, setupSize);
        }
        catch { return null; }
    }

    /// <summary>Null when this copy has no release stamp, which means a working copy.</summary>
    public static bool? IsNewerThanInstalled(ReleaseInfo release)
    {
        var installed = AppPaths.InstalledRelease;
        if (string.IsNullOrWhiteSpace(installed)) return null;
        return !string.Equals(installed, release.Tag, StringComparison.OrdinalIgnoreCase);
    }
}
