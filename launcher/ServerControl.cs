using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;

namespace TexasRevolution.Launcher;

public sealed record ServerStatus(
    bool Running, int Pid, string? HostUrl, IReadOnlyList<string> JoinUrls, bool Stopping,
    string? ClassCode = null, int Joined = 0)
{
    public static readonly ServerStatus Stopped = new(false, 0, null, Array.Empty<string>(), false);
    public string? PrimaryJoinUrl => JoinUrls.Count > 0 ? JoinUrls[0] : null;
}

/// <summary>
/// Starting and stopping the classroom, by driving the scripts that already know how.
/// </summary>
/// <remarks>
/// Every method here that changes the server's state shells out to PowerShell. That looks
/// indirect and it is on purpose: the stop sequence authenticates with the private Host
/// credential, asks the class to checkpoint and pause, and then *waits* rather than ending
/// the process, because a forced stop leaves a save lock that costs a teacher their class.
/// That is written once, in scripts/stop.ps1, and regression-tested. Reimplementing it in
/// C# would make two things to keep right.
/// </remarks>
public sealed class ServerControl
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(3) };
    // A separate client that keeps cookies, because reading the class code means being the
    // Host: `/api/host` answers with a session cookie and `/api/state` wants it back.
    private static readonly CookieContainer Cookies = new();
    private static readonly HttpClient AsHost = new(new HttpClientHandler { CookieContainer = Cookies })
    { Timeout = TimeSpan.FromSeconds(3) };

    public async Task<ServerStatus> StatusAsync()
    {
        var info = AppPaths.Resolve();
        if (info is null) return ServerStatus.Stopped;
        try
        {
            using var response = await Http.GetAsync($"http://127.0.0.1:{info.Port}/health");
            if (!response.IsSuccessStatusCode) return ServerStatus.Stopped;
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var root = document.RootElement;
            // Something else may be sitting on the port. Answering is not enough.
            if (root.TryGetProperty("application", out var name) && name.GetString() != "texas-revolution-foundation")
                return ServerStatus.Stopped;
            var joins = new List<string>();
            if (root.TryGetProperty("joinUrls", out var urls) && urls.ValueKind == JsonValueKind.Array)
                foreach (var candidate in urls.EnumerateArray())
                    if (candidate.TryGetProperty("url", out var url) && url.GetString() is { } text) joins.Add(text);
            var hostUrl = AppPaths.HostUrl(info);
            var (code, joined) = await ClassAsync(info.Port, hostUrl);
            return new ServerStatus(
                true,
                root.TryGetProperty("pid", out var pid) ? pid.GetInt32() : 0,
                hostUrl,
                joins,
                root.TryGetProperty("stopping", out var stopping) && stopping.GetBoolean(),
                code,
                joined);
        }
        catch { return ServerStatus.Stopped; }
    }

    /// <summary>
    /// The six characters a student types, and how many households have joined.
    /// </summary>
    /// <remarks>
    /// Read by authenticating as the Host with the credential the running server wrote to
    /// its own data folder, not from an open endpoint. The class code is shown on a
    /// projector, but `docs/DEPLOYMENT.md` is explicit that Host information must not become
    /// available because somebody guessed a route, and this launcher has no more right to
    /// widen that than anything else does. It is on the same machine and can read the same
    /// file the teacher's browser was given; that is the whole of its privilege.
    /// </remarks>
    private static async Task<(string? Code, int Joined)> ClassAsync(int port, string? hostUrl)
    {
        if (hostUrl is null) return (null, 0);
        var hash = hostUrl.LastIndexOf('#');
        if (hash < 0) return (null, 0);
        var key = hostUrl[(hash + 1)..].Trim();
        var origin = $"http://127.0.0.1:{port}";
        try
        {
            var state = await ReadStateAsync(origin);
            if (state is null)
            {
                // Not signed in yet, or the class was rotated and the cookie is stale.
                using var content = new StringContent(JsonSerializer.Serialize(new { key }), Encoding.UTF8, "application/json");
                using var login = await AsHost.PostAsync($"{origin}/api/host", content);
                if (!login.IsSuccessStatusCode) return (null, 0);
                state = await ReadStateAsync(origin);
            }
            if (state is null) return (null, 0);
            using var document = state;
            var root = document.RootElement;
            var code = root.TryGetProperty("sessionCode", out var value) ? value.GetString() : null;
            var joined = root.TryGetProperty("connected", out var count) && count.ValueKind == JsonValueKind.Number ? count.GetInt32() : 0;
            return (code, joined);
        }
        catch { return (null, 0); }
    }

    private static async Task<JsonDocument?> ReadStateAsync(string origin)
    {
        try
        {
            using var response = await AsHost.GetAsync($"{origin}/api/state");
            if (!response.IsSuccessStatusCode) return null;
            var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            // A student cookie would answer too, and would carry no class code.
            return document.RootElement.TryGetProperty("sessionCode", out _) ? document : null;
        }
        catch { return null; }
    }

    public Task<(bool Ok, string Output)> StartAsync() =>
        RunScriptAsync("launch.ps1", "-NoBrowser -NoDialog");

    public Task<(bool Ok, string Output)> StopAsync() =>
        RunScriptAsync("stop.ps1", "-NoDialog");

    private static async Task<(bool Ok, string Output)> RunScriptAsync(string script, string arguments)
    {
        var path = Path.Combine(AppPaths.Scripts, script);
        if (!File.Exists(path)) return (false, $"The launcher files are incomplete: {script} is missing.");
        // Written to a file rather than read down a pipe, and this is not fussiness. The
        // script starts the classroom server and leaves it running; the server inherits the
        // pipe, so reading it to the end does not finish until the *server* stops. Measured:
        // a pipe here makes Start hang for the length of the lesson. A file handle the
        // server also holds costs nothing and closes when PowerShell exits.
        var log = Path.Combine(Path.GetTempPath(), $"texas-{script}-{Environment.ProcessId}.log");
        var start = new ProcessStartInfo("cmd.exe",
            $"/c powershell.exe -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy RemoteSigned -File \"{path}\" {arguments} > \"{log}\" 2>&1")
        {
            WorkingDirectory = AppPaths.Root,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        try
        {
            using var process = Process.Start(start);
            if (process is null) return (false, "Windows would not start PowerShell.");
            await process.WaitForExitAsync();
            var output = "";
            try { if (File.Exists(log)) output = (await File.ReadAllTextAsync(log)).Trim(); } catch { /* nothing to add */ }
            // The signature of a package that was downloaded and never unblocked. It is the
            // one failure that writes no error file, so it has to be named here.
            if (process.ExitCode != 0 && output.Contains("not digitally signed", StringComparison.OrdinalIgnoreCase))
                output = "Windows blocked the launcher's own scripts because this copy was downloaded from the Internet. "
                       + "Right-click the folder's original .zip, tick Unblock on the General tab, and unpack it again.";
            else if (process.ExitCode != 0 && StaleLock()) output = StaleLockMessage;
            return (process.ExitCode == 0, output);
        }
        catch (Exception error) { return (false, error.Message); }
    }

    private const string StaleLockMessage =
        "The last class did not shut down cleanly, so its save is still marked as in use and this one will not "
        + "start on top of it. Nothing has been lost. The class is safe where it is, and a developer can clear "
        + "the leftover mark by following \"Recovering a stale lock\" in docs/RECOVERY.md.";

    /// <summary>
    /// Did the server refuse to start because a save lock was left behind?
    /// </summary>
    /// <remarks>
    /// This is the failure a power cut or a force-quit leaves, and it is the one a teacher is
    /// most likely to meet and least able to read: the log holds a Node stack trace saying
    /// EEXIST. Deliberately only *recognised* here and never cleared - the lock exists to stop
    /// two servers writing one class, and an application that quietly removed its own safety
    /// catch whenever it was inconvenient would be no safety catch at all. docs/RECOVERY.md
    /// owns the procedure, and it checks the owning process and backs the save up first.
    /// </remarks>
    private static bool StaleLock()
    {
        try
        {
            var info = AppPaths.Resolve();
            if (info is null) return false;
            var log = Path.Combine(info.DataDir, "server.stderr.log");
            if (!File.Exists(log)) return false;
            var text = File.ReadAllText(log);
            return text.Contains("classroom.json.lock", StringComparison.OrdinalIgnoreCase)
                && (text.Contains("EEXIST", StringComparison.OrdinalIgnoreCase) || text.Contains("save lock", StringComparison.OrdinalIgnoreCase));
        }
        catch { return false; }
    }
}
