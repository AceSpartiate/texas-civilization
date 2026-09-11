using System.Diagnostics;
using System.Text.Json;

namespace TexasRevolution.Launcher;

public sealed record ServerStatus(bool Running, int Pid, string? HostUrl, IReadOnlyList<string> JoinUrls, bool Stopping)
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
            return new ServerStatus(
                true,
                root.TryGetProperty("pid", out var pid) ? pid.GetInt32() : 0,
                AppPaths.HostUrl(info),
                joins,
                root.TryGetProperty("stopping", out var stopping) && stopping.GetBoolean());
        }
        catch { return ServerStatus.Stopped; }
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
            return (process.ExitCode == 0, output);
        }
        catch (Exception error) { return (false, error.Message); }
    }
}
