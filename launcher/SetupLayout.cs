using System.IO.Compression;
using System.Text;

namespace TexasRevolution.Launcher;

/// <summary>
/// How the setup program carries the game, from 2026-10-03: the plain launcher, then the game as a
/// zip, then a short trailer saying where one ends and the other begins.
/// </summary>
/// <remarks>
/// <para>Owner, 2026-10-03, choosing <i>"Small launcher in patch"</i>: a launcher change used to cost every
/// installed copy the whole setup program (about 690 MB), because the installed <c>TexasRevolution.exe</c>
/// <b>was</b> the setup program, the game embedded in it as a resource. Now the launcher is built once, on its
/// own and with no game in it (about 90 MB, mostly .NET), and the setup program is that launcher with the game
/// appended:</para>
///
/// <code>
///   [ the launcher, LauncherLength bytes ][ the game zip, PayloadLength bytes ][ trailer, 32 bytes ]
///   trailer = "TXREV-SETUP-1" padded with zeros to 16 bytes, LauncherLength (int64 LE), PayloadLength (int64 LE)
/// </code>
///
/// <para>Windows and .NET run the file exactly as they run the launcher alone: a single-file bundle is found by
/// an offset written into its own head, and bytes after it are never read. So the setup is still one download that
/// knows how to install itself, with .NET in it once - and the launcher it installs is the first
/// <c>LauncherLength</c> bytes of itself, byte for byte the launcher a set of changes carries when the launcher
/// changes (<see cref="DeltaUpdate"/>). The installed copy no longer carries a game, which saves about 600 MB
/// of disk; a memory stick takes <c>TexasRevolutionSetup.exe</c> itself.</para>
///
/// <para>Written by <c>New-SetupProgram</c> in <c>scripts/release-changes.ps1</c>; read here. A file with no
/// trailer, or one whose lengths do not add up to the file, carries no game: a working copy's
/// <c>dotnet build</c>, or an installed launcher.</para>
/// </remarks>
public static class SetupLayout
{
    public const string Magic = "TXREV-SETUP-1";
    public const int TrailerLength = 32;

    /// <summary>Where the launcher ends and the game begins in a setup program.</summary>
    public sealed record Parts(long LauncherLength, long PayloadOffset, long PayloadLength);

    /// <summary>The parts of a setup program, or null when the stream is not one.</summary>
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

    /// <summary>The parts of the setup program at <paramref name="path"/>, or null.</summary>
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
    /// Unpack the game carried by the setup program at <paramref name="setup"/> into <paramref name="target"/>,
    /// never into <c>data</c>, and write the launcher it carries beside it as <c>TexasRevolution.exe</c>.
    /// </summary>
    /// <remarks>
    /// The archive holds one TexasRevolution folder; its contents go straight into the chosen folder, so nobody
    /// ends up with TexasRevolution\TexasRevolution. Separators are normalised first and everything is decided on
    /// the normalised string: Windows writes these entries with backslashes, and testing the original for a
    /// trailing '/' said every folder was a file.
    /// </remarks>
    /// <exception cref="InvalidOperationException">The file carries no game.</exception>
    public static void Extract(string setup, string target, IProgress<(int Percent, string What)>? progress = null)
    {
        using var file = new FileStream(setup, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        var parts = Read(file) ?? throw new InvalidOperationException("This copy carries nothing to install. Download the setup file again.");
        Directory.CreateDirectory(target);
        using (var archive = new ZipArchive(new Slice(file, parts.PayloadOffset, parts.PayloadLength), ZipArchiveMode.Read))
        {
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

        progress?.Report((92, "Installing the launcher…"));
        var installedExe = Path.Combine(target, UpdateSwap.ExeName);
        // Running from the target already (a setup renamed TexasRevolution.exe and opened where it is to
        // install): Windows will not overwrite a running program, and the setup is a working launcher too.
        if (string.Equals(Path.GetFullPath(setup), Path.GetFullPath(installedExe), StringComparison.OrdinalIgnoreCase)) return;
        file.Seek(0, SeekOrigin.Begin);
        using var launcher = new FileStream(installedExe, FileMode.Create, FileAccess.Write, FileShare.None);
        CopyExactly(file, launcher, parts.LauncherLength);
    }

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

    /// <summary>A read-only window on part of a file: the game zip inside the setup program.</summary>
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
