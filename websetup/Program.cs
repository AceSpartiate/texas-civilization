// The small setup a teacher can email to a colleague (owner, 2026-09-30): a file of about a
// hundred kilobytes that downloads the whole game's setup, TexasRevolutionSetup.exe, and runs it.
//
// It is deliberately a different program from the launcher, and a different kind of program:
// C# 5 on .NET Framework 4.8, which every Windows 10 and 11 computer already has, compiled by the
// compiler Windows itself carries (scripts/build-web-setup.ps1). The launcher is .NET 7 carried
// inside itself, which is most of why the whole setup is hundreds of megabytes; this carries
// nothing and needs nothing installed.
//
// It never becomes the launcher and is never installed. What it downloads is exactly the file a
// teacher would otherwise have downloaded, and it runs it exactly as a double-click would, so
// the installation, its shortcuts, its folder and every update after it are the same as ever.
// See docs/DEPLOYMENT.md, "The small setup".
using System;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("Texas Revolution setup")]
[assembly: AssemblyDescription("Downloads Texas Revolution and runs its setup.")]
[assembly: AssemblyProduct("Texas Revolution")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]
// Without this the runtime treats a csc-built program as written for .NET 4.0 and keeps that
// version's network defaults, which offer only TLS 1.0 - and GitHub refuses TLS 1.0.
[assembly: System.Runtime.Versioning.TargetFramework(".NETFramework,Version=v4.8", FrameworkDisplayName = ".NET Framework 4.8")]

namespace TexasRevolution.WebSetup
{
    internal static class Program
    {
        [DllImport("kernel32.dll")] private static extern bool AttachConsole(int processId);

        [STAThread]
        private static int Main(string[] args)
        {
            Options options;
            string refusal;
            if (!Options.TryParse(args, out options, out refusal))
            {
                // Only a test passes arguments; a teacher double-clicking passes none.
                AttachConsole(-1);
                Console.Error.WriteLine(refusal);
                return ExitCodes.BadArguments;
            }

            Download.PrepareNetwork();

            bool first;
            using (var only = new Mutex(true, @"Local\TexasRevolutionWebSetup", out first))
            {
                if (!first)
                {
                    // Two copies would download into the same folder and spoil each other's file.
                    if (!options.Unattended)
                        MessageBox.Show("Texas Revolution's setup is already running in another window.", "Texas Revolution",
                            MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return ExitCodes.AlreadyRunning;
                }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                var window = new SetupWindow(options);
                Application.Run(window);
                return window.ExitCode;
            }
        }
    }

    /// <summary>What a run ended in. A teacher never sees these; the test reads them.</summary>
    internal static class ExitCodes
    {
        public const int Installed = 0;        // the setup ran and has closed
        public const int NoInternet = 10;
        public const int Unreachable = 11;     // on the internet, but the download could not be reached
        public const int DiskFull = 12;
        public const int Damaged = 13;         // the wrong size, the wrong SHA-256, or not a program at all
        public const int Blocked = 14;         // downloaded, but Windows would not start it
        public const int Cancelled = 15;
        public const int Failed = 16;          // anything else
        public const int BadArguments = 64;
        public const int AlreadyRunning = 65;
    }

    /// <summary>
    /// Where the release is asked for, and where the download goes. Fixed for a teacher; a test
    /// may point it at a server on this computer, and only there.
    /// </summary>
    internal sealed class Options
    {
        public const string LatestApi = "https://api.github.com/repos/AceSpartiate/texas-civilization/releases/latest";
        public const string LatestSetup = "https://github.com/AceSpartiate/texas-civilization/releases/latest/download/" + Download.SetupName;

        public string Api = LatestApi;
        public string Fallback = LatestSetup;
        /// <summary>
        /// %LOCALAPPDATA%\TexasRevolution\setup-download, not %TEMP%: the game itself is installed
        /// and run under %LOCALAPPDATA%, so a computer that will run the game will run a program from
        /// there, while a common school policy refuses programs in %TEMP%.
        /// </summary>
        public string Folder = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "TexasRevolution", "setup-download");
        /// <summary>A test: no dialog waits for anybody; the run ends with an exit code.</summary>
        public bool Unattended;
        /// <summary>A test: answer as if Windows said this computer has no internet.</summary>
        public bool Offline;

        /// <remarks>
        /// Every argument is a test's. They are honoured only all together and only for a server on
        /// this computer (127.0.0.1, ::1 or localhost), so no shortcut or link can point a copy of
        /// this file at a download somewhere else.
        /// </remarks>
        public static bool TryParse(string[] args, out Options options, out string refusal)
        {
            options = new Options();
            refusal = null;
            if (args.Length == 0) return true;
            string api = null, fallback = null, folder = null;
            for (var i = 0; i < args.Length; i++)
            {
                var arg = args[i].ToLowerInvariant();
                if (arg == "--test-unattended") options.Unattended = true;
                else if (arg == "--test-offline") options.Offline = true;
                else if ((arg == "--test-api" || arg == "--test-fallback" || arg == "--test-folder") && i + 1 < args.Length)
                {
                    var value = args[++i];
                    if (arg == "--test-api") api = value;
                    else if (arg == "--test-fallback") fallback = value;
                    else folder = value;
                }
                else { refusal = "Unknown argument " + args[i] + ". This program takes none; it downloads and runs the Texas Revolution setup."; return false; }
            }
            if (api == null || fallback == null || folder == null)
            {
                refusal = "The test arguments go together: --test-api, --test-fallback and --test-folder.";
                return false;
            }
            if (!IsThisComputer(api) || !IsThisComputer(fallback))
            {
                refusal = "Test addresses must be http on this computer (127.0.0.1, ::1 or localhost).";
                return false;
            }
            options.Api = api;
            options.Fallback = fallback;
            options.Folder = System.IO.Path.GetFullPath(folder);
            return true;
        }

        private static bool IsThisComputer(string address)
        {
            Uri uri;
            return Uri.TryCreate(address, UriKind.Absolute, out uri) && uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback;
        }
    }
}
