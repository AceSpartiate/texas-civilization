using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

namespace TexasRevolution.WebSetup
{
    internal enum Problem { NoInternet, Unreachable, DiskFull, Damaged, Blocked, Cancelled, Failed }

    /// <summary>A failure, already sorted into what a teacher can be told about it.</summary>
    internal sealed class SetupProblem : Exception
    {
        public readonly Problem Kind;
        /// <summary>For not enough room: the size of the download.</summary>
        public long Needed;
        public SetupProblem(Problem kind, string detail) : base(detail) { Kind = kind; }
    }

    /// <summary>The full setup as the latest release describes it.</summary>
    internal sealed class Asset
    {
        public string Url;
        /// <summary>Bytes, or -1 when the release could not be asked and the download must say.</summary>
        public long Size = -1;
        /// <summary>Lower-case hex SHA-256 from GitHub's own record of the file, or null when it gave none.</summary>
        public string Sha256;
        public string Tag;
    }

    /// <summary>
    /// Finding the full setup, downloading it, checking it, and running it.
    /// </summary>
    internal sealed class Download
    {
        /// <summary>
        /// The one asset this downloads. Launchers already in classrooms download exactly this name
        /// to update themselves (launcher/Updates.cs), so it will always mean the whole setup.
        /// </summary>
        public const string SetupName = "TexasRevolutionSetup.exe";

        public const int Retries = 5;           // a dropped connection is resumed this many times in a row
        private const int BufferSize = 81920;
        private readonly Options _options;
        private volatile bool _cancelled;
        private volatile HttpWebRequest _current;
        /// <summary>The asset the half-downloaded file belongs to, so Try again resumes only the same file.</summary>
        private string _partialFor;
        /// <summary>Told the number of the try when a dropped connection is about to be tried again.</summary>
        public Action<int> Retrying;

        public Download(Options options) { _options = options; }

        public string Folder { get { return _options.Folder; } }
        public string SetupPath { get { return Path.Combine(_options.Folder, SetupName); } }
        private string PartPath { get { return SetupPath + ".part"; } }

        /// <summary>
        /// TLS 1.2 or better, and a school's proxy answered with the teacher's own sign-in.
        /// </summary>
        /// <remarks>
        /// The program is marked as written for .NET 4.8 (Program.cs), which lets Windows choose the
        /// protocol - TLS 1.3 where Windows has it, 1.2 otherwise. If this computer's .NET has been told
        /// to use a fixed list instead, TLS 1.2 is added to it, because GitHub accepts nothing older.
        /// </remarks>
        public static void PrepareNetwork()
        {
            try { AppContext.SetSwitch("Switch.System.Net.DontEnableSystemDefaultTlsVersions", false); } catch { }
            var protocols = ServicePointManager.SecurityProtocol;
            if (protocols != SecurityProtocolType.SystemDefault)
                ServicePointManager.SecurityProtocol = protocols | SecurityProtocolType.Tls12;
            try
            {
                var proxy = WebRequest.DefaultWebProxy;
                if (proxy != null) proxy.Credentials = CredentialCache.DefaultNetworkCredentials;
            }
            catch { /* no proxy settings to read */ }
        }

        public void Cancel()
        {
            _cancelled = true;
            var request = _current;
            if (request != null) { try { request.Abort(); } catch { } }
        }

        private void ThrowIfCancelled()
        {
            if (_cancelled) throw new SetupProblem(Problem.Cancelled, "Cancelled.");
        }

        // ------------------------------------------------------------------ finding it

        /// <summary>
        /// The latest release's full setup: its address, size and SHA-256 from GitHub's list of the
        /// release's files, or - when that list cannot be had (a network that lets github.com through
        /// but not api.github.com, or GitHub's limit of sixty questions an hour from one school's
        /// address) - the stable address of the latest release's setup, with its size taken from the
        /// download itself.
        /// </summary>
        /// <remarks>
        /// ceiling: on that fallback there is no SHA-256 to check, only the size the download announces (and HTTPS). A
        /// small published file of the setup's SHA-256, beside it on the release, would close that if it is found to matter.
        /// </remarks>
        public Asset Find()
        {
            try
            {
                var asset = AskRelease();
                if (asset != null) return asset;
            }
            catch (SetupProblem problem) { if (problem.Kind == Problem.Cancelled) throw; }
            catch (Exception) { ThrowIfCancelled(); }
            ThrowIfCancelled();
            return new Asset { Url = _options.Fallback };
        }

        private Asset AskRelease()
        {
            var request = Request(_options.Api);
            request.Accept = "application/vnd.github+json";
            request.Timeout = 20000;
            string json;
            _current = request;
            try
            {
                using (var response = (HttpWebResponse)request.GetResponse())
                using (var reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
                    json = reader.ReadToEnd();
            }
            finally { _current = null; }
            var serializer = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };
            var release = serializer.DeserializeObject(json) as IDictionary<string, object>;
            if (release == null) return null;
            object assets;
            if (!release.TryGetValue("assets", out assets) || !(assets is IEnumerable)) return null;
            foreach (var item in (IEnumerable)assets)
            {
                var entry = item as IDictionary<string, object>;
                if (entry == null) continue;
                // By its exact name: the release also carries this small setup, and a set of other files.
                if (!string.Equals(Text(entry, "name"), SetupName, StringComparison.OrdinalIgnoreCase)) continue;
                var url = Text(entry, "browser_download_url");
                if (url == null) return null;
                var asset = new Asset { Url = url, Tag = Text(release, "tag_name") };
                object size;
                if (entry.TryGetValue("size", out size) && size != null)
                    asset.Size = Convert.ToInt64(size, CultureInfo.InvariantCulture);
                // GitHub's own SHA-256 of the file as it was uploaded ("sha256:<hex>"), on releases from mid-2025.
                var digest = Text(entry, "digest");
                if (digest != null && digest.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase) && digest.Length == 7 + 64)
                    asset.Sha256 = digest.Substring(7).ToLowerInvariant();
                return asset;
            }
            return null;
        }

        private static string Text(IDictionary<string, object> entry, string key)
        {
            object value;
            return entry.TryGetValue(key, out value) ? value as string : null;
        }

        private static HttpWebRequest Request(string url)
        {
            var request = (HttpWebRequest)WebRequest.Create(url);
            // GitHub refuses a request with no User-Agent, and an honest one costs nothing.
            request.UserAgent = "TexasRevolutionSetup-Web";
            request.AllowAutoRedirect = true;
            request.AutomaticDecompression = DecompressionMethods.None;
            request.Timeout = 30000;
            request.ReadWriteTimeout = 60000;
            return request;
        }

        // ------------------------------------------------------------------ downloading it

        /// <summary>
        /// A file already downloaded by an earlier try that GitHub's record says is this release's
        /// setup (its size and SHA-256 both) - for Try again after Windows would not start it.
        /// Anything else in the way is removed.
        /// </summary>
        public bool AlreadyHave(Asset asset)
        {
            if (!File.Exists(SetupPath)) return false;
            if (asset.Size > 0 && asset.Sha256 != null && new FileInfo(SetupPath).Length == asset.Size && Hash(SetupPath, null) == asset.Sha256)
                return true;
            File.Delete(SetupPath);
            return false;
        }

        /// <summary>A half-finished file from a run that was closed part way cannot be trusted to be this release.</summary>
        /// <remarks>
        /// ceiling: a download is resumed within one run (and its Try again), never after the window was closed. Keeping the
        /// half with a note of the release it belongs to is worth writing if teachers are found closing it part way.
        /// </remarks>
        public void ClearLeftovers()
        {
            try { if (File.Exists(PartPath)) File.Delete(PartPath); } catch { }
            _partialFor = null;
        }

        /// <param name="report">(bytes so far, bytes in all), from the worker thread.</param>
        /// <param name="sizeKnown">Called once the size is known, before any of it is written.</param>
        /// <returns>The size of the whole file, now all on disk.</returns>
        public long Fetch(Asset asset, Action<long> sizeKnown, Action<long, long> report)
        {
            Directory.CreateDirectory(_options.Folder);
            var identity = asset.Url + "|" + asset.Size + "|" + asset.Sha256;
            if (_partialFor != identity) { try { File.Delete(PartPath); } catch { } }
            _partialFor = identity;
            if (asset.Size > 0) { CheckRoom(asset.Size); sizeKnown(asset.Size); }

            var total = asset.Size;
            var failures = 0;
            while (true)
            {
                ThrowIfCancelled();
                long have = File.Exists(PartPath) ? new FileInfo(PartPath).Length : 0;
                if (total > 0 && have > total) { File.Delete(PartPath); have = 0; }
                if (total > 0 && have == total) return total;
                var before = have;
                try
                {
                    total = FetchOnce(asset, total, have, sizeKnown, report);
                }
                catch (SetupProblem) { throw; }
                catch (Exception error)
                {
                    ThrowIfCancelled();
                    if (IsDiskFull(error)) throw new SetupProblem(Problem.DiskFull, error.Message);
                    if (IsFinal(error)) throw;
                    var now = File.Exists(PartPath) ? new FileInfo(PartPath).Length : 0;
                    // A connection that dropped after bringing more is a new start, not another failure.
                    failures = now > before ? 1 : failures + 1;
                    if (failures > Retries) throw;
                    if (Retrying != null) Retrying(failures);
                    Pause(1000 * failures);
                }
            }
        }

        /// <summary>One request: from the start, or from where the last one was cut off. Returns the file's whole size.</summary>
        private long FetchOnce(Asset asset, long total, long have, Action<long> sizeKnown, Action<long, long> report)
        {
            var request = Request(asset.Url);
            if (have > 0) request.AddRange(have);
            _current = request;
            try
            {
                using (var response = (HttpWebResponse)request.GetResponse())
                {
                    ThrowIfCancelled();
                    // A school's filter answers with a page of its own rather than the file.
                    var type = response.ContentType ?? "";
                    if (type.StartsWith("text/", StringComparison.OrdinalIgnoreCase))
                        throw new SetupProblem(Problem.Unreachable, "a web page (" + type + ") came back instead of the game - a network filter, most likely");

                    var resumed = response.StatusCode == HttpStatusCode.PartialContent;
                    long announced;
                    if (resumed)
                    {
                        long start;
                        announced = ContentRange(response.Headers["Content-Range"], out start);
                        if (start != have) { response.Close(); File.Delete(PartPath); throw new IOException("the server resumed from the wrong place"); }
                    }
                    else
                    {
                        announced = response.ContentLength;
                        have = 0;   // asked to resume and sent the whole file instead: start again
                    }
                    if (announced > 0)
                    {
                        // The size GitHub's list gave is the size the file must be. A download that says
                        // otherwise is not this release's setup, and none of it is kept.
                        if (total > 0 && announced != total)
                        {
                            response.Close();
                            File.Delete(PartPath);
                            throw new SetupProblem(Problem.Damaged, "the download is " + Bytes(announced) + " where the release says " + Bytes(total));
                        }
                        if (total <= 0) { CheckRoom(announced); sizeKnown(announced); }
                        total = announced;
                    }
                    if (total <= 0) throw new SetupProblem(Problem.Damaged, "the download did not say how large it is, so it could not be checked");

                    using (var source = response.GetResponseStream())
                    using (var target = new FileStream(PartPath, have > 0 ? FileMode.Append : FileMode.Create, FileAccess.Write, FileShare.None, BufferSize))
                    {
                        var buffer = new byte[BufferSize];
                        var done = have;
                        int read;
                        while ((read = source.Read(buffer, 0, buffer.Length)) > 0)
                        {
                            ThrowIfCancelled();
                            if (done + read > total) throw new SetupProblem(Problem.Damaged, "the download is larger than the release says");
                            target.Write(buffer, 0, read);
                            done += read;
                            report(done, total);
                        }
                        // A connection closed early can look like a finished one; the length says which.
                        if (done < total) throw new IOException("the connection closed after " + Size(done) + " of " + Size(total));
                    }
                    return total;
                }
            }
            catch (WebException error)
            {
                ThrowIfCancelled();
                var status = error.Response as HttpWebResponse;
                // Asked to resume past the end of what the server has: start again from nothing.
                if (status != null && (int)status.StatusCode == 416) { try { File.Delete(PartPath); } catch { } }
                throw;
            }
            finally { _current = null; }
        }

        /// <summary>"bytes 100-199/200": the start, and the whole size.</summary>
        private static long ContentRange(string header, out long start)
        {
            start = -1;
            if (header == null) return -1;
            var space = header.IndexOf(' ');
            var dash = header.IndexOf('-');
            var slash = header.IndexOf('/');
            if (space < 0 || dash < space || slash < dash) return -1;
            long total;
            long.TryParse(header.Substring(space + 1, dash - space - 1), NumberStyles.None, CultureInfo.InvariantCulture, out start);
            return long.TryParse(header.Substring(slash + 1), NumberStyles.None, CultureInfo.InvariantCulture, out total) ? total : -1;
        }

        /// <summary>An answer that retrying will not change: the file is not there, or a filter said no.</summary>
        private static bool IsFinal(Exception error)
        {
            var web = error as WebException;
            if (web == null) return false;
            var response = web.Response as HttpWebResponse;
            if (response == null) return web.Status == WebExceptionStatus.TrustFailure;
            var code = (int)response.StatusCode;
            return code >= 400 && code < 500 && code != 408 && code != 416 && code != 429;
        }

        private void Pause(int milliseconds)
        {
            for (var waited = 0; waited < milliseconds; waited += 100)
            {
                ThrowIfCancelled();
                Thread.Sleep(100);
            }
        }

        /// <summary>Refuse before starting a download the disk cannot hold.</summary>
        private void CheckRoom(long bytes)
        {
            long free;
            try { free = new DriveInfo(Path.GetPathRoot(_options.Folder)).AvailableFreeSpace; }
            catch { return; /* a drive that will not say is tried, and a full one fails as it writes */ }
            long partial = File.Exists(PartPath) ? new FileInfo(PartPath).Length : 0;
            if (free < bytes - partial + 64L * 1024 * 1024)
                throw new SetupProblem(Problem.DiskFull, "this computer has " + Size(free) + " free on " + Path.GetPathRoot(_options.Folder).TrimEnd('\\')) { Needed = bytes };
        }

        public static bool IsDiskFull(Exception error)
        {
            var code = error.HResult & 0xFFFF;
            return error is IOException && (code == 112 || code == 39);   // ERROR_DISK_FULL, ERROR_HANDLE_DISK_FULL
        }

        // ------------------------------------------------------------------ checking it

        /// <summary>
        /// The downloaded file is the release's setup: the size the release gave, GitHub's SHA-256 of it
        /// when GitHub gave one, and a Windows program at all. Only then is it moved into place.
        /// </summary>
        public void Check(Asset asset, long total, Action<long, long> report)
        {
            var length = new FileInfo(PartPath).Length;
            if (length != total) Refuse("the download is " + Bytes(length) + ", not " + Bytes(total));
            using (var file = File.OpenRead(PartPath))
            {
                if (file.ReadByte() != 'M' || file.ReadByte() != 'Z') Refuse("what came down is not a Windows program");
            }
            if (asset.Sha256 != null)
            {
                var hash = Hash(PartPath, report);
                if (hash != asset.Sha256) Refuse("its SHA-256 is not the one GitHub recorded for the release's setup");
            }
            if (File.Exists(SetupPath)) File.Delete(SetupPath);
            File.Move(PartPath, SetupPath);
            _partialFor = null;
        }

        private void Refuse(string why)
        {
            try { File.Delete(PartPath); } catch { }
            _partialFor = null;
            throw new SetupProblem(Problem.Damaged, why);
        }

        private string Hash(string path, Action<long, long> report)
        {
            using (var sha = SHA256.Create())
            using (var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, BufferSize))
            {
                var buffer = new byte[1024 * 1024];
                long done = 0;
                int read;
                while ((read = file.Read(buffer, 0, buffer.Length)) > 0)
                {
                    ThrowIfCancelled();
                    sha.TransformBlock(buffer, 0, read, null, 0);
                    done += read;
                    if (report != null) report(done, file.Length);
                }
                sha.TransformFinalBlock(buffer, 0, 0);
                var hex = new StringBuilder(64);
                foreach (var b in sha.Hash) hex.Append(b.ToString("x2", CultureInfo.InvariantCulture));
                return hex.ToString();
            }
        }

        // ------------------------------------------------------------------ running it

        /// <summary>
        /// Start the setup exactly as a double-click in Explorer would: through the shell, with no
        /// arguments, in its own folder. The setup decides it is a setup - and not the launcher - because
        /// there is no game beside it (launcher/Installer.cs <c>IsInsideInstallation</c>), and this folder
        /// never has one.
        /// </summary>
        public Process Start()
        {
            ThrowIfCancelled();
            var start = new ProcessStartInfo(SetupPath)
            {
                UseShellExecute = true,
                WorkingDirectory = _options.Folder,
            };
            try
            {
                var process = Process.Start(start);
                if (process == null) throw new SetupProblem(Problem.Blocked, "Windows did not start it");
                return process;
            }
            catch (System.ComponentModel.Win32Exception error)
            {
                throw new SetupProblem(Problem.Blocked, error.Message + " (" + error.NativeErrorCode + ")");
            }
        }

        /// <summary>
        /// The setup copies itself into the installation, so once it has closed this copy has done its
        /// job. It is removed whether or not the teacher went on to install.
        /// </summary>
        /// <remarks>
        /// ceiling: a teacher who closes the setup without installing downloads it again next time.
        /// Keeping it to be used again is worth writing if that is found to happen.
        /// </remarks>
        public void Remove()
        {
            for (var tries = 0; tries < 20; tries++)
            {
                try
                {
                    if (File.Exists(SetupPath)) File.Delete(SetupPath);
                    if (File.Exists(PartPath)) File.Delete(PartPath);
                    if (Directory.Exists(_options.Folder) && Directory.GetFileSystemEntries(_options.Folder).Length == 0)
                        Directory.Delete(_options.Folder);
                    return;
                }
                catch (IOException) { Thread.Sleep(250); }
                catch (UnauthorizedAccessException) { Thread.Sleep(250); }
            }
        }

        // ------------------------------------------------------------------ saying what went wrong

        /// <summary>A failure sorted into what a teacher can be told.</summary>
        public SetupProblem Sort(Exception error)
        {
            var known = error as SetupProblem;
            if (known != null) return known;
            if (_cancelled) return new SetupProblem(Problem.Cancelled, "Cancelled.");
            if (IsDiskFull(error)) return new SetupProblem(Problem.DiskFull, error.Message);
            if (error is WebException || error is IOException || error is System.Net.Sockets.SocketException)
            {
                var web = error as WebException;
                var noName = web != null && web.Status == WebExceptionStatus.NameResolutionFailure;
                if (_options.Offline || !NetworkInterface.GetIsNetworkAvailable() || (noName && !WindowsSaysOnline()))
                    return new SetupProblem(Problem.NoInternet, error.Message);
                return new SetupProblem(Problem.Unreachable, error.Message);
            }
            if (error is UnauthorizedAccessException)
                return new SetupProblem(Problem.Failed, "this computer would not let the download be saved in " + _options.Folder);
            return new SetupProblem(Problem.Failed, error.Message);
        }

        /// <summary>
        /// What the network icon in the corner of the screen says. Asked only when a name could not be
        /// looked up, because a school that hides GitHub's name looks the same from here as no internet.
        /// </summary>
        private static bool WindowsSaysOnline()
        {
            try
            {
                var type = Type.GetTypeFromCLSID(new Guid("DCB00C01-570F-4A9B-8D69-199FDBA5723B"));   // NetworkListManager
                var manager = Activator.CreateInstance(type);
                return (bool)type.InvokeMember("IsConnectedToInternet", BindingFlags.GetProperty, null, manager, null);
            }
            catch { return true; }
        }

        /// <summary>Sizes as a teacher would say them.</summary>
        public static string Size(long bytes)
        {
            if (bytes < 1024 * 1024) return Math.Max(1, (bytes + 512) / 1024) + " KB";
            if (bytes < 10L * 1024 * 1024 * 1024) return ((bytes + 512 * 1024) / (1024 * 1024)).ToString("N0", CultureInfo.InvariantCulture) + " MB";
            return ((bytes + 512L * 1024 * 1024) / (1024L * 1024 * 1024)).ToString("N0", CultureInfo.InvariantCulture) + " GB";
        }

        /// <summary>Exact, for a size that is wrong by a little.</summary>
        private static string Bytes(long bytes)
        {
            return bytes.ToString("N0", CultureInfo.InvariantCulture) + " bytes";
        }
    }
}
