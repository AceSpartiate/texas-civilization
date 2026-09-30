using System;
using System.Diagnostics;
using System.Drawing;
using System.Threading;
using System.Windows.Forms;

namespace TexasRevolution.WebSetup
{
    /// <summary>
    /// One small window: what is happening, how far it has got, and Cancel. When something goes
    /// wrong, what it was in plain words and Try again.
    /// </summary>
    /// <remarks>
    /// The person running this was sent a file by a colleague and may never have heard of GitHub,
    /// so nothing here sends them anywhere (owner, 2026-09-30: "I don't want them to have go to
    /// github at all"). Where the download comes from is named once, for their IT staff, when a
    /// network is what stopped it. Colours are the full setup's (launcher/InstallerForm.cs), so the
    /// window that follows looks like the same thing.
    /// </remarks>
    internal sealed class SetupWindow : Form
    {
        private static readonly Color Ground = Color.FromArgb(38, 48, 42);
        private readonly Label _title = new Label { Dock = DockStyle.Top, Height = 34, ForeColor = Color.WhiteSmoke, Text = "Texas Revolution" };
        private readonly Label _headline = new Label { Dock = DockStyle.Top, Height = 30, ForeColor = Color.FromArgb(214, 190, 140) };
        private readonly ProgressBar _progress = new ProgressBar { Dock = DockStyle.Top, Height = 18, Maximum = 1000, Style = ProgressBarStyle.Marquee, MarqueeAnimationSpeed = 30 };
        private readonly Label _gap = new Label { Dock = DockStyle.Top, Height = 8 };
        private readonly Label _detail = new Label { Dock = DockStyle.Fill, ForeColor = Color.FromArgb(198, 210, 196) };
        private readonly FlowLayoutPanel _buttons = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 44, FlowDirection = FlowDirection.RightToLeft, WrapContents = false };
        private readonly Button _cancel = Plain("Cancel", false);
        private readonly Button _again = Plain("Try again", true);
        private readonly Options _options;
        private readonly Download _download;
        private Thread _worker;
        private bool _busy;
        private bool _closingAfterSetup;
        private DateTime _startedAt;
        private long _startedFrom;

        public int ExitCode = ExitCodes.Cancelled;

        public SetupWindow(Options options)
        {
            _options = options;
            _download = new Download(options);
            _download.Retrying = attempt => OnWindow(() =>
            {
                _headline.Text = "The connection was lost. Trying again (" + attempt + " of " + Download.Retries + ")…";
            });

            SuspendLayout();
            AutoScaleDimensions = new SizeF(96F, 96F);
            AutoScaleMode = AutoScaleMode.Dpi;
            Text = "Texas Revolution setup";
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { /* the plain window icon */ }
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            MinimizeBox = true;
            BackColor = Ground;
            Padding = new Padding(20, 14, 20, 12);
            Font = new Font("Segoe UI", 9.5f);
            ClientSize = new Size(540, 290);
            _title.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
            _headline.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            _again.Visible = false;
            _cancel.Click += delegate { if (_busy) CancelDownload(); else Close(); };
            _again.Click += delegate { Begin(); };
            _buttons.Controls.Add(_cancel);
            _buttons.Controls.Add(_again);

            Controls.Add(_detail);
            Controls.Add(_buttons);
            foreach (var control in new Control[] { _gap, _progress, _headline, _title }) Controls.Add(control);
            ResumeLayout(false);

            Shown += delegate { Begin(); };
            FormClosing += (sender, e) =>
            {
                // The window's X while downloading is Cancel.
                if (_busy && !_closingAfterSetup) { _download.Cancel(); }
            };
        }

        /// <summary>A test's window does not take the keyboard from whatever else is running on the computer.</summary>
        protected override bool ShowWithoutActivation { get { return _options != null && _options.Unattended; } }

        private static Button Plain(string text, bool primary)
        {
            var button = new Button
            {
                Text = text,
                AutoSize = true,
                MinimumSize = new Size(110, 32),
                FlatStyle = FlatStyle.Flat,
                BackColor = primary ? Color.FromArgb(74, 104, 80) : Color.FromArgb(48, 58, 50),
                ForeColor = Color.White,
                Margin = new Padding(8, 6, 0, 0),
            };
            button.FlatAppearance.BorderColor = Color.FromArgb(96, 120, 100);
            return button;
        }

        // ------------------------------------------------------------------ the one job

        private void Begin()
        {
            _busy = true;
            _again.Visible = false;
            _cancel.Text = "Cancel";
            _cancel.Enabled = true;
            _progress.Visible = true;
            _progress.Style = ProgressBarStyle.Marquee;
            _headline.Text = "Texas Revolution: getting ready to download the game…";
            _detail.Text = "The game is downloaded once and then installed. This window closes by itself when the game's own setup opens.";
            _worker = new Thread(Work) { IsBackground = true, Name = "download" };
            _worker.Start();
        }

        private void Work()
        {
            try
            {
                var asset = _download.Find();
                long total;
                if (_download.AlreadyHave(asset))
                {
                    total = asset.Size;
                }
                else
                {
                    _download.ClearLeftovers();
                    _startedAt = DateTime.UtcNow;
                    _startedFrom = -1;
                    total = _download.Fetch(asset,
                        size => OnWindow(() => ShowSize(size)),
                        (done, all) => OnWindow(() => ShowProgress(done, all)));
                    OnWindow(() =>
                    {
                        _headline.Text = "Checking the download…";
                        _detail.Text = "Making sure it is exactly the file the game's release published.";
                    });
                    _download.Check(asset, total, (done, all) => OnWindow(() => SetBar(done, all)));
                }

                OnWindow(() =>
                {
                    _headline.Text = "Starting the game's setup…";
                    _detail.Text = "If Windows asks whether to run it, choose Run.";
                    _progress.Style = ProgressBarStyle.Marquee;
                    _cancel.Enabled = false;
                });
                using (var setup = _download.Start())
                {
                    // Out of the way once the setup's own window is up - or it has already closed.
                    var waited = Stopwatch.StartNew();
                    while (!setup.HasExited && waited.Elapsed < TimeSpan.FromMinutes(2))
                    {
                        try
                        {
                            setup.Refresh();
                            if (setup.MainWindowHandle != IntPtr.Zero) break;
                        }
                        catch (InvalidOperationException) { break; /* it closed between the two questions */ }
                        Thread.Sleep(200);
                    }
                    if (setup.HasExited && setup.ExitCode != 0 && waited.Elapsed < TimeSpan.FromSeconds(10))
                        throw new SetupProblem(Problem.Blocked, "it closed straight away (exit code " + setup.ExitCode + ")");
                    OnWindow(Hide);
                    setup.WaitForExit();
                }
                _download.Remove();
                OnWindow(() => { ExitCode = ExitCodes.Installed; _closingAfterSetup = true; _busy = false; Close(); });
            }
            catch (Exception error)
            {
                var problem = _download.Sort(error);
                OnWindow(() => Fail(problem));
            }
        }

        private void OnWindow(Action action)
        {
            try { if (!IsDisposed) BeginInvoke(action); }
            catch (InvalidOperationException) { /* the window has gone */ }
        }

        private void ShowSize(long size)
        {
            _headline.Text = "Texas Revolution: downloading the game (" + Download.Size(size) + ")…";
            _progress.Style = ProgressBarStyle.Continuous;
        }

        private void ShowProgress(long done, long all)
        {
            if (_startedFrom < 0) { _startedFrom = done; _startedAt = DateTime.UtcNow; }
            if (!_headline.Text.StartsWith("Texas Revolution: downloading", StringComparison.Ordinal)) ShowSize(all);
            SetBar(done, all);
            var text = Download.Size(done) + " of " + Download.Size(all);
            var seconds = (DateTime.UtcNow - _startedAt).TotalSeconds;
            if (seconds > 3 && done > _startedFrom)
            {
                var left = (all - done) / ((done - _startedFrom) / seconds);
                text += left < 60 ? " — less than a minute left" : " — about " + Math.Ceiling(left / 60) + " minutes left";
            }
            _detail.Text = text + Environment.NewLine + Environment.NewLine
                + "The game is downloaded once and then installed. This window closes by itself when the game's own setup opens.";
        }

        private void SetBar(long done, long all)
        {
            _progress.Style = ProgressBarStyle.Continuous;
            if (all > 0) _progress.Value = (int)Math.Max(0, Math.Min(1000, done * 1000 / all));
        }

        private void CancelDownload()
        {
            _cancel.Enabled = false;
            _headline.Text = "Stopping…";
            _download.Cancel();
        }

        // ------------------------------------------------------------------ when it goes wrong

        private void Fail(SetupProblem problem)
        {
            _busy = false;
            // Nowhere a teacher sees (a double-clicked program has no console); a test reads it.
            try { Console.Error.WriteLine(problem.Kind + ": " + problem.Message); Console.Error.Flush(); } catch { }
            if (problem.Kind == Problem.Cancelled)
            {
                _download.ClearLeftovers();
                ExitCode = ExitCodes.Cancelled;
                Close();
                return;
            }
            ExitCode = CodeFor(problem.Kind);
            if (_options.Unattended) { Close(); return; }
            Show();
            _progress.Visible = false;
            _headline.Text = Headline(problem.Kind);
            _detail.Text = Explain(problem);
            _cancel.Text = "Close";
            _cancel.Enabled = true;
            _again.Visible = true;
            _again.Focus();
        }

        private static int CodeFor(Problem kind)
        {
            switch (kind)
            {
                case Problem.NoInternet: return ExitCodes.NoInternet;
                case Problem.Unreachable: return ExitCodes.Unreachable;
                case Problem.DiskFull: return ExitCodes.DiskFull;
                case Problem.Damaged: return ExitCodes.Damaged;
                case Problem.Blocked: return ExitCodes.Blocked;
                default: return ExitCodes.Failed;
            }
        }

        private static string Headline(Problem kind)
        {
            switch (kind)
            {
                case Problem.NoInternet: return "This computer is not connected to the internet.";
                case Problem.Unreachable: return "The game could not be downloaded.";
                case Problem.DiskFull: return "There is not enough room on this computer.";
                case Problem.Damaged: return "The download arrived damaged.";
                case Problem.Blocked: return "The game downloaded, but Windows would not start its setup.";
                default: return "Something went wrong.";
            }
        }

        private string Explain(SetupProblem problem)
        {
            const string Hosts = "For your IT staff: the game downloads over HTTPS from github.com, objects.githubusercontent.com and release-assets.githubusercontent.com.";
            switch (problem.Kind)
            {
                case Problem.NoInternet:
                    return "The game is downloaded the first time it is installed. Connect to the internet, then press Try again.";
                case Problem.Unreachable:
                    return "Check the internet connection and press Try again. A school network may block large downloads; "
                         + "if it keeps happening, try another network, or ask your IT staff to allow it."
                         + Environment.NewLine + Environment.NewLine + Hosts;
                case Problem.DiskFull:
                    return "Downloading the game needs " + (problem.Needed > 0 ? "about " + Download.Size(problem.Needed) : "some") + " of free space, "
                         + "and installing it about twice that again. Make room (empty the Recycle Bin, or delete old downloads), then press Try again."
                         + Environment.NewLine + Environment.NewLine + "(" + Capital(problem.Message) + ".)";
                case Problem.Damaged:
                    return "It was not exactly the file it should have been, so it was thrown away and nothing was installed. Press Try again."
                         + Environment.NewLine + Environment.NewLine + "(" + Capital(problem.Message) + ".)";
                case Problem.Blocked:
                    return "This computer's security settings or its antivirus stopped it. Ask your IT staff to allow the Texas Revolution setup, "
                         + "then press Try again. It was saved as:" + Environment.NewLine + _download.SetupPath
                         + Environment.NewLine + Environment.NewLine + "(" + problem.Message + ")";
                default:
                    return "Press Try again. If it happens again, this is what went wrong:" + Environment.NewLine + problem.Message;
            }
        }

        private static string Capital(string text)
        {
            return string.IsNullOrEmpty(text) ? text : char.ToUpperInvariant(text[0]) + text.Substring(1).TrimEnd('.');
        }
    }
}
