using System.IO.Compression;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;

namespace TexasRevolution.Launcher;

/// <summary>One shipped file: where it goes, how long it is, and its SHA-256 in lower-case hex.</summary>
public sealed record ManifestFile(string Path, long Size, string Sha256);

/// <summary>
/// Every file a release ships, with its size and hash. Written by <c>scripts/package.ps1</c>
/// into the package as <c>release-manifest.json</c> and attached to the release as
/// <c>TexasRevolution-manifest.json</c>; the two are the same bytes.
/// </summary>
/// <remarks>
/// <para><c>format</c> is the oldest updater that can read the list. A launcher that knows only an
/// older format takes the whole download instead, so the list can change shape without stranding
/// anybody. <c>launcher</c> is the hash of the launcher's own sources the setup program was built
/// from (<c>LauncherId</c> in the csproj): a release whose launcher differs from the one running
/// cannot be reached by changing game files, because the launcher travels only inside the setup
/// program.</para>
///
/// <para>The launcher executable itself is not in the list - it is not in the update archive
/// either - and neither is the list.</para>
/// </remarks>
public sealed class ReleaseManifest
{
    /// <summary>The newest list format this launcher can read.</summary>
    public const int SupportedFormat = 1;
    /// <summary>The list's name inside a package.</summary>
    public const string FileName = "release-manifest.json";
    /// <summary>The list's name among a release's downloads.</summary>
    public const string AssetName = "TexasRevolution-manifest.json";

    public int Format { get; init; }
    public string Release { get; init; } = "";
    public string? Launcher { get; init; }
    public IReadOnlyList<ManifestFile> Files { get; init; } = Array.Empty<ManifestFile>();

    /// <summary>Read a list, refusing one that is malformed or names a file it may not write.</summary>
    /// <exception cref="DeltaUnusable">The list cannot be trusted to rebuild an installation.</exception>
    public static ReleaseManifest Parse(byte[] json)
    {
        try
        {
            using var document = JsonDocument.Parse(json.AsMemory(HasBom(json) ? 3 : 0));
            var root = document.RootElement;
            var format = root.GetProperty("format").GetInt32();
            var release = root.GetProperty("release").GetString() ?? "";
            var launcher = root.TryGetProperty("launcher", out var id) && id.ValueKind == JsonValueKind.String ? id.GetString() : null;
            var files = new List<ManifestFile>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            // A list from a newer format may carry anything; it is refused by format, not by shape.
            if (format <= SupportedFormat)
            {
                foreach (var entry in root.GetProperty("files").EnumerateArray())
                {
                    var path = entry.GetProperty("path").GetString() ?? "";
                    var size = entry.GetProperty("size").GetInt64();
                    var hash = (entry.GetProperty("sha256").GetString() ?? "").ToLowerInvariant();
                    if (!IsSafePath(path)) throw new DeltaUnusable($"its list of files names a place it may not write ({path})");
                    if (size < 0 || hash.Length != 64 || !hash.All(Uri.IsHexDigit)) throw new DeltaUnusable($"its list of files is damaged at {path}");
                    if (!seen.Add(path)) throw new DeltaUnusable($"its list of files names {path} twice");
                    files.Add(new ManifestFile(path, size, hash));
                }
                if (release.Length == 0 || files.Count == 0) throw new DeltaUnusable("its list of files is empty");
            }
            return new ReleaseManifest { Format = format, Release = release, Launcher = string.IsNullOrWhiteSpace(launcher) ? null : launcher, Files = files };
        }
        catch (DeltaUnusable) { throw; }
        catch (Exception error) when (error is JsonException or KeyNotFoundException or InvalidOperationException or FormatException)
        {
            throw new DeltaUnusable("its list of files could not be read");
        }
    }

    /// <summary>The list that came with the installed build, or null (a build from before lists, or a working copy).</summary>
    public static ReleaseManifest? ReadInstalled(string root)
    {
        try
        {
            var file = System.IO.Path.Combine(root, FileName);
            return File.Exists(file) ? Parse(File.ReadAllBytes(file)) : null;
        }
        catch { return null; }
    }

    private static bool HasBom(byte[] bytes) => bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF;

    /// <summary>
    /// Relative, forward slashes, no climbing out, and never the class data, the launcher, the
    /// update's own backup or the list itself. A list is read from the network; nothing it says
    /// may reach a file the full update would not have written either.
    /// </summary>
    public static bool IsSafePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || path.Contains('\\') || path.Contains(':') || path.StartsWith('/')) return false;
        var parts = path.Split('/');
        if (parts.Any(part => part.Length == 0 || part == "." || part == ".." || part.Trim() != part || part.EndsWith('.'))) return false;
        if (path.IndexOfAny(System.IO.Path.GetInvalidPathChars()) >= 0) return false;
        return !UpdateSwap.IsProtected(parts[0]) && !(parts.Length == 1 && parts[0].Equals(FileName, StringComparison.OrdinalIgnoreCase));
    }
}

/// <summary>The small download cannot be used; the reason is said to the teacher in plain words.</summary>
public sealed class DeltaUnusable : Exception
{
    public DeltaUnusable(string reason) : base(reason) { }
}

/// <summary>
/// Updating by fetching only the files that changed.
/// </summary>
/// <remarks>
/// <para>A release carries, beside the full downloads, its list of files and one set of changes
/// ("patch") from each of its recent predecessors that had the same launcher:
/// <c>TexasRevolution-Changes-From-&lt;tag&gt;.patch</c>, a zip of the files whose hash differs
/// from that release's. The launcher reads its own installed tag, takes the set of changes from
/// it, and builds the new version in staging: every installed file whose hash already matches
/// the new list is copied across, every other one comes out of the set of changes and is hashed
/// against the list. Staged, the result is byte for byte the build the full download would have
/// unpacked, and it goes in through exactly the same swap and rollback
/// (<see cref="UpdateSwap"/>).</para>
///
/// <para>Anything that stops that - no list, no set of changes from this release, a launcher
/// that has changed, a list in a newer format, a file that does not hash as the list says, a
/// download cut off - falls back to the full download, and the teacher is told why in a line.
/// Nothing is replaced until the staged build is complete.</para>
/// </remarks>
public static class DeltaUpdate
{
    public const string PatchPrefix = "TexasRevolution-Changes-From-";
    public const string PatchSuffix = ".patch";

    public static string PatchAssetName(string fromTag) => PatchPrefix + fromTag + PatchSuffix;

    /// <summary>The release a set of changes starts from, or null when the name is not one.</summary>
    public static string? PatchBase(string assetName) =>
        assetName.StartsWith(PatchPrefix, StringComparison.OrdinalIgnoreCase) && assetName.EndsWith(PatchSuffix, StringComparison.OrdinalIgnoreCase)
        && assetName.Length > PatchPrefix.Length + PatchSuffix.Length
            ? assetName[PatchPrefix.Length..^PatchSuffix.Length]
            : null;

    /// <summary>
    /// The hash of the sources this launcher was built from, stamped by <c>scripts/package.ps1</c>.
    /// Null for a build nobody packaged, which therefore always takes the full download.
    /// </summary>
    public static string? LauncherId { get; } =
        typeof(DeltaUpdate).Assembly.GetCustomAttributes<AssemblyMetadataAttribute>()
            .FirstOrDefault(attribute => attribute.Key == "LauncherId")?.Value is { Length: > 0 } id ? id.ToLowerInvariant() : null;

    /// <summary>Why the small download cannot even be tried for this release, or null.</summary>
    public static string? Refusal(ReleaseInfo release, string? installedTag, string? launcherId)
    {
        if (string.IsNullOrWhiteSpace(installedTag)) return "this copy has no release stamp";
        if (launcherId is null) return "this launcher was not built for small updates";
        if (release.ManifestUrl is null) return "that release has no list of its files";
        if (release.Patches is null || !release.Patches.ContainsKey(installedTag))
            return $"that release has no set of changes from {installedTag}";
        return null;
    }

    /// <summary>Why a downloaded list rules out the small download, or null.</summary>
    public static string? Refusal(ReleaseManifest manifest, string expectedTag, string? launcherId)
    {
        if (manifest.Format > ReleaseManifest.SupportedFormat) return "that release needs a newer launcher";
        if (!string.Equals(manifest.Release, expectedTag, StringComparison.OrdinalIgnoreCase)) return $"its list of files is for {manifest.Release}, not {expectedTag}";
        if (manifest.Launcher is null || !string.Equals(manifest.Launcher, launcherId, StringComparison.OrdinalIgnoreCase)) return "that release brings a new launcher";
        return null;
    }

    /// <summary>What the check can promise before anything is downloaded: the size, and whether it is only the changes.</summary>
    public static (long Bytes, bool Changes) Estimate(ReleaseInfo release, string? installedTag, string? launcherId)
    {
        if (Refusal(release, installedTag, launcherId) is null && release.Patches!.TryGetValue(installedTag!, out var patch))
            return (patch.Size + release.ManifestSize, true);
        return (release.SetupUrl is not null ? release.SetupSize : release.Size, false);
    }

    /// <summary>
    /// Copy into <paramref name="staged"/> every installed file that already matches the list, and
    /// return the ones that do not - changed, missing, or damaged on this disk.
    /// </summary>
    /// <remarks>
    /// The installed copy is read once: hashed as it is copied. A copy that does not match is
    /// deleted from staging again, so what staging holds is only ever verified.
    /// </remarks>
    public static List<ManifestFile> CopyUnchanged(string installed, ReleaseManifest manifest, string staged, IProgress<long>? read = null, CancellationToken cancel = default)
    {
        var needed = new List<ManifestFile>();
        long done = 0;
        foreach (var file in manifest.Files)
        {
            cancel.ThrowIfCancellationRequested();
            var source = Combine(installed, file.Path);
            var info = new FileInfo(source);
            if (!info.Exists || info.Length != file.Size) { needed.Add(file); continue; }
            var target = Combine(staged, file.Path);
            Directory.CreateDirectory(System.IO.Path.GetDirectoryName(target)!);
            string hash;
            using (var from = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete, 1 << 20))
                hash = CopyHashing(from, target);
            if (hash != file.Sha256) { File.Delete(target); needed.Add(file); }
            done += file.Size;
            read?.Report(done);
        }
        return needed;
    }

    /// <summary>
    /// Take the <paramref name="needed"/> files out of a set of changes into <paramref name="staged"/>,
    /// each checked against the list. Only files the list names are ever read out of the archive.
    /// </summary>
    /// <exception cref="DeltaUnusable">A needed file is missing from the set of changes, or does not match.</exception>
    public static void ApplyPatch(string patch, IReadOnlyCollection<ManifestFile> needed, string staged, CancellationToken cancel = default)
    {
        try
        {
            using var archive = ZipFile.OpenRead(patch);
            var entries = new Dictionary<string, ZipArchiveEntry>(StringComparer.OrdinalIgnoreCase);
            foreach (var entry in archive.Entries) entries[entry.FullName.Replace('\\', '/')] = entry;
            foreach (var file in needed)
            {
                cancel.ThrowIfCancellationRequested();
                if (!entries.TryGetValue(file.Path, out var entry)) throw new DeltaUnusable($"the set of changes does not include {file.Path}");
                if (entry.Length != file.Size) throw new DeltaUnusable($"{file.Path} in the set of changes is the wrong size");
                var target = Combine(staged, file.Path);
                Directory.CreateDirectory(System.IO.Path.GetDirectoryName(target)!);
                string hash;
                using (var from = entry.Open()) hash = CopyHashing(from, target);
                if (hash != file.Sha256)
                {
                    File.Delete(target);
                    throw new DeltaUnusable($"{file.Path} did not match the list of files after downloading");
                }
            }
        }
        catch (Exception error) when (error is InvalidDataException or EndOfStreamException)
        {
            throw new DeltaUnusable("the set of changes arrived damaged");
        }
    }

    /// <summary>
    /// The last word before a staged build is swapped in: every listed file is there at its
    /// listed size, and nothing else is but the list itself.
    /// </summary>
    public static void VerifyStaged(string staged, ReleaseManifest manifest)
    {
        foreach (var file in manifest.Files)
        {
            var info = new FileInfo(Combine(staged, file.Path));
            if (!info.Exists || info.Length != file.Size) throw new DeltaUnusable($"{file.Path} is missing from the new version");
        }
        var listed = new HashSet<string>(manifest.Files.Select(file => file.Path), StringComparer.OrdinalIgnoreCase) { ReleaseManifest.FileName };
        foreach (var path in Directory.EnumerateFiles(staged, "*", SearchOption.AllDirectories))
        {
            var relative = System.IO.Path.GetRelativePath(staged, path).Replace('\\', '/');
            if (!listed.Contains(relative)) throw new DeltaUnusable($"{relative} is in the new version but not in its list");
        }
    }

    /// <summary>
    /// Top-level files and folders the installed build's own list shipped and the new build does
    /// not. The swap moves them into its backup with everything else, so a rollback restores them.
    /// </summary>
    public static IReadOnlyList<string> Retired(string installed, string payload)
    {
        var previous = ReleaseManifest.ReadInstalled(installed);
        if (previous is null) return Array.Empty<string>();
        return previous.Files.Select(file => file.Path.Split('/')[0]).Append(ReleaseManifest.FileName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(name => !UpdateSwap.IsProtected(name)
                           && !File.Exists(System.IO.Path.Combine(payload, name)) && !Directory.Exists(System.IO.Path.Combine(payload, name))
                           && (File.Exists(System.IO.Path.Combine(installed, name)) || Directory.Exists(System.IO.Path.Combine(installed, name))))
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    /// <summary>A size as a teacher would say it: "412 KB", "160 MB".</summary>
    public static string Plain(long bytes) =>
        bytes < 1024 * 1024 ? $"{Math.Max(1, (bytes + 1023) / 1024)} KB"
        : bytes < 10L * 1024 * 1024 ? $"{bytes / 1048576.0:0.0} MB"
        : $"{Math.Round(bytes / 1048576.0)} MB";

    public static string Sha256Of(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    private static string Combine(string root, string relative) =>
        System.IO.Path.Combine(root, relative.Replace('/', System.IO.Path.DirectorySeparatorChar));

    private static string CopyHashing(Stream from, string target)
    {
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        using (var to = new FileStream(target, FileMode.Create, FileAccess.Write, FileShare.None, 1 << 20))
        {
            var buffer = new byte[1 << 20];
            int count;
            while ((count = from.Read(buffer, 0, buffer.Length)) > 0)
            {
                hash.AppendData(buffer, 0, count);
                to.Write(buffer, 0, count);
            }
        }
        return Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant();
    }
}
