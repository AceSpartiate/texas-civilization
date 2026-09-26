using System.Reflection;
using System.Diagnostics;

namespace TexasRevolution.Launcher;

/// <summary>
/// The teacher's control panel: start the class, show it, hand out the address, stop.
/// </summary>
/// <remarks>
/// Every control here answers a question a teacher actually asked while standing in front of
/// a room. Is it on. Where do the students type. Put it on the projector. Which version is
/// this, and is there a newer one. Nothing here configures anything: a seed, a port and a
/// class size are developer settings and have no business on this window.
///
/// <para><b>What it looks like, and why (2026-09-20).</b> The owner drew the window they wanted
/// and then had the art made for it: a painting behind everything (<see cref="TitleScene"/>) and
/// ten cast plates with their labels and marks already in them (<see cref="PlateArt"/>). So
/// this window is a stack of things drawn on one picture rather than a stack of grey boxes, and
/// the three rules that follow from that are worth naming:</para>
///
/// <list type="bullet">
/// <item><b>Every control paints the painting behind itself.</b> WinForms has no real
/// transparency; see <see cref="Scene"/>. This form renders the scene once to a bitmap the size
/// of its client area and hands out slices of it.</item>
/// <item><b>The plates keep their shape.</b> A plate is 5.47 wide to 1 tall and the stop sign is
/// 2.55 to 1, so the layout works out one width that makes the whole column fit the window and
/// then gives every plate its own height from that. Nothing is stretched to fill a slot.</item>
/// <item><b>A plate that does not apply yet is not on the window</b> (owner, 2026-09-20: "there's
/// no reason for us to see the greyed out plates when they're not being used"). The four that
/// need a running class appear as it starts and condense away as it stops. What is merely busy
/// for a moment - the seconds while the server starts, or an update installing - stays where it
/// is and stops answering, because a window that rearranges itself under a teacher's hand
/// mid-click is worse than a button that waits.</item>
/// </list>
///
/// <para>The height is worked out from the running state, which is the one with the most on it,
/// and then held; so the plates never change size as the class starts, and the stopped window
/// simply has more of the painting showing. The window is sized to the screen it opens on and
/// will not be taller than the desk space Windows says there is, which is what keeps the
/// uninstall link on a 768-pixel laptop panel.</para>
/// </remarks>
public sealed class LauncherForm : Form, IBackdrop
{
    private readonly ServerControl _server = new();
    private readonly Updater _updater = new();

    private readonly SceneLabel _title = new() { Text = "Texas Revolution", ForeColor = Palette.Cream, Fit = true };
    private readonly SceneRule _mastheadRule = new() { Heavy = true };
    private readonly SceneLabel _subtitle = new() { Text = "GONZALES, 1835", ForeColor = Palette.GoldBright, LetterSpacing = 3.6f };
    private readonly SceneLabel _release = new() { ForeColor = Color.FromArgb(216, 190, 132) };
    private readonly SceneStatus _state = new() { ForeColor = Palette.Cream };
    private readonly SceneLabel _code = new() { ForeColor = Palette.GoldBright };
    private readonly SceneRule _joinRule = new();
    private readonly SceneLabel _join = new() { ForeColor = Color.FromArgb(214, 226, 208) };

    private readonly PlateButton _power = Plate("Start the class", "button-start-the-class", Glyph.People, Palette.StartGreen);
    private readonly PlateButton _showClass = Plate("Open class view", "button-open-class-view", Glyph.Monitor, Palette.ButtonFill);
    private readonly PlateButton _openPlayer = Plate("Open a player window", "button-open-a-player-window", Glyph.Person, Palette.ButtonFill);
    private readonly PlateButton _copyCode = Plate("Copy the class code", "button-copy-the-class-code", Glyph.Clipboard, Palette.ButtonFill);
    private readonly PlateButton _copyJoin = Plate("Copy the join address", "button-copy-the-join-address", Glyph.Link, Palette.ButtonFill);
    // Solo Mode: the owner playtesting, not a class. It never touches the class above it.
    private readonly PlateButton _solo = Plate("Play Solo", "button-play-solo", Glyph.Swords, Palette.SoloBlue);
    private readonly PlateButton _updates = Plate("Check for updates", "button-check-for-updates", Glyph.Gear, Palette.ButtonFill);

    private readonly ProgressBar _progress = new() { Visible = false, Style = ProgressBarStyle.Continuous, Maximum = 100 };
    private readonly SceneLabel _notice = new() { ForeColor = Color.FromArgb(232, 206, 154), Wrap = true };
    private readonly SceneRule _footRule = new();
    // Small, at the very bottom, and out of the way of the class buttons (owner, 2026-09-17).
    private readonly SceneLink _uninstall = new()
    {
        Text = "Uninstall Texas Revolution…",
        TextAlign = ContentAlignment.MiddleRight,
        LinkColor = Color.FromArgb(206, 186, 140),
        ActiveLinkColor = Palette.Cream,
        LinkBehavior = LinkBehavior.AlwaysUnderline,
    };
    private readonly ToolTip _tips = new() { AutoPopDelay = 20000, InitialDelay = 500 };

    private readonly System.Windows.Forms.Timer _poll = new() { Interval = 1500 };
    private readonly System.Windows.Forms.Timer _reveal = new() { Interval = 16 };
    // "After an appropriate amount of time, it should go back to default" (owner, 2026-09-20, of the
    // plate that says the game is up to date). Four seconds: long enough to read a badge you were
    // waiting for, short enough that the window is not still claiming it half a lesson later.
    private readonly System.Windows.Forms.Timer _upToDate = new() { Interval = 4000 };
    private readonly Dictionary<PlateButton, float> _shown = new();
    private Bitmap? _backdrop;
    private Size _backdropFor = Size.Empty;
    private bool _laying;
    private bool _placed;
    private ServerStatus _status = ServerStatus.Stopped;
    private ReleaseInfo? _available;
    private bool _busy;
    private TeacherWindow? _classView;
    private TeacherWindow? _soloView;
    private TeacherWindow? _soloHostView;
    private bool _soloBusy;
    private bool _soloStarted;

    public LauncherForm()
    {
        Text = "Texas Revolution";
        Branding.Apply(this);
        // Everything on this window is placed by hand against the painting behind it, so WinForms
        // is asked not to scale anything a second time; Scale() does it from DeviceDpi instead.
        AutoScaleMode = AutoScaleMode.None;
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.Sizable;
        MaximizeBox = false;
        BackColor = Palette.Ink;
        Font = Faces.Make(Faces.Ui, 9.5f);
        DoubleBuffered = true;
        SetStyle(ControlStyles.OptimizedDoubleBuffer | ControlStyles.AllPaintingInWmPaint, true);
        KeyPreview = true;

        ApplyFonts(1f);

        _release.Text = AppPaths.InstalledRelease is { } tag ? $"Release {tag}" : "Working copy (not an installed release)";
        // Found 2026-09-17: a computer showed Release v2026.09.17.2 and no Solo Mode button, because the game files were new
        // and the launcher was not. The setup stamps its tag into the launcher (scripts/package.ps1), so a mismatch is said.
        var launcherTag = LauncherTag;
        // From 2026-09-26 a small update changes the game and keeps the launcher, so the launcher's tag
        // is older than the game's whenever the launcher did not change. The game's own list of files
        // names the launcher it was built for; where it has one, that is the question, not the tag.
        var builtFor = ReleaseManifest.ReadInstalled(AppPaths.Root)?.Launcher;
        var mismatched = builtFor is not null && DeltaUpdate.LauncherId is { } running
            ? !string.Equals(builtFor, running, StringComparison.OrdinalIgnoreCase)
            : launcherTag is not null && AppPaths.InstalledRelease is { } stamped && !string.Equals(launcherTag, stamped, StringComparison.OrdinalIgnoreCase);
        if (mismatched && launcherTag is not null && AppPaths.InstalledRelease is { } game)
        {
            _release.Text = $"Release {game} · launcher {launcherTag}";
            Say("This launcher is from a different release than the game beside it. Download TexasRevolutionSetup.exe again from the release page and choose Update.");
        }
        _uninstall.LinkClicked += (_, _) => Uninstall();

        _power.Click += async (_, _) => await TogglePowerAsync();
        _showClass.Click += (_, _) => ShowClassView();
        _openPlayer.Click += (_, _) => OpenPlayerWindow();
        _copyCode.Click += (_, _) => CopyToClipboard(_status.ClassCode, "class code");
        _copyJoin.Click += (_, _) => CopyToClipboard(_status.PrimaryJoinUrl, "join address");
        _updates.Click += async (_, _) => await UpdatesClickedAsync();
        _solo.Click += async (_, _) => await PlaySoloAsync();

        foreach (var control in Stack)
        {
            control.TabStop = control is PlateButton or SceneLink;
            Controls.Add(control);
        }
        // Tab order follows the eye down the window rather than the order things were added.
        var order = 0;
        foreach (var control in Stack) control.TabIndex = order++;

        // Enter presses the one button a teacher is nearly always here for.
        AcceptButton = _power;

        // The four that need a running class are off the window until there is one.
        foreach (var button in Optional) _shown[button] = 0f;
        foreach (var button in Buttons) _shown.TryAdd(button, 1f);
        ApplyReveal(snap: true);

        _reveal.Tick += (_, _) => StepReveal();
        _poll.Tick += async (_, _) => await RefreshAsync();
        _upToDate.Tick += (_, _) => WearOrdinaryUpdatePlate();
        Load += async (_, _) =>
        {
            FitToScreen(honourSaved: true);
            await RefreshAsync();
            _poll.Start();
            OfferShortcuts();
            // Asked once, quietly, on the way in. A teacher opening this two minutes before a
            // lesson should not be interrupted, so a failure here says nothing at all.
            await LookForUpdateAsync(announce: false);
        };
        FormClosing += (_, _) =>
        {
            RememberPlace();
            _poll.Stop();
            _reveal.Stop();
            _upToDate.Stop();
            // A playtest server this window started goes with it, through the same graceful
            // stop as a class. Not awaited: the script outlives the window, and a solo game is
            // a scratch pad with nothing in it worth holding the window open for.
            if (_soloStarted) _ = _server.StopSoloAsync();
        };
    }

    // ---- the window's furniture -------------------------------------------------------------

    private static PlateButton Plate(string text, string art, Glyph mark, Color accent) => new()
    {
        Text = text, Plate = art, Mark = mark, Accent = accent,
    };

    /// <summary>Top to bottom, which is also the tab order.</summary>
    private Control[] Stack => new Control[]
    {
        _title, _mastheadRule, _subtitle, _release, _state, _code, _joinRule, _join,
        _power, _showClass, _openPlayer, _copyCode, _copyJoin, _solo, _updates,
        _progress, _notice, _footRule, _uninstall,
    };

    private PlateButton[] Buttons => new[] { _power, _showClass, _openPlayer, _copyCode, _copyJoin, _solo, _updates };

    /// <summary>The four a teacher cannot use until a class is running.</summary>
    private PlateButton[] Optional => new[] { _showClass, _openPlayer, _copyCode, _copyJoin };

    private float Dpi => DeviceDpi / 96f;

    /// <summary>Screen pixels for a measurement in ordinary pixels: DPI only, no window scaling.</summary>
    private int D(float logical) => (int)Math.Round(logical * Dpi);

    /// <summary>
    /// The window the whole layout was drawn against. Everything else is a share of it.
    /// </summary>
    private const float DrawnWidth = 482f;

    private const float DrawnHeight = 938f;

    /// <summary>
    /// How much bigger this window is than the one the layout was drawn at.
    /// </summary>
    /// <remarks>
    /// Owner, 2026-09-20: "Looked better when it was bigger." Making the window bigger is only
    /// worth doing if the art gets bigger with it, so every measurement on this window - the
    /// masthead's face, the rules, the class code, the plates, the gaps - is a share of the
    /// window's width rather than a fixed number of pixels. A window twice as wide is the same
    /// window twice the size, not the same furniture with more painting showing round it.
    /// </remarks>
    private float Grow => Math.Clamp(ClientSize.Width / (DrawnWidth * Dpi), 0.70f, 2.60f);

    private int S(float logical) => (int)Math.Round(logical * Dpi * Grow);

    private float _fontsAt;

    /// <summary>
    /// The faces, at the size this window has grown to.
    /// </summary>
    /// <remarks>
    /// Sizes are in points, so Windows already renders them right for the screen's DPI; what this
    /// multiplies is the window's own growth. Rebuilt only when the window has changed size by
    /// more than a couple of percent, because making nine fonts on every drag of a window edge is
    /// how a window comes to feel slow.
    /// </remarks>
    private void ApplyFonts(float grow)
    {
        if (Math.Abs(grow - _fontsAt) < 0.02f) return;
        _fontsAt = grow;
        Set(_title, Faces.Display, 30f, FontStyle.Bold);
        Set(_subtitle, Faces.Serif, 10f, FontStyle.Bold);
        Set(_release, Faces.Ui, 8.5f);
        Set(_state, Faces.Ui, 10f);
        Set(_notice, Faces.Ui, 8.75f);
        Set(_uninstall, Faces.Ui, 8f);
        Set(_join, Faces.Mono, 9.5f);
        // The six characters a student types are the thing a teacher reads out and writes on
        // the board, so they are the largest thing on this window after the plates.
        Set(_code, Faces.Mono, 19f, FontStyle.Bold);

        void Set(Control control, string family, float points, FontStyle style = FontStyle.Regular)
        {
            var replacement = Faces.Make(family, points * grow, style);
            control.Font = replacement;
            // Only ever let go of a font this method made. Reading Control.Font back and disposing
            // whatever comes out disposes Control.DefaultFont the first time round - it is a static
            // shared with every control in the process, including the dialog WinForms puts up when
            // something goes wrong, so the failure it causes is the failure it then cannot report.
            // Found by crash, 2026-09-20.
            if (_ownFonts.TryGetValue(control, out var previous)) previous.Dispose();
            _ownFonts[control] = replacement;
        }
    }

    private readonly Dictionary<Control, Font> _ownFonts = new();

    // ---- the painting behind everything -----------------------------------------------------

    void IBackdrop.PaintBackdrop(Graphics g, Control child) => PaintBackdrop(g, child);

    private void PaintBackdrop(Graphics g, Control child)
    {
        var scene = _backdrop;
        if (scene is null || child.Width <= 0 || child.Height <= 0)
        {
            using var flat = new SolidBrush(Palette.Ink);
            g.FillRectangle(flat, child.ClientRectangle);
            return;
        }
        try
        {
            var origin = PointToClient(child.PointToScreen(Point.Empty));
            var interpolation = g.InterpolationMode;
            var offset = g.PixelOffsetMode;
            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;
            g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.Half;
            g.DrawImage(scene,
                new Rectangle(0, 0, child.Width, child.Height),
                new Rectangle(origin.X, origin.Y, child.Width, child.Height),
                GraphicsUnit.Pixel);
            g.InterpolationMode = interpolation;
            g.PixelOffsetMode = offset;
        }
        catch
        {
            using var flat = new SolidBrush(Palette.Ink);
            g.FillRectangle(flat, child.ClientRectangle);
        }
    }

    private void EnsureBackdrop()
    {
        var size = ClientSize;
        if (size.Width < 1 || size.Height < 1) return;
        if (_backdrop is not null && _backdropFor == size) return;
        var replacement = TitleScene.Render(size, Dpi * Grow);
        _backdrop?.Dispose();
        _backdrop = replacement;
        _backdropFor = size;
    }

    protected override void OnPaintBackground(PaintEventArgs e)
    {
        EnsureBackdrop();
        if (_backdrop is { } scene) { e.Graphics.DrawImageUnscaled(scene, 0, 0); return; }
        base.OnPaintBackground(e);
    }

    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        EnsureBackdrop();
        LayoutStack();
        Invalidate(true);
    }

    protected override void OnDpiChangedAfterParent(EventArgs e)
    {
        base.OnDpiChangedAfterParent(e);
        FitToScreen();
    }

    protected override void OnDpiChanged(DpiChangedEventArgs e)
    {
        base.OnDpiChanged(e);
        // Dragged onto a projector at a different scale: rebuild the scene at the new size and
        // lay the window out again, because none of this is scaled by WinForms.
        BeginInvoke(FitToScreen);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _backdrop?.Dispose();
            foreach (var font in _ownFonts.Values) font.Dispose();
            _ownFonts.Clear();
            _poll.Dispose();
            _reveal.Dispose();
            _upToDate.Dispose();
            _tips.Dispose();
        }
        base.Dispose(disposing);
    }

    // ---- size and layout --------------------------------------------------------------------

    /// <summary>
    /// The size the window wants on the screen it is on: as large as that screen will decently
    /// hold, in the proportion the layout was drawn in.
    /// </summary>
    /// <remarks>
    /// Owner, 2026-09-20, watching it run: "Are you playing with default size of the window vs
    /// the resolution of the monitor? ... Looked better when it was bigger." So the height is
    /// taken first - nine tenths of the desk space Windows reports - and the width follows from
    /// it, because the window is portrait and its height is what decides how big the plates can
    /// be. On the owner's 4K panel at 150% that is a window about 610 by 1240 in ordinary pixels,
    /// half again the size of the one it replaced; on a 1366 by 768 laptop it is about 360 by 620
    /// and the small-screen floor in <see cref="LayoutStack"/> takes over.
    ///
    /// <para>What it never does is fall off the bottom of the screen. That is not hypothetical:
    /// the first version of this window lost its update button that way, and the first version of
    /// <i>this</i> version was centred at its opening size and then grown downward off a 4K panel.</para>
    ///
    /// <para>A size the teacher chose is kept and used instead - see <see cref="RememberPlace"/> -
    /// and is only overruled when the screen it was saved on is no longer there.</para>
    /// </remarks>
    private void FitToScreen(bool honourSaved = false)
    {
        var working = Screen.FromPoint(_placed
            ? Bounds.Location + new Size(Bounds.Width / 2, Bounds.Height / 2)
            : Cursor.Position).WorkingArea;
        var chromeWidth = Math.Max(0, Size.Width - ClientSize.Width);
        var chromeHeight = Math.Max(0, Size.Height - ClientSize.Height);
        MinimumSize = new Size(D(360) + chromeWidth, D(400) + chromeHeight);

        if (honourSaved && SavedPlace() is { } saved && OnSomeScreen(saved))
        {
            Bounds = saved;
            _placed = true;
            EnsureBackdrop();
            LayoutStack();
            Invalidate(true);
            return;
        }

        var height = (int)(working.Height * 0.90) - chromeHeight;
        var width = (int)Math.Round(height * DrawnWidth / DrawnHeight);
        // Half the desk is as much width as a portrait window may take, which only ever binds on
        // a short wide screen.
        var widest = (int)(working.Width * 0.52) - chromeWidth;
        if (width > widest) { width = widest; height = (int)Math.Round(width * DrawnHeight / DrawnWidth); }
        width = Math.Clamp(width, D(360), Math.Max(D(360), working.Width - chromeWidth - D(12)));
        height = Math.Clamp(height, D(400), Math.Max(D(400), working.Height - chromeHeight - D(12)));
        Size = new Size(width + chromeWidth, height + chromeHeight);

        var bounds = Bounds;
        if (!_placed) { bounds.X = working.Left + (working.Width - bounds.Width) / 2; bounds.Y = working.Top + (working.Height - bounds.Height) / 2; _placed = true; }
        bounds.X = Math.Min(Math.Max(bounds.X, working.Left), Math.Max(working.Left, working.Right - bounds.Width));
        bounds.Y = Math.Min(Math.Max(bounds.Y, working.Top), Math.Max(working.Top, working.Bottom - bounds.Height));
        Bounds = bounds;

        EnsureBackdrop();
        LayoutStack();
        Invalidate(true);
    }

    /// <summary>Where the window was left, beside the install stamp so the uninstall takes it too.</summary>
    private static string PlaceFile => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "TexasRevolution", "window.txt");

    /// <summary>
    /// Keep the size and place a teacher chose, and nothing else about the window.
    /// </summary>
    /// <remarks>
    /// Four numbers in a text file. Not the registry, and not a settings format: this is worth
    /// exactly as much as it costs, and a file that cannot be read or makes no sense is simply
    /// ignored and the window sizes itself to the screen as it would on a new machine.
    /// </remarks>
    private void RememberPlace()
    {
        try
        {
            if (WindowState != FormWindowState.Normal) return;
            Directory.CreateDirectory(Path.GetDirectoryName(PlaceFile)!);
            File.WriteAllText(PlaceFile, $"{Bounds.X} {Bounds.Y} {Bounds.Width} {Bounds.Height}");
        }
        catch { /* a machine that will not let us remember simply sizes itself again */ }
    }

    private static Rectangle? SavedPlace()
    {
        try
        {
            if (!File.Exists(PlaceFile)) return null;
            var parts = File.ReadAllText(PlaceFile).Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 4) return null;
            var numbers = new int[4];
            for (var i = 0; i < 4; i++) if (!int.TryParse(parts[i], out numbers[i])) return null;
            return numbers[2] < 200 || numbers[3] < 240 ? null : new Rectangle(numbers[0], numbers[1], numbers[2], numbers[3]);
        }
        catch { return null; }
    }

    /// <summary>A remembered place on a monitor that has since been unplugged is not a place.</summary>
    private static bool OnSomeScreen(Rectangle bounds)
    {
        foreach (var screen in Screen.AllScreens)
            if (screen.WorkingArea.IntersectsWith(Rectangle.Inflate(bounds, -40, -40)))
                return bounds.Height <= screen.WorkingArea.Height + 8 && bounds.Width <= screen.WorkingArea.Width + 8;
        return false;
    }

    /// <summary>
    /// Place everything, top down for the masthead, bottom up for the footer, and give what is
    /// left to the column of plates.
    /// </summary>
    private void LayoutStack()
    {
        if (_laying || ClientSize.Width < 40 || ClientSize.Height < 60) return;
        _laying = true;
        try
        {
            Place();
        }
        // Laying out runs on a resize, a timer tick and a status change, so a throw here is a
        // throw every second and a half. It is written down and the window keeps whatever it had.
        catch (Exception error) { Program.NoteQuietly(error); }
        finally { _laying = false; }

        void Place()
        {
            ApplyFonts(Grow);
            var padX = S(21);
            var content = Math.Max(S(120), ClientSize.Width - padX * 2);
            var top = TitleScene.MottoHeight(Dpi * Grow) + S(4);
            var bottom = ClientSize.Height - S(10);

            // The masthead, down from the top.
            var y = top;
            void Row(Control control, int height, int after = 0)
            {
                control.Bounds = new Rectangle(padX, y, content, height);
                control.Visible = height > 0;
                y += height + after;
            }

            // Shorter than the layout was drawn for at this width - a laptop panel, or a window a
            // teacher has dragged up. The masthead gives room back to the plates rather than the
            // other way round: a teacher needs to read the buttons and already knows what the game
            // is called. The masthead's own face shrinks with its row (SceneLabel.Fit).
            var tight = ClientSize.Height < ClientSize.Width * (DrawnHeight / DrawnWidth) * 0.94f;

            Row(_title, tight ? S(44) : S(58));
            Row(_mastheadRule, S(16));
            Row(_subtitle, tight ? S(17) : S(19), S(6));
            Row(_release, S(17));
            Row(_state, S(23), S(4));
            // The class code is only a thing while a class is running; when there is none the row
            // is not empty space, it is not there.
            Row(_code, string.IsNullOrEmpty(_code.Text) ? 0 : tight ? S(28) : S(33), S(2));
            Row(_joinRule, S(15));
            Row(_join, S(24));
            var columnTop = y + S(10);

            // The footer, up from the bottom.
            var foot = bottom;
            void Foot(Control control, int height, int before = 0)
            {
                foot -= height;
                control.Bounds = new Rectangle(padX, foot, content, height);
                foot -= before;
            }

            Foot(_uninstall, S(20));
            Foot(_footRule, S(15), S(2));
            Foot(_notice, NoticeHeight, S(4));
            if (_progress.Visible) Foot(_progress, S(12), S(6));
            var columnBottom = foot - S(8);

            // One width for the whole column, worked out from the state with the most on it - the
            // class running, all seven plates up and the stop sign in the primary row - so that a
            // plate never changes size as plates come and go.
            var room = Math.Max(S(60), columnBottom - columnTop);
            var unit = Math.Min(content, (int)(room / WorstCaseColumn()));
            var gap = Math.Max(S(4), (int)(unit * 0.018f));

            var heights = new Dictionary<PlateButton, (int Width, int Height)>();
            var total = 0;
            var showing = 0;
            foreach (var button in Buttons)
            {
                var (widthShare, aspect) = Shape(button);
                var width = Math.Max(S(40), (int)(unit * widthShare));
                var height = Math.Max(S(10), (int)(width / aspect));
                heights[button] = (width, height);
                var reveal = _shown.TryGetValue(button, out var value) ? value : 1f;
                if (reveal <= 0.02f) continue;
                total += (int)(height * reveal) + gap;
                showing++;
            }
            if (showing > 0) total -= gap;

            // Two thirds of the way down what is left, so the sky, the flag and the chapel keep the
            // upper half of the window and the plates sit where the mockup puts them - low, near
            // the hand, above the footer. With a class running there is almost no slack to divide
            // and this does nothing.
            var slot = columnTop + Math.Max(0, (room - total) * 66 / 100);
            foreach (var button in Buttons)
            {
                var (width, height) = heights[button];
                var reveal = _shown.TryGetValue(button, out var value) ? value : 1f;
                var drawn = (int)(height * reveal);
                if (reveal <= 0.02f || drawn < 2)
                {
                    if (button.Focused) ActiveControl = _power;
                    button.Visible = false;
                    continue;
                }
                button.Bounds = new Rectangle(padX + (content - width) / 2, slot, width, drawn);
                button.Visible = true;
                slot += drawn + gap;
            }
        }
    }

    /// <summary>
    /// Width as a share of the column's width, and the drawn shape's width over its height.
    /// </summary>
    /// <remarks>
    /// Three of the ten plates are not the straight 5.47-to-1 sign the other seven are, and each
    /// keeps its own proportion and is given a width that lets what overhangs it hang into the
    /// column's margin rather than be clipped: the stop sign's torn flag off its left end, and the
    /// update badge's roundel and exclamation mark off its left end.
    /// </remarks>
    private (float Share, float Aspect) Shape(PlateButton button)
    {
        var art = button.Plate ?? "";
        var share = art switch
        {
            PlateArt.Stop => 0.885f,
            PlateArt.UpdateAvailable => 0.80f,
            PlateArt.UpToDate => 0.86f,
            _ => button == _power || button == _solo ? 1f : 0.88f,
        };
        return (share, PlateArt.AspectOf(art));
    }

    /// <summary>
    /// The column's height in units of its own width, in the state with the most on it.
    /// </summary>
    /// <remarks>
    /// That is the class running: seven plates up and the stop sign - the tallest the primary row
    /// ever is - in the first of them. Working the column's width out from this and not from the
    /// state on screen is what stops a plate changing size as plates come and go.
    ///
    /// <para>Two of the plates change picture, and both are counted at their tallest rather than at
    /// the one they happen to be wearing: the primary between start and stop, and updates between
    /// "Check for updates" and either badge - the amber one, which is nearly twice as tall as the
    /// plate it replaces, or the green one that says the game is current. Counting the plate on
    /// screen instead made the whole column resize the moment a badge appeared.</para>
    /// </remarks>
    private float WorstCaseColumn()
    {
        var total = (Buttons.Length - 1) * 0.018f;   // the gaps between them
        foreach (var button in Buttons)
        {
            var (share, aspect) = button == _power
                ? (0.885f, PlateArt.AspectOf(PlateArt.Stop))
                : button == _updates
                    ? (0.80f, Math.Min(PlateArt.AspectOf(PlateArt.UpdateAvailable), PlateArt.AspectOf(PlateArt.UpToDate)))
                    : Shape(button);
            total += share / Math.Max(0.5f, aspect);
        }
        return Math.Max(0.3f, total);
    }

    private int NoticeHeight =>
        ClientSize.Height < ClientSize.Width * (DrawnHeight / DrawnWidth) * 0.94f ? S(32) : S(46);

    // ---- plates coming and going ------------------------------------------------------------

    /// <summary>
    /// What should be on the window now: the four that need a running class, and nothing else.
    /// </summary>
    /// <remarks>
    /// Deliberately not "is this button usable this instant". While the server is starting or an
    /// update is installing the plates already on screen stay on screen and stop answering; only
    /// a plate that does not apply to the world as it is - no class, so no class view - leaves.
    /// </remarks>
    private void SetReveal()
    {
        var running = _status.Running;
        Want(_showClass, running);
        Want(_openPlayer, running);
        Want(_copyJoin, running);
        Want(_copyCode, running && !string.IsNullOrEmpty(_status.ClassCode));

        void Want(PlateButton button, bool wanted)
        {
            var target = wanted ? 1f : 0f;
            if (_targets.TryGetValue(button, out var already) && Math.Abs(already - target) < 0.001f) return;
            _targets[button] = target;
            // Animation off at the system level, or no window yet: show and hide outright.
            if (!IsHandleCreated || !SystemInformation.UIEffectsEnabled) { _shown[button] = target; return; }
            _reveal.Start();
        }
    }

    private readonly Dictionary<PlateButton, float> _targets = new();

    private void StepReveal()
    {
        var moving = false;
        foreach (var button in Optional)
        {
            var target = _targets.TryGetValue(button, out var want) ? want : 1f;
            var now = _shown.TryGetValue(button, out var value) ? value : 1f;
            if (Math.Abs(now - target) < 0.001f) { _shown[button] = target; continue; }
            // About a fifth of a second either way, which is long enough to be seen as movement
            // and short enough that nobody waits for it.
            var step = 1f / 11f;
            _shown[button] = target > now ? Math.Min(target, now + step) : Math.Max(target, now - step);
            moving = true;
        }
        LayoutStack();
        if (!moving) _reveal.Stop();
    }

    private void ApplyReveal(bool snap)
    {
        SetReveal();
        if (!snap) return;
        foreach (var button in Optional)
            _shown[button] = _targets.TryGetValue(button, out var want) ? want : 0f;
        _reveal.Stop();
    }

    // ---- everything below here is what the window does, and is unchanged in substance --------

    /// <summary>
    /// Solo Mode: one click from here to playing, for the owner testing the game.
    /// </summary>
    /// <remarks>
    /// Starts the solo server if it is not running (its own folder, its own save, its own port,
    /// this computer only - a running class is left exactly as it is), deals a new game with one
    /// player already joined, rolled and started, and opens that player's page in a window of
    /// its own. The window has a button for the solo class view, to inspect what the Host sees,
    /// and one for another new game.
    /// </remarks>
    private async Task PlaySoloAsync()
    {
        if (_soloBusy) return;
        _soloBusy = true;
        _solo.Enabled = false;
        try
        {
            Say("Starting a solo game…");
            // Only a server this window started is stopped when it closes; one already running
            // (say, from `npm run solo` in a terminal) belongs to whoever started it.
            var wasRunning = await _server.SoloRunningAsync();
            var (ok, output) = await _server.StartSoloAsync();
            if (!ok) { Say(string.IsNullOrWhiteSpace(output) ? "The solo server did not start, and said nothing about why." : output); return; }
            if (!wasRunning) _soloStarted = true;
            // New or continue (owner, 2026-09-17): asked only when there is a saved solo game to continue.
            var (games, listError) = await _server.ListSoloGamesAsync();
            if (games is null) { Say($"The solo server would not list its saved games. {listError}"); return; }
            string? continueId = null;
            if (games.Count > 0)
            {
                using var choice = new SoloGameDialog(games, id => _server.DeleteSoloGameAsync(id));
                if (choice.ShowDialog(this) != DialogResult.OK) { Say("Play Solo was cancelled."); return; }
                continueId = choice.ContinueId;
            }
            Say(continueId is null ? "Starting a new solo game…" : "Opening the saved game…");
            var (play, host, error) = await _server.NewSoloGameAsync(continueId);
            if (play is null) { Say($"The solo server started but would not deal a game. {error}"); return; }
            if (_soloView is { IsDisposed: false })
            {
                _soloView.Navigate(play);
                _soloView.Activate();
            }
            else
            {
                _soloView = new TeacherWindow(play, "Texas Revolution — Play Solo", developer: true,
                    ("Class view", _ => ShowSoloHost(host)),
                    ("New solo game", window => _ = NewSoloGameInAsync(window)));
                _soloView.FormClosed += (_, _) => _soloView = null;
                _soloView.Show();
            }
            Say(continueId is null
                ? "Solo game running: one family joined and the class started. Nobody else can reach it."
                : "Saved game continued where it was left. Nobody else can reach it.");
        }
        finally
        {
            _soloBusy = false;
            _solo.Enabled = true;
        }
    }

    private void ShowSoloHost(string? hostUrl)
    {
        if (hostUrl is null) { Say("The solo server has not written its Host address yet."); return; }
        if (_soloHostView is { IsDisposed: false })
        {
            // A new game rotates the session, so the class view is reopened rather than shown stale.
            _soloHostView.Navigate(hostUrl);
            _soloHostView.Activate();
            return;
        }
        _soloHostView = new TeacherWindow(hostUrl, "Texas Revolution — Play Solo class view", developer: true);
        _soloHostView.FormClosed += (_, _) => _soloHostView = null;
        _soloHostView.Show();
    }

    private async Task NewSoloGameInAsync(TeacherWindow window)
    {
        var (play, host, error) = await _server.NewSoloGameAsync();
        if (play is null) { Say($"No new solo game: {error}"); return; }
        window.Navigate(play);
        if (_soloHostView is { IsDisposed: false } && host is not null) _soloHostView.Navigate(host);
    }

    /// <summary>
    /// Asked once, the first time this copy is opened, and never again.
    /// </summary>
    /// <remarks>
    /// The Start menu entry is made without asking, because that is where Windows
    /// applications live and it is where a teacher will look. The desktop icon is asked
    /// for, because somebody else's desktop is not ours to decorate.
    /// </remarks>
    private void OfferShortcuts()
    {
        if (!Shortcuts.IsFirstRun()) return;
        var answer = MessageBox.Show(
            "Put a Texas Revolution shortcut on the desktop?" + Environment.NewLine + Environment.NewLine
            + "It will be added to the Start menu either way.",
            "Texas Revolution", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        Shortcuts.Create(desktop: answer == DialogResult.Yes);
        Shortcuts.RememberInstalled();
    }

    /// <summary>
    /// The one line of news on this window, and the place every failure ends up.
    /// </summary>
    /// <remarks>
    /// Three lines of room is enough for everything this window says except the release-mismatch
    /// warning, so the whole message is also on the tooltip. A message that cannot be read is a
    /// message that was not said.
    /// </remarks>
    private void Say(string message)
    {
        _notice.Text = message;
        _tips.SetToolTip(_notice, message);
        _notice.Invalidate();
    }

    /// <summary>The release tag stamped into this launcher when the setup was built; null for a working copy's build.</summary>
    private static string? LauncherTag =>
        typeof(LauncherForm).Assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion?.Split('+')[0] is { } version
        && version.StartsWith('v') ? version : null;

    /// <summary>
    /// The same uninstall Add/Remove Programs runs, in a process of its own: it asks, and if the teacher goes ahead this
    /// window closes so its folder can be removed; if they cancel, nothing changes.
    /// </summary>
    private void Uninstall()
    {
        var exe = Environment.ProcessPath;
        if (exe is null || AppPaths.InstalledRelease is null) { Say("This is a working copy, not an installed release; there is nothing to uninstall."); return; }
        _uninstall.Enabled = false;
        var process = Process.Start(new ProcessStartInfo(exe, $"--uninstall --after {Environment.ProcessId}") { UseShellExecute = false });
        if (process is null) { _uninstall.Enabled = true; return; }
        process.EnableRaisingEvents = true;
        process.Exited += (_, _) => BeginInvoke(() =>
        {
            if (process.ExitCode == 0) { _soloStarted = false; Close(); }
            else _uninstall.Enabled = true;
        });
    }

    private async Task RefreshAsync()
    {
        if (_busy) return;
        _status = await _server.StatusAsync();
        var running = _status.Running;
        // The primary plate is the one place the picture itself has to change with the world:
        // the owner had a stop sign made, so "Stop the class" is its own art and not a label
        // written over a plate that says something else.
        _power.Text = running ? "Stop the class" : "Start the class";
        _power.Plate = running ? PlateArt.Stop : "button-start-the-class";
        _power.Accent = running ? Palette.StopRust : Palette.StartGreen;
        _state.Text = running
            ? _status.Stopping ? "Stopping…"
                : _status.Joined == 1 ? "The class is running · 1 household joined"
                : $"The class is running · {_status.Joined} households joined"
            : "Not running.";
        _state.Lamp = running ? _status.Stopping ? Palette.LampBusy : Palette.LampRunning : Palette.LampStopped;
        // Both of the things a teacher has to hand out, on the face of the window, with a
        // plate each. The first version had only the address and only a copy button for
        // that, which is how somebody came to press "copy" and not get the code.
        _code.Text = running ? _status.ClassCode ?? "" : "";
        _join.Text = running ? _status.PrimaryJoinUrl ?? "" : "Start the class to get a join address.";
        // A plate a teacher cannot use is not dimmed, it is not there (owner, 2026-09-20).
        foreach (var button in Optional) button.Enabled = true;
        SetReveal();
        LayoutStack();
        Invalidate(true);
    }

    private async Task TogglePowerAsync()
    {
        _busy = true;
        _power.Enabled = false;
        var starting = !_status.Running;
        _state.Text = starting ? "Starting…" : "Stopping. The class is being saved…";
        _state.Lamp = Palette.LampBusy;
        _state.Invalidate();
        Say("");
        var (ok, output) = starting ? await _server.StartAsync() : await _server.StopAsync();
        _busy = false;
        _power.Enabled = true;
        await RefreshAsync();
        if (!ok) Say(string.IsNullOrWhiteSpace(output) ? "That did not work, and said nothing about why." : output);
        else if (starting && _status.Running) Say("Students can join at the address above.");
        else if (starting) Say("It reported success but is not answering yet. Give it a moment, then look again.");
        else Say("Stopped. The class was saved and continues where it left off.");
    }

    private void ShowClassView()
    {
        if (_status.HostUrl is null) { Say("The class is running but has not written its Host address yet."); return; }
        if (_classView is { IsDisposed: false }) { _classView.Activate(); return; }
        _classView = new TeacherWindow(_status.HostUrl);
        _classView.FormClosed += (_, _) => _classView = null;
        _classView.Show();
    }

    private void OpenPlayerWindow()
    {
        if (_status.PrimaryJoinUrl is not { } url) { Say("No join address yet."); return; }
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
        catch (Exception error) { Say(error.Message); }
    }

    /// <summary>
    /// Copy, and say what happened either way.
    /// </summary>
    /// <remarks>
    /// The clipboard belongs to whatever else is running, and Windows will refuse when
    /// another program is holding it. A silent failure there looks exactly like a broken
    /// button, so the failure path puts the text on screen where it can be read out or
    /// typed - which is all the teacher wanted the clipboard for.
    /// </remarks>
    private void CopyToClipboard(string? value, string what)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Say(_status.Running ? $"There is no {what} yet." : $"Start the class first — there is no {what} until it is running.");
            return;
        }
        try { Clipboard.SetText(value); Say($"Copied the {what}: {value}"); }
        catch { Say($"Windows would not let go of the clipboard. The {what} is {value}"); }
    }

    /// <summary>
    /// Put the slate "Check for updates" plate back after the green badge has had its moment.
    /// </summary>
    /// <remarks>
    /// Never over the amber one. If a check ran while an update was already waiting - or one is
    /// found between the badge going up and this firing - the news outranks the reassurance, and
    /// this leaves it alone.
    /// </remarks>
    private void WearOrdinaryUpdatePlate()
    {
        _upToDate.Stop();
        if (_available is not null || _updates.Plate != PlateArt.UpToDate) return;
        _updates.Text = "Check for updates";
        _updates.Plate = "button-check-for-updates";
        _updates.Accent = Palette.ButtonFill;
        LayoutStack();
        _updates.Invalidate();
    }

    /// <summary>Look, and then - if there is something - offer to install it.</summary>
    private async Task UpdatesClickedAsync()
    {
        if (_available is not null) { await InstallAsync(_available); return; }
        await LookForUpdateAsync(announce: true);
        if (_available is not null) await InstallAsync(_available);
    }

    private async Task LookForUpdateAsync(bool announce)
    {
        if (announce) Say("Asking GitHub…");
        var release = await Updates.LatestAsync();
        if (release is null)
        {
            if (announce) Say("Could not reach GitHub. This copy works offline either way.");
            return;
        }
        switch (Updates.IsNewerThanInstalled(release))
        {
            case null:
                if (announce) Say($"This is a working copy rather than an installed release. The latest published is {release.Tag}.");
                break;
            case false:
                if (announce)
                {
                    Say($"Up to date — {release.Tag}.");
                    // The owner's green badge, for as long as it is news. Only when the teacher
                    // asked: the quiet look on the way in says nothing and should show nothing.
                    _updates.Text = $"Up to date — {release.Tag}";
                    _updates.Plate = PlateArt.UpToDate;
                    _updates.Accent = Palette.StartGreen;
                    LayoutStack();
                    _updates.Invalidate();
                    _upToDate.Stop();
                    _upToDate.Start();
                }
                break;
            case true:
                _available = release;
                // The same button, wearing a different face: the owner's UPDATE AVAILABLE badge
                // (supplied 2026-09-20) in place of the slate "Check for updates" plate, so a
                // teacher opening the launcher sees at a glance that there is something to take.
                // The words are in the art, as on every other plate; the version is in Text, for
                // the keyboard and the narrator, and in the line of news below.
                _updates.Text = $"Update to {release.Tag}";
                _updates.Plate = PlateArt.UpdateAvailable;
                _updates.Accent = Palette.UpdateAmber;
                LayoutStack();
                _updates.Invalidate();
                // Said in the size a teacher on a slow school connection cares about: a few hundred
                // kilobytes of changes, or the whole game when the launcher itself has changed.
                var (bytes, changesOnly) = DeltaUpdate.Estimate(release, AppPaths.InstalledRelease, DeltaUpdate.LauncherId);
                Say(bytes <= 0 ? $"A newer build is available: {release.Name}."
                    : changesOnly ? $"A newer build is available: {release.Name}. Only what changed is downloaded: about {DeltaUpdate.Plain(bytes)}."
                    : $"A newer build is available: {release.Name} ({DeltaUpdate.Plain(bytes)} to download).");
                break;
        }
    }

    private async Task InstallAsync(ReleaseInfo release)
    {
        // Never mid-lesson. An update that restarts the launcher under a running class is
        // the one moment a teacher cannot afford a surprise.
        if (_status.Running)
        {
            Say("Stop the class first. Updating restarts the launcher, and a class should not be interrupted.");
            return;
        }
        var (bytes, changesOnly) = DeltaUpdate.Estimate(release, AppPaths.InstalledRelease, DeltaUpdate.LauncherId);
        var size = bytes <= 0 ? "" : changesOnly ? $" (only what changed: about {DeltaUpdate.Plain(bytes)})" : $" ({DeltaUpdate.Plain(bytes)})";
        if (MessageBox.Show(
                $"Download and install {release.Name}{size}?" + Environment.NewLine + Environment.NewLine
                + "Texas Revolution will close and reopen. Your saved classes are not touched.",
                "Texas Revolution", MessageBoxButtons.OKCancel, MessageBoxIcon.Question) != DialogResult.OK) return;

        _busy = true;
        // Held, not hidden: an update is a moment, not a change in what the window is for.
        foreach (var button in new[] { _power, _updates, _showClass, _openPlayer, _copyJoin, _copyCode, _solo }) button.Enabled = false;
        _progress.Visible = true;
        _progress.Value = 0;
        LayoutStack();
        var progress = new Progress<(int Percent, string What)>(step =>
        {
            _progress.Value = Math.Clamp(step.Percent, 0, 100);
            Say(step.What);
        });
        try
        {
            var staged = await _updater.StageAsync(release, progress, CancellationToken.None);
            var payload = staged.Payload;
            // Nothing may be running out of this folder while it is replaced: no playtest server,
            // and no status check starting the bundled node every second and a half.
            _poll.Stop();
            if (await _server.SoloRunningAsync())
            {
                Say("Stopping Play Solo first…");
                await _server.StopSoloAsync();
                _soloStarted = false;
            }
            Say("Installing…");
            await Task.Run(() => Updater.Install(payload, progress));
            Say("Installed. Texas Revolution is reopening.");
            Updater.Restart();
            Close();
        }
        catch (Exception error)
        {
            _progress.Visible = false;
            Say($"The update did not finish, and the version you had is still installed. {error.Message}");
            foreach (var button in new[] { _power, _updates, _solo }) button.Enabled = true;
            _busy = false;
            _poll.Start();
            LayoutStack();
            await RefreshAsync();
        }
    }
}
