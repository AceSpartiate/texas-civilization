using System.IO.Compression;
using System.Text;

namespace TexasRevolution.Launcher;

/// <summary>
/// The two ways a setup program carries the game and the plain launcher it installs.
/// </summary>
/// <remarks>
/// <para>Owner, 2026-10-03, choosing <i>"Small launcher in patch"</i>: a launcher change used to cost every
/// installed copy the whole setup program (about 690 MB), because the installed <c>TexasRevolution.exe</c>
/// <b>was</b> the setup program, the game embedded in it as a resource. Now the launcher is built once on its own,
/// with no game in it (about 84 MB, mostly .NET), and that <b>plain launcher</b> is what every setup installs and what
/// a set of changes carries when the launcher changes (<see cref="DeltaUpdate"/>). A setup carries it one of two ways.
/// Owner, later the same day, after ThreatDown (Malwarebytes) blocked the emailed small installer on a coworker's
/// machine where the older setup had installed fine: <i>"keep supporting both"</i>.</para>
///
/// <para><b>Classic</b> (<see cref="SetupKind.Classic"/>) - <c>TexasRevolutionSetup.exe</c>, the default and the one
/// the emailed installer downloads. The game is an embedded resource exactly as in every setup up to v2026.10.03.1
/// (<see cref="PayloadResource"/>), and the plain launcher is a second embedded resource
/// (<see cref="LauncherResource"/>). Nothing follows the single-file bundle. A classic setup from before 2026-10-03
/// has no launcher resource and installs a copy of itself, as it always did.</para>
///
/// <para><b>Appended</b> (<see cref="SetupKind.Appended"/>) - <c>TexasRevolutionSetup-Appended.exe</c>, the format of
/// f8fb8653: the plain launcher, then the game zip, then a trailer. .NET runs it as the launcher, because a
/// single-file bundle is found by an offset written into its own head and the bytes after it are never read. It is
/// about 84 MB smaller (.NET once), and kept so it can be tried on a machine whose antivirus refuses the classic one.</para>
///
/// <code>
///   [ the launcher, LauncherLength bytes ][ the game zip, PayloadLength bytes ][ trailer, 32 bytes ]
///   trailer = "TXREV-SETUP-1" padded with zeros to 16 bytes, LauncherLength (int64 LE), PayloadLength (int64 LE)
/// </code>
///
/// <para>Both are written by <c>scripts/package.ps1</c> (the appended one by <c>New-SetupProgram</c> in
/// <c>scripts/release-changes.ps1</c>). Either installs the same game and the same plain launcher, and an update that
/// downloads either - it runs it with <c>--extract</c> - stages the same build.</para>
/// </remarks>
public enum SetupKind { None, Classic, Appended }

public static class SetupLayout
{
    public const string Magic = "TXREV-SETUP-1";
    public const int TrailerLength = 32;
    /// <summary>The game, embedded in a classic setup (the name every setup up to v2026.10.03.1 used).</summary>
    public const string PayloadResource = "TexasRevolution.Launcher.payload.zip";
    /// <summary>The plain launcher, embedded in a classic setup from 2026-10-03.</summary>
    public const string LauncherResource = "TexasRevolution.Launcher.launcher.exe";

    /// <summary>Where the launcher ends and the game begins in an appended setup program.</summary>
    public sealed record Parts(long LauncherLength, long PayloadOffset, long PayloadLength);

    /// <summary>
    /// What kind of setup this program is, from its embedded resources (<paramref name="resource"/> opens one by
    /// name, or returns null) and its own file. An installed launcher, or a working copy's build, is neither.
    /// </summary>
    public static SetupKind KindOf(Func<string, Stream?> resource, string? exePath)
    {
        using (var payload = resource(PayloadResource))
            if (payload is not null) return SetupKind.Classic;
        return ReadFile(exePath) is not null ? SetupKind.Appended : SetupKind.None;
    }

    /// <summary>
    /// Install the game this setup carries into <paramref name="target"/>, never into <c>data</c>, and the plain
    /// launcher beside it as <c>TexasRevolution.exe</c> - whichever way this setup carries them.
    /// </summary>
    /// <exception cref="InvalidOperationException">This program carries no game.</exception>
    public static void Install(Func<string, Stream?> resource, string exePath, string target, IProgress<(int Percent, string What)>? progress = null)
    {
        var payload = resource(PayloadResource);
        if (payload is null) { Extract(exePath, target, progress); return; }
        using (payload) ExtractGame(payload, target, progress);

        progress?.Report((92, "Installing the launcher…"));
        var installedExe = Path.Combine(target, UpdateSwap.ExeName);
        // Running from the target already: Windows will not overwrite a running program, and the setup is a
        // working launcher too.
        if (SamePath(exePath, installedExe)) return;
        using var launcher = resource(LauncherResource);
        if (launcher is not null)
        {
            using var to = new FileStream(installedExe, FileMode.Create, FileAccess.Write, FileShare.None);
            launcher.CopyTo(to, 1 << 20);
        }
        // A classic setup from before 2026-10-03 carries no plain launcher, and installs itself as it always did.
        else File.Copy(exePath, installedExe, overwrite: true);
    }

    /// <summary>The parts of an appended setup program, or null when the stream is not one.</summary>
    public static Parts? Read(Stream file)
    {
        try
        {
            var length = file.Length;
            if (length < TrailerLength + 2) return null;
            var trailer = new byte[TrailerLength];
            file.Seek(length - TrailerLength, SeekOrigin.Begin);
            file.ReadExactly(trailer);
            var magic = Encoding.ASCII.GetBytes(Magic);
            for (var i = 0; i < 16; i++)
                if (trailer[i] != (i < magic.Length ? magic[i] : (byte)0)) return null;
            var launcher = BitConverter.ToInt64(trailer, 16);
            var payload = BitConverter.ToInt64(trailer, 24);
            if (launcher <= 0 || payload <= 0 || launcher > length || payload > length || launcher + payload + TrailerLength != length) return null;
            return new Parts(launcher, launcher, payload);
        }
        catch (Exception error) when (error is IOException or EndOfStreamException or NotSupportedException) { return null; }
    }

    /// <summary>The parts of the appended setup program at <paramref name="path"/>, or null.</summary>
    public static Parts? ReadFile(string? path)
    {
        if (string.IsNullOrEmpty(path) || !File.Exists(path)) return null;
        try
        {
            using var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
            return Read(file);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException) { return null; }
    }

    /// <summary>
    /// Unpack the game carried by the appended setup program at <paramref name="setup"/> into
    /// <paramref name="target"/>, and write the launcher at its head beside it as <c>TexasRevolution.exe</c>.
    /// </summary>
    /// <exception cref="InvalidOperationException">The file carries no game.</exception>
    public static void Extract(string setup, string target, IProgress<(int Percent, string What)>? progress = null)
    {
        using var file = new FileStream(setup, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        var parts = Read(file) ?? throw new InvalidOperationException("This copy carries nothing to install. Download the setup file again.");
        ExtractGame(new Slice(file, parts.PayloadOffset, parts.PayloadLength), target, progress);

        progress?.Report((92, "Installing the launcher…"));
        var installedExe = Path.Combine(target, UpdateSwap.ExeName);
        if (SamePath(setup, installedExe)) return;
        file.Seek(0, SeekOrigin.Begin);
        using var launcher = new FileStream(installedExe, FileMode.Create, FileAccess.Write, FileShare.None);
        CopyExactly(file, launcher, parts.LauncherLength);
    }

    /// <summary>
    /// Unpack a game zip - one TexasRevolution folder - straight into <paramref name="target"/>, never into
    /// <c>data</c>.
    /// </summary>
    /// <remarks>
    /// Its contents go straight into the chosen folder, so nobody ends up with TexasRevolution\TexasRevolution.
    /// Separators are normalised first and everything is decided on the normalised string: Windows writes these
    /// entries with backslashes, and testing the original for a trailing '/' said every folder was a file.
    /// </remarks>
    private static void ExtractGame(Stream zip, string target, IProgress<(int Percent, string What)>? progress)
    {
        Directory.CreateDirectory(target);
        using var archive = new ZipArchive(zip, ZipArchiveMode.Read);
        var items = archive.Entries.Select(entry =>
        {
            var full = entry.FullName.Replace('\\', '/');
            var slash = full.IndexOf('/');
            return (Entry: entry, Relative: slash >= 0 ? full[(slash + 1)..] : full, IsFolder: full.EndsWith('/') || entry.Name.Length == 0);
        }).Where(item => item.Relative.Length > 0
                         // A teacher's saved classes are not ours to overwrite.
                         && !item.Relative.StartsWith("data/", StringComparison.OrdinalIgnoreCase)).ToList();
        var total = items.Count(item => !item.IsFolder);
        var done = 0;
        var root = Path.GetFullPath(target).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        foreach (var item in items)
        {
            var destination = Path.GetFullPath(Path.Combine(target, item.Relative.Replace('/', Path.DirectorySeparatorChar)));
            if (!destination.StartsWith(root, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException($"The setup file names a place outside the folder ({item.Relative}). Download it again.");
            if (item.IsFolder) { Directory.CreateDirectory(destination); continue; }
            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            item.Entry.ExtractToFile(destination, overwrite: true);
            done++;
            if (total > 0) progress?.Report((done * 90 / total, $"Unpacking… {done} of {total} files"));
        }
    }

    private static bool SamePath(string a, string b) =>
        string.Equals(Path.GetFullPath(a), Path.GetFullPath(b), StringComparison.OrdinalIgnoreCase);

    private static void CopyExactly(Stream from, Stream to, long count)
    {
        var buffer = new byte[1 << 20];
        while (count > 0)
        {
            var read = from.Read(buffer, 0, (int)Math.Min(buffer.Length, count));
            if (read <= 0) throw new EndOfStreamException("The setup file ended early. Download it again.");
            to.Write(buffer, 0, read);
            count -= read;
        }
    }

    /// <summary>A read-only window on part of a file: the game zip inside an appended setup program.</summary>
    private sealed class Slice : Stream
    {
        private readonly Stream _inner;
        private readonly long _start;
        private readonly long _length;
        private long _position;

        public Slice(Stream inner, long start, long length) { _inner = inner; _start = start; _length = length; }

        public override bool CanRead => true;
        public override bool CanSeek => true;
        public override bool CanWrite => false;
        public override long Length => _length;
        public override long Position
        {
            get => _position;
            set => _position = value < 0 ? throw new IOException("Before the start of the game.") : value;
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            if (_position >= _length) return 0;
            _inner.Seek(_start + _position, SeekOrigin.Begin);
            var read = _inner.Read(buffer, offset, (int)Math.Min(count, _length - _position));
            _position += read;
            return read;
        }

        public override long Seek(long offset, SeekOrigin origin) => Position = origin switch
        {
            SeekOrigin.Begin => offset,
            SeekOrigin.Current => _position + offset,
            _ => _length + offset,
        };

        public override void Flush() { }
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    }
}
