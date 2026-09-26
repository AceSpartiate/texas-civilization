using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using TexasRevolution.Launcher;

// The small update's logic, test by test. Each test builds its own folders under the system
// temp folder and removes them. Names are what scripts/launcher-delta-injections.ps1 expects.

var only = args.FirstOrDefault();
var results = new List<(string Name, string? Failure)>();
var scratch = Path.Combine(Path.GetTempPath(), "tr-delta-tests-" + Guid.NewGuid().ToString("N")[..8]);
Directory.CreateDirectory(scratch);

const string Launcher = "1111111111111111111111111111111111111111111111111111111111111111";
const string OtherLauncher = "2222222222222222222222222222222222222222222222222222222222222222";

// The builds the tests move between. v1 is installed; v2 is the release being offered.
var v1 = new Dictionary<string, string>
{
    ["server/main.mjs"] = "// v1 server",
    ["public/index.html"] = "<p>the same in both</p>",
    ["public/art/big.png"] = new string('x', 300_000),
    ["sim/gone-in-v2.mjs"] = "// only in v1",
    ["Old.vbs"] = "' a top-level file v2 no longer ships",
    ["release.txt"] = "v1",
};
var v2 = new Dictionary<string, string>
{
    ["server/main.mjs"] = "// v2 server, longer",
    ["public/index.html"] = "<p>the same in both</p>",
    ["public/art/big.png"] = new string('x', 300_000),
    ["sim/new-in-v2.mjs"] = "// only in v2",
    ["release.txt"] = "v2",
};

void Test(string name, Action body)
{
    if (only is not null && !name.StartsWith(only, StringComparison.OrdinalIgnoreCase)) return;
    try { body(); results.Add((name, null)); }
    catch (Exception error) { results.Add((name, error.GetType().Name + ": " + error.Message)); }
}

void Assert(bool condition, string what) { if (!condition) throw new Exception(what); }

string Folder(string name)
{
    var path = Path.Combine(scratch, name + "-" + Guid.NewGuid().ToString("N")[..6]);
    Directory.CreateDirectory(path);
    return path;
}

string Hex(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();

void Write(string root, IDictionary<string, string> files)
{
    foreach (var (path, text) in files)
    {
        var full = Path.Combine(root, path.Replace('/', '\\'));
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        File.WriteAllText(full, text);
    }
}

byte[] ManifestJson(IDictionary<string, string> files, string release, string? launcher = Launcher, int format = 1)
{
    var entries = files.OrderBy(file => file.Key, StringComparer.Ordinal).Select(file =>
    {
        var bytes = Encoding.UTF8.GetBytes(file.Value);
        return $"{{\"path\":\"{file.Key}\",\"size\":{bytes.Length},\"sha256\":\"{Hex(bytes)}\"}}";
    });
    var id = launcher is null ? "" : $"\"launcher\":\"{launcher}\",";
    return Encoding.UTF8.GetBytes($"{{\"format\":{format},\"release\":\"{release}\",{id}\"files\":[{string.Join(",", entries)}]}}");
}

string Patch(IDictionary<string, string> files, IEnumerable<string> paths, Func<string, string>? tamper = null)
{
    var file = Path.Combine(Folder("patch"), "changes.patch");
    using var zip = ZipFile.Open(file, ZipArchiveMode.Create);
    foreach (var path in paths)
    {
        using var writer = new StreamWriter(zip.CreateEntry(path).Open());
        writer.Write(tamper is null ? files[path] : tamper(files[path]));
    }
    return file;
}

Dictionary<string, string> Read(string root) =>
    Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)
        .ToDictionary(path => Path.GetRelativePath(root, path).Replace('\\', '/'), path => Hex(File.ReadAllBytes(path)));

ReleaseInfo Release(string tag, bool manifest = true, string? patchFrom = "v1") =>
    new(tag, tag, "page", "https://example/zip", 1000, "https://example/setup", 250_000_000,
        manifest ? "https://example/manifest" : null, 40_000,
        patchFrom is null ? new Dictionary<string, (string, long)>() : new Dictionary<string, (string, long)> { [patchFrom] = ("https://example/patch", 412 * 1024) });

// A v1 installation with a class saved in it and its own list, as a v1 package would leave it.
string InstallV1()
{
    var root = Folder("installed");
    Write(root, v1);
    File.WriteAllBytes(Path.Combine(root, ReleaseManifest.FileName), ManifestJson(v1, "v1"));
    Directory.CreateDirectory(Path.Combine(root, "data"));
    File.WriteAllText(Path.Combine(root, "data", "classroom.json"), "{\"a teacher's class\":\"must survive\"}");
    File.WriteAllText(Path.Combine(root, UpdateSwap.ExeName), "the running launcher");
    return root;
}

// v2 staged the way the launcher stages it: unchanged files copied, the rest from the set of changes.
(string Staged, ReleaseManifest Manifest, byte[] Bytes) StageV2(string installed)
{
    var bytes = ManifestJson(v2, "v2");
    var manifest = ReleaseManifest.Parse(bytes);
    var staged = Folder("staged");
    var needed = DeltaUpdate.CopyUnchanged(installed, manifest, staged);
    DeltaUpdate.ApplyPatch(Patch(v2, needed.Select(file => file.Path)), needed, staged);
    File.WriteAllBytes(Path.Combine(staged, ReleaseManifest.FileName), bytes);
    DeltaUpdate.VerifyStaged(staged, manifest);
    return (staged, manifest, bytes);
}

Test("diff-needed: only changed, new and damaged files are fetched", () =>
{
    var installed = InstallV1();
    // Damaged on this disk: the right size, the wrong bytes.
    File.WriteAllText(Path.Combine(installed, "public", "index.html"), "<p>the same in b0th</p>");
    var manifest = ReleaseManifest.Parse(ManifestJson(v2, "v2"));
    var staged = Folder("staged");
    var needed = DeltaUpdate.CopyUnchanged(installed, manifest, staged).Select(file => file.Path).OrderBy(path => path, StringComparer.Ordinal).ToList();
    Assert(needed.SequenceEqual(new[] { "public/index.html", "release.txt", "server/main.mjs", "sim/new-in-v2.mjs" }), "needed " + string.Join(", ", needed));
    Assert(File.Exists(Path.Combine(staged, "public", "art", "big.png")), "an unchanged file was not copied into staging");
    Assert(!File.Exists(Path.Combine(staged, "public", "index.html")), "a damaged file was left in staging");
});

Test("stage-identical: the staged build is byte for byte the new build, removed files gone", () =>
{
    var installed = InstallV1();
    var (staged, _, bytes) = StageV2(installed);
    var expected = Folder("expected");
    Write(expected, v2);
    File.WriteAllBytes(Path.Combine(expected, ReleaseManifest.FileName), bytes);
    var got = Read(staged);
    var want = Read(expected);
    Assert(got.Count == want.Count && want.All(file => got.TryGetValue(file.Key, out var hash) && hash == file.Value),
        $"staged {string.Join(", ", got.Keys.OrderBy(k => k))} differs from the build");
    Assert(!got.ContainsKey("sim/gone-in-v2.mjs"), "a file v2 removed was staged");
});

Test("hash-tampered: a changed file that does not hash as listed is refused", () =>
{
    var installed = InstallV1();
    var manifest = ReleaseManifest.Parse(ManifestJson(v2, "v2"));
    var staged = Folder("staged");
    var needed = DeltaUpdate.CopyUnchanged(installed, manifest, staged);
    // Same length, one character different: only the hash can tell.
    var patch = Patch(v2, needed.Select(file => file.Path), text => text.Replace("v2 server", "v9 server"));
    try { DeltaUpdate.ApplyPatch(patch, needed, staged); }
    catch (DeltaUnusable) { Assert(!File.Exists(Path.Combine(staged, "server", "main.mjs")), "the tampered file was left in staging"); return; }
    throw new Exception("a tampered file was accepted");
});

Test("patch-missing-file: a set of changes without a needed file is refused", () =>
{
    var installed = InstallV1();
    var manifest = ReleaseManifest.Parse(ManifestJson(v2, "v2"));
    var staged = Folder("staged");
    var needed = DeltaUpdate.CopyUnchanged(installed, manifest, staged);
    var patch = Patch(v2, needed.Select(file => file.Path).Where(path => path != "sim/new-in-v2.mjs"));
    try { DeltaUpdate.ApplyPatch(patch, needed, staged); }
    catch (DeltaUnusable) { return; }
    throw new Exception("a set of changes missing a file was accepted");
});

Test("patch-damaged: a cut-off download is refused as unusable, not as a crash", () =>
{
    var installed = InstallV1();
    var manifest = ReleaseManifest.Parse(ManifestJson(v2, "v2"));
    var staged = Folder("staged");
    var needed = DeltaUpdate.CopyUnchanged(installed, manifest, staged);
    var patch = Patch(v2, needed.Select(file => file.Path));
    var whole = File.ReadAllBytes(patch);
    File.WriteAllBytes(patch, whole[..(whole.Length / 2)]);
    try { DeltaUpdate.ApplyPatch(patch, needed, staged); }
    catch (DeltaUnusable) { return; }
    throw new Exception("a cut-off set of changes was not reported as unusable");
});

Test("verify-extra: a staged file the list does not name is refused", () =>
{
    var installed = InstallV1();
    var (staged, manifest, _) = StageV2(installed);
    File.WriteAllText(Path.Combine(staged, "server", "stray.mjs"), "not in the list");
    try { DeltaUpdate.VerifyStaged(staged, manifest); }
    catch (DeltaUnusable) { return; }
    throw new Exception("a stray staged file passed");
});

Test("fallback-no-manifest: a release with no list takes the whole download", () =>
    Assert(DeltaUpdate.Refusal(Release("v2", manifest: false), "v1", Launcher) is not null, "no refusal"));

Test("fallback-no-patch: no set of changes from the installed release takes the whole download", () =>
    Assert(DeltaUpdate.Refusal(Release("v2", patchFrom: "v0"), "v1", Launcher) is not null, "no refusal"));

Test("fallback-no-launcher-id: a launcher nobody packaged takes the whole download", () =>
    Assert(DeltaUpdate.Refusal(Release("v2"), "v1", null) is not null, "no refusal"));

Test("fallback-format: a list in a newer format takes the whole download", () =>
{
    var manifest = ReleaseManifest.Parse(Encoding.UTF8.GetBytes($"{{\"format\":2,\"release\":\"v2\",\"launcher\":\"{Launcher}\",\"chunks\":[]}}"));
    Assert(DeltaUpdate.Refusal(manifest, "v2", Launcher) is not null, "no refusal");
});

Test("fallback-launcher: a release with a different launcher takes the whole download", () =>
    Assert(DeltaUpdate.Refusal(ReleaseManifest.Parse(ManifestJson(v2, "v2", OtherLauncher)), "v2", Launcher) is not null, "no refusal"));

Test("fallback-release: a list for another release takes the whole download", () =>
    Assert(DeltaUpdate.Refusal(ReleaseManifest.Parse(ManifestJson(v2, "v3")), "v2", Launcher) is not null, "no refusal"));

Test("accept: a release with its list, a set from here and the same launcher takes the changes", () =>
{
    Assert(DeltaUpdate.Refusal(Release("v2"), "v1", Launcher) is null, "the release was refused: " + DeltaUpdate.Refusal(Release("v2"), "v1", Launcher));
    var reason = DeltaUpdate.Refusal(ReleaseManifest.Parse(ManifestJson(v2, "v2")), "v2", Launcher);
    Assert(reason is null, "the list was refused: " + reason);
});

Test("unsafe-paths: a list naming the class data, the launcher or a way out is refused", () =>
{
    foreach (var path in new[] { "../outside.txt", "data/classroom.json", "DATA/x", "TexasRevolution.exe", "C:/Windows/x", "server\\main.mjs", "/root.txt", "release-manifest.json", ".update-backup/journal.txt", "server/../../x" })
    {
        var bytes = Encoding.UTF8.GetBytes($"{{\"format\":1,\"release\":\"v2\",\"launcher\":\"{Launcher}\",\"files\":[{{\"path\":\"{path.Replace("\\", "\\\\")}\",\"size\":1,\"sha256\":\"{new string('a', 64)}\"}}]}}");
        try { ReleaseManifest.Parse(bytes); }
        catch (DeltaUnusable) { continue; }
        throw new Exception($"{path} was accepted");
    }
});

Test("swap-saves-retired: the swap leaves the class alone and removes what v2 no longer ships", () =>
{
    var installed = InstallV1();
    var save = Hex(File.ReadAllBytes(Path.Combine(installed, "data", "classroom.json")));
    var (staged, _, _) = StageV2(installed);
    UpdateSwap.Apply(staged, installed, DeltaUpdate.Retired(installed, staged));
    Assert(Hex(File.ReadAllBytes(Path.Combine(installed, "data", "classroom.json"))) == save, "the class data changed");
    Assert(!File.Exists(Path.Combine(installed, "Old.vbs")), "a top-level file v2 no longer ships is still there");
    Assert(!File.Exists(Path.Combine(installed, "sim", "gone-in-v2.mjs")), "a file v2 removed is still there");
    Assert(File.ReadAllText(Path.Combine(installed, "server", "main.mjs")) == v2["server/main.mjs"], "the game did not move to v2");
    Assert(File.ReadAllText(Path.Combine(installed, UpdateSwap.ExeName)) == "the running launcher", "the launcher was touched");
    Assert(!Directory.Exists(Path.Combine(installed, UpdateSwap.BackupFolder)), "the backup was left behind");
});

Test("swap-rollback: a swap that fails part way puts everything back, retired files included", () =>
{
    var installed = InstallV1();
    var before = Read(installed);
    var (staged, _, _) = StageV2(installed);
    using (File.Open(Path.Combine(installed, "server", "main.mjs"), FileMode.Open, FileAccess.Read, FileShare.None))
    {
        try { UpdateSwap.Apply(staged, installed, DeltaUpdate.Retired(installed, staged)); throw new Exception("the swap did not fail with server\\ held open"); }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }
    var after = Read(installed);
    Assert(after.Count == before.Count && before.All(file => after.TryGetValue(file.Key, out var hash) && hash == file.Value),
        "after the rollback: " + string.Join(", ", before.Keys.Where(key => !after.ContainsKey(key) || after[key] != before[key]).Concat(after.Keys.Where(key => !before.ContainsKey(key)))));
});

Test("interrupted-swap: a launch after a swap cut off mid-way restores a retired file", () =>
{
    var installed = InstallV1();
    var backup = Path.Combine(installed, UpdateSwap.BackupFolder);
    Directory.CreateDirectory(backup);
    File.WriteAllText(Path.Combine(backup, "swap-in-progress.txt"), "simulated power cut");
    File.Move(Path.Combine(installed, "Old.vbs"), Path.Combine(backup, "Old.vbs"));
    File.WriteAllLines(Path.Combine(backup, "journal.txt"), new[] { "retired:Old.vbs" });
    Assert(UpdateSwap.CleanUp(installed), "CleanUp did not report a rollback");
    Assert(File.ReadAllText(Path.Combine(installed, "Old.vbs")) == v1["Old.vbs"], "the retired file was not put back");
    Assert(!Directory.Exists(backup), "the backup was left behind");
});

Test("assets: the list and sets are found, and no launcher from before takes a set for the game", () =>
{
    // The sets are listed first, as GitHub may order them: a launcher from before 2026-09-16
    // takes the first .zip without NeedsNode as the whole game.
    var json = $$"""
        {"tag_name":"v2","html_url":"page","name":"v2","assets":[
          {"name":"{{DeltaUpdate.PatchAssetName("v1")}}","browser_download_url":"u/patch","size":412},
          {"name":"{{ReleaseManifest.AssetName}}","browser_download_url":"u/manifest","size":40},
          {"name":"TexasRevolution-Gonzales-2.zip","browser_download_url":"u/zip","size":170000000},
          {"name":"TexasRevolution-Gonzales-2-NeedsNode.zip","browser_download_url":"u/needsnode","size":130000000},
          {"name":"TexasRevolutionSetup.exe","browser_download_url":"u/setup","size":250000000}]}
        """;
    var release = Updates.Parse(json);
    Assert(release.DownloadUrl == "u/zip", "the update archive old launchers take is now " + release.DownloadUrl);
    Assert(release.SetupUrl == "u/setup", "the setup program was not found");
    Assert(release.ManifestUrl == "u/manifest", "the list was not found");
    Assert(release.Patches is not null && release.Patches.TryGetValue("v1", out var patch) && patch.Url == "u/patch" && patch.Size == 412, "the set of changes from v1 was not found");
});

Test("estimate: the check promises the size of the changes, or of the whole game", () =>
{
    var (bytes, changes) = DeltaUpdate.Estimate(Release("v2"), "v1", Launcher);
    Assert(changes && bytes == 412 * 1024 + 40_000, $"with a set of changes: {bytes} changes={changes}");
    (bytes, changes) = DeltaUpdate.Estimate(Release("v2", patchFrom: null), "v1", Launcher);
    Assert(!changes && bytes == 250_000_000, $"without one: {bytes} changes={changes}");
});

Test("plain-sizes: sizes are said as a teacher would say them", () =>
{
    Assert(DeltaUpdate.Plain(412 * 1024) == "412 KB", DeltaUpdate.Plain(412 * 1024));
    Assert(DeltaUpdate.Plain(160L * 1024 * 1024) == "160 MB", DeltaUpdate.Plain(160L * 1024 * 1024));
    Assert(DeltaUpdate.Plain(5 * 1024 * 1024 + 300 * 1024) == "5.3 MB", DeltaUpdate.Plain(5 * 1024 * 1024 + 300 * 1024));
});

try { Directory.Delete(scratch, recursive: true); } catch { /* the temp folder is emptied by Windows in time */ }
foreach (var (name, failure) in results) Console.WriteLine(failure is null ? $"PASS {name}" : $"FAIL {name} -- {failure}");
Console.WriteLine($"{results.Count(result => result.Failure is null)} of {results.Count} passed");
return results.Any(result => result.Failure is not null) ? 1 : 0;
