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

byte[] ManifestJson(IDictionary<string, string> files, string release, string? launcher = Launcher, int format = 1, string? launcherExe = null)
{
    var entries = files.OrderBy(file => file.Key, StringComparer.Ordinal).Select(file =>
    {
        var bytes = Encoding.UTF8.GetBytes(file.Value);
        return $"{{\"path\":\"{file.Key}\",\"size\":{bytes.Length},\"sha256\":\"{Hex(bytes)}\"}}";
    });
    var id = launcher is null ? "" : $"\"launcher\":\"{launcher}\",";
    var exe = launcherExe is null ? "" : $"\"launcherExe\":{{\"size\":{Encoding.UTF8.GetByteCount(launcherExe)},\"sha256\":\"{Hex(Encoding.UTF8.GetBytes(launcherExe))}\"}},";
    return Encoding.UTF8.GetBytes($"{{\"format\":{format},\"release\":\"{release}\",{id}{exe}\"files\":[{string.Join(",", entries)}]}}");
}

// The new plain launcher a release with a different launcher brings in its set of changes (2026-10-03).
const string NewLauncherBytes = "the new launcher, about 90 MB in a real release";

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
    // takes the first .zip without NeedsNode as the whole game. The small setup a teacher emails
    // (TexasRevolutionInstaller.exe, from 2026-09-30) is listed before the whole one: it is not a
    // launcher, and a launcher that took it for its update would unpack nothing.
    var json = $$"""
        {"tag_name":"v2","html_url":"page","name":"v2","assets":[
          {"name":"TexasRevolutionInstaller.exe","browser_download_url":"u/installer","size":173568},
          {"name":"{{DeltaUpdate.PatchAssetName("v1")}}","browser_download_url":"u/patch","size":412},
          {"name":"{{ReleaseManifest.AssetName}}","browser_download_url":"u/manifest","size":40},
          {"name":"TexasRevolution-Gonzales-2.zip","browser_download_url":"u/zip","size":170000000},
          {"name":"TexasRevolution-Gonzales-2-NeedsNode.zip","browser_download_url":"u/needsnode","size":130000000},
          {"name":"TexasRevolutionSetup.exe","browser_download_url":"u/setup","size":250000000}]}
        """;
    var release = Updates.Parse(json);
    Assert(release.DownloadUrl == "u/zip", "the update archive old launchers take is now " + release.DownloadUrl);
    Assert(release.SetupUrl == "u/setup" && release.SetupSize == 250000000, "the setup program is now " + release.SetupUrl);
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

// ---------------------------------------------------------------- a new launcher in the set of changes (2026-10-03)
// Owner, 2026-10-03: "Small launcher in patch". v2 here has another launcher; its list names its plain
// launcher file, and its set of changes carries that file as TexasRevolution.exe.

var v2WithExe = new Dictionary<string, string>(v2) { [UpdateSwap.ExeName] = NewLauncherBytes };

(string Staged, ReleaseManifest Manifest) StageNewLauncher(string installed, Func<string, string>? tamper = null, bool leaveOutExe = false)
{
    var bytes = ManifestJson(v2, "v2", OtherLauncher, launcherExe: NewLauncherBytes);
    var manifest = ReleaseManifest.Parse(bytes);
    var staged = Folder("staged");
    var needed = DeltaUpdate.WithLauncher(DeltaUpdate.CopyUnchanged(installed, manifest, staged), manifest, Launcher);
    var paths = needed.Select(file => file.Path).Where(path => !(leaveOutExe && path == UpdateSwap.ExeName));
    DeltaUpdate.ApplyPatch(Patch(v2WithExe, paths, tamper), needed, staged);
    File.WriteAllBytes(Path.Combine(staged, ReleaseManifest.FileName), bytes);
    DeltaUpdate.VerifyStaged(staged, manifest, withLauncher: true);
    return (staged, manifest);
}

Test("launcher-accept: a different launcher whose list names its launcher file takes the changes, and brings it", () =>
{
    var manifest = ReleaseManifest.Parse(ManifestJson(v2, "v2", OtherLauncher, launcherExe: NewLauncherBytes));
    var reason = DeltaUpdate.Refusal(manifest, "v2", Launcher);
    Assert(reason is null, "the list was refused: " + reason);
    Assert(manifest.LauncherExe is { Path: UpdateSwap.ExeName } exe && exe.Size == NewLauncherBytes.Length, "the launcher file was not read");
    var needed = DeltaUpdate.WithLauncher(new List<ManifestFile>(), manifest, Launcher);
    Assert(needed.Count == 1 && needed[0].Path == UpdateSwap.ExeName, "the new launcher is not among the files to take");
    // The same launcher keeps the one running, whatever the list says about its file.
    var same = ReleaseManifest.Parse(ManifestJson(v2, "v2", Launcher, launcherExe: NewLauncherBytes));
    Assert(DeltaUpdate.WithLauncher(new List<ManifestFile>(), same, Launcher).Count == 0, "the same launcher was taken again");
});

Test("launcher-stage: the new launcher is staged, checked and swapped in with the game; the old one renamed aside", () =>
{
    var installed = InstallV1();
    var save = Hex(File.ReadAllBytes(Path.Combine(installed, "data", "classroom.json")));
    var (staged, _) = StageNewLauncher(installed);
    Assert(File.ReadAllText(Path.Combine(staged, UpdateSwap.ExeName)) == NewLauncherBytes, "the new launcher was not staged");
    UpdateSwap.Apply(staged, installed, DeltaUpdate.Retired(installed, staged));
    Assert(File.ReadAllText(Path.Combine(installed, UpdateSwap.ExeName)) == NewLauncherBytes, "the installed launcher is not the new one");
    Assert(File.ReadAllText(Path.Combine(installed, UpdateSwap.OldExeName)) == "the running launcher", "the running launcher was not renamed aside");
    Assert(File.ReadAllText(Path.Combine(installed, "server", "main.mjs")) == v2["server/main.mjs"], "the game did not move to v2");
    Assert(Hex(File.ReadAllBytes(Path.Combine(installed, "data", "classroom.json"))) == save, "the class data changed");
});

Test("launcher-hash: a new launcher that does not hash as listed is refused", () =>
{
    var installed = InstallV1();
    try { StageNewLauncher(installed, text => text == NewLauncherBytes ? text.Replace("new", "NEW") : text); }
    catch (DeltaUnusable) { return; }
    throw new Exception("a tampered launcher was accepted");
});

Test("launcher-missing: a set of changes without the new launcher it needs is refused", () =>
{
    var installed = InstallV1();
    try { StageNewLauncher(installed, leaveOutExe: true); }
    catch (DeltaUnusable) { return; }
    throw new Exception("a set without the new launcher was accepted");
});

Test("launcher-verify: the staged build must hold the new launcher when one is brought, and not otherwise", () =>
{
    var installed = InstallV1();
    var (staged, manifest) = StageNewLauncher(installed);
    // Brought but not expected: a launcher the list did not call for is a stray file.
    try { DeltaUpdate.VerifyStaged(staged, manifest, withLauncher: false); throw new Exception("a staged launcher nobody asked for passed"); }
    catch (DeltaUnusable) { }
    File.Delete(Path.Combine(staged, UpdateSwap.ExeName));
    try { DeltaUpdate.VerifyStaged(staged, manifest, withLauncher: true); throw new Exception("a staged build without its new launcher passed"); }
    catch (DeltaUnusable) { }
});

Test("launcher-rollback: a swap that fails after the new launcher went in puts the old launcher back", () =>
{
    var installed = InstallV1();
    var before = Read(installed);
    var (staged, _) = StageNewLauncher(installed);
    using (File.Open(Path.Combine(installed, "server", "main.mjs"), FileMode.Open, FileAccess.Read, FileShare.None))
    {
        try { UpdateSwap.Apply(staged, installed, DeltaUpdate.Retired(installed, staged)); throw new Exception("the swap did not fail with server\\ held open"); }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }
    var after = Read(installed);
    Assert(File.ReadAllText(Path.Combine(installed, UpdateSwap.ExeName)) == "the running launcher", "the old launcher was not put back");
    Assert(after.Count == before.Count && before.All(file => after.TryGetValue(file.Key, out var hash) && hash == file.Value),
        "after the rollback: " + string.Join(", ", before.Keys.Where(key => !after.ContainsKey(key) || after[key] != before[key]).Concat(after.Keys.Where(key => !before.ContainsKey(key)))));
});

Test("launcher-list: the list cannot move the launcher or carry a damaged one", () =>
{
    var placed = ReleaseManifest.Parse(Encoding.UTF8.GetBytes($"{{\"format\":1,\"release\":\"v2\",\"launcher\":\"{OtherLauncher}\",\"launcherExe\":{{\"path\":\"../elsewhere.exe\",\"size\":5,\"sha256\":\"{new string('a', 64)}\"}},\"files\":[{{\"path\":\"a.txt\",\"size\":1,\"sha256\":\"{new string('b', 64)}\"}}]}}"));
    Assert(placed.LauncherExe?.Path == UpdateSwap.ExeName, "the list put the launcher at " + placed.LauncherExe?.Path);
    foreach (var bad in new[] { $"{{\"size\":0,\"sha256\":\"{new string('a', 64)}\"}}", "{\"size\":5,\"sha256\":\"abc\"}" })
    {
        try { ReleaseManifest.Parse(Encoding.UTF8.GetBytes($"{{\"format\":1,\"release\":\"v2\",\"launcher\":\"{OtherLauncher}\",\"launcherExe\":{bad},\"files\":[{{\"path\":\"a.txt\",\"size\":1,\"sha256\":\"{new string('b', 64)}\"}}]}}")); }
        catch (DeltaUnusable) { continue; }
        throw new Exception($"a damaged launcher entry was accepted: {bad}");
    }
});

Test("launcher-asset: a set carrying the launcher is found, under a name no launcher from before reads", () =>
{
    var name = DeltaUpdate.PatchAssetName("v1", withLauncher: true);
    Assert(!name.StartsWith(DeltaUpdate.PatchPrefix, StringComparison.OrdinalIgnoreCase), name + " would be read by a launcher from before, which would offer the changes and then refuse them");
    Assert(!name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase), name + " would be taken for the game");
    var release = Updates.Parse($$"""
        {"tag_name":"v2","html_url":"page","name":"v2","assets":[
          {"name":"{{name}}","browser_download_url":"u/launcher-patch","size":94371840},
          {"name":"TexasRevolutionSetup.exe","browser_download_url":"u/setup","size":690000000}]}
        """);
    Assert(release.Patches is not null && release.Patches.TryGetValue("v1", out var patch) && patch.Url == "u/launcher-patch", "the set carrying the launcher was not found");
    var (bytes, changes) = DeltaUpdate.Estimate(release with { ManifestUrl = "u/m", ManifestSize = 50_000 }, "v1", Launcher);
    Assert(changes && bytes == 94371840 + 50_000, $"the check promised {bytes} changes={changes}");
});

// The setup program: the plain launcher, the game zip appended, a trailer (launcher/SetupLayout.cs).
byte[] Trailer(long launcher, long payload)
{
    var trailer = new byte[SetupLayout.TrailerLength];
    Encoding.ASCII.GetBytes(SetupLayout.Magic).CopyTo(trailer, 0);
    BitConverter.GetBytes(launcher).CopyTo(trailer, 16);
    BitConverter.GetBytes(payload).CopyTo(trailer, 24);
    return trailer;
}

Test("setup-layout: the setup installs the game and the plain launcher at its head, never the whole setup, never data", () =>
{
    var folder = Folder("setup");
    var game = Path.Combine(folder, "game");
    Write(Path.Combine(game, "TexasRevolution"), new Dictionary<string, string> { ["server/main.mjs"] = "// the game", ["release.txt"] = "v2", ["data/classroom.json"] = "somebody else's class" });
    var zip = Path.Combine(folder, "game.zip");
    ZipFile.CreateFromDirectory(game, zip);
    var launcher = Encoding.UTF8.GetBytes("MZ the plain launcher");
    var payload = File.ReadAllBytes(zip);
    var setup = Path.Combine(folder, "TexasRevolutionSetup.exe");
    File.WriteAllBytes(setup, launcher.Concat(payload).Concat(Trailer(launcher.Length, payload.Length)).ToArray());
    var parts = SetupLayout.ReadFile(setup);
    Assert(parts is not null && parts.LauncherLength == launcher.Length && parts.PayloadOffset == launcher.Length && parts.PayloadLength == payload.Length, "the setup was not read");

    var target = Folder("target");
    Directory.CreateDirectory(Path.Combine(target, "data"));
    File.WriteAllText(Path.Combine(target, "data", "classroom.json"), "this teacher's class");
    SetupLayout.Extract(setup, target);
    Assert(File.ReadAllText(Path.Combine(target, "server", "main.mjs")) == "// the game", "the game was not unpacked");
    Assert(File.ReadAllText(Path.Combine(target, "data", "classroom.json")) == "this teacher's class", "the class data was written over");
    Assert(File.ReadAllBytes(Path.Combine(target, UpdateSwap.ExeName)).SequenceEqual(launcher), "the installed launcher is not the plain launcher at the setup's head");

    // Not setups: the plain launcher itself, and a trailer whose lengths do not add up.
    var plain = Path.Combine(folder, "plain.exe");
    File.WriteAllBytes(plain, launcher);
    Assert(SetupLayout.ReadFile(plain) is null, "the plain launcher was taken for a setup");
    var wrong = Path.Combine(folder, "wrong.exe");
    File.WriteAllBytes(wrong, launcher.Concat(payload).Concat(Trailer(launcher.Length + 1, payload.Length)).ToArray());
    Assert(SetupLayout.ReadFile(wrong) is null, "a setup whose lengths do not add up was read");
});

try { Directory.Delete(scratch, recursive: true); } catch { /* the temp folder is emptied by Windows in time */ }
foreach (var (name, failure) in results) Console.WriteLine(failure is null ? $"PASS {name}" : $"FAIL {name} -- {failure}");
Console.WriteLine($"{results.Count(result => result.Failure is null)} of {results.Count} passed");
return results.Any(result => result.Failure is not null) ? 1 : 0;
