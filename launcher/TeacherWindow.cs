using Microsoft.Web.WebView2.WinForms;

namespace TexasRevolution.Launcher;

/// <summary>
/// The Host view, in a window of its own rather than a browser tab.
/// </summary>
/// <remarks>
/// This exists for one reason: a teacher is projecting. A browser tab brings an address bar
/// carrying the private Host credential, other tabs, bookmarks and whatever notification
/// happens to arrive, onto a screen thirty children are looking at. A window we own shows
/// the class and nothing else, and can be put on the right monitor and made full screen
/// without a teacher hunting for the keystroke.
///
/// The URL is never shown, because it *is* the credential.
///
/// <para>Solo Mode reuses the same window for the player's page, with a button for its own
/// class view and one for a new game, and with developer tools on, because the person
/// looking at it is the one building the game rather than a class watching it.</para>
/// </remarks>
public sealed class TeacherWindow : Form
{
    private readonly WebView2 _view = new() { Dock = DockStyle.Fill };
    private readonly Panel _bar = new() { Dock = DockStyle.Top, Height = 40, Padding = new Padding(6, 5, 6, 5) };
    private readonly bool _developer;
    private FormBorderStyle _borderBeforeFullScreen;
    private FormWindowState _stateBeforeFullScreen;
    private bool _fullScreen;

    public TeacherWindow(string hostUrl) : this(hostUrl, "Texas Revolution — class view") { }

    /// <param name="url">The page to open.</param>
    /// <param name="title">The window's title.</param>
    /// <param name="developer">Developer tools and context menus on (Solo Mode).</param>
    /// <param name="extra">Further buttons for the bar, left of the standard ones.</param>
    public TeacherWindow(string url, string title, bool developer = false, params (string Text, Action<TeacherWindow> OnClick)[] extra)
    {
        Text = title;
        _developer = developer;
        Branding.Apply(this);
        StartPosition = FormStartPosition.CenterScreen;
        Width = 1280;
        Height = 800;
        MinimumSize = new Size(720, 480);
        BackColor = Color.FromArgb(38, 48, 42);

        var fullScreen = Button("Full screen", (_, _) => ToggleFullScreen());
        var nextMonitor = Button("Next monitor", (_, _) => MoveToNextScreen());
        var reload = Button("Reload", (_, _) => _view.CoreWebView2?.Reload());
        // Right-docked controls added first sit furthest left, so this reads left to right on
        // the bar: any extra buttons, then the standard three.
        foreach (var (text, onClick) in extra) _bar.Controls.Add(Button(text, (_, _) => onClick(this)));
        foreach (var control in new[] { reload, nextMonitor, fullScreen }) _bar.Controls.Add(control);

        Controls.Add(_view);
        Controls.Add(_bar);
        Load += async (_, _) =>
        {
            // Its own user-data folder, beside the class data, so the presentation view never
            // inherits a teacher's ordinary browsing profile - or leaves anything in it.
            var profile = Path.Combine(Path.GetTempPath(), "TexasRevolutionView");
            Directory.CreateDirectory(profile);
            var environment = await Microsoft.Web.WebView2.Core.CoreWebView2Environment.CreateAsync(null, profile);
            await _view.EnsureCoreWebView2Async(environment);
            _view.CoreWebView2.Settings.AreDefaultContextMenusEnabled = _developer;
            _view.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _view.CoreWebView2.Settings.AreDevToolsEnabled = _developer;
            // Nothing in this page opens a new window, and a stray one would land off-screen.
            _view.CoreWebView2.NewWindowRequested += (_, args) => args.Handled = true;
            // Esc and F11 while the page has the keyboard (owner, 2026-09-17: "went fullscreen, and saw no way to exit fullscreen. it
            // should be the esc button on the keyboard"). Keys pressed in the page go to the browser, not this form, so the page
            // tells the window through a web message; the controller's accelerator event catches F11 as well.
            await _view.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
                "window.addEventListener('keydown', e => { if ((e.key === 'Escape' || e.key === 'F11') && window.chrome?.webview) { if (e.key === 'F11') e.preventDefault(); window.chrome.webview.postMessage('launcher-key:' + e.key); } }, true);");
            _view.CoreWebView2.WebMessageReceived += (_, args) =>
            {
                var message = args.TryGetWebMessageAsString();
                if (message == "launcher-key:F11") ToggleFullScreen();
                else if (message == "launcher-key:Escape" && _fullScreen) ToggleFullScreen();
            };
            _view.CoreWebView2.Navigate(url);
        };
        KeyPreview = true;
        KeyDown += (_, args) =>
        {
            if (args.KeyCode == Keys.F11) ToggleFullScreen();
            if (args.KeyCode == Keys.Escape && _fullScreen) ToggleFullScreen();
        };
    }

    /// <summary>Open another page in this window.</summary>
    public void Navigate(string url)
    {
        if (_view.CoreWebView2 is { } core) core.Navigate(url);
    }

    private static Button Button(string text, EventHandler onClick)
    {
        var button = new Button
        {
            Text = text,
            Dock = DockStyle.Right,
            Width = 120,
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.FromArgb(58, 72, 62),
            ForeColor = Color.WhiteSmoke,
            Margin = new Padding(4, 0, 4, 0),
        };
        button.FlatAppearance.BorderColor = Color.FromArgb(96, 112, 100);
        button.Click += onClick;
        return button;
    }

    private void ToggleFullScreen()
    {
        _fullScreen = !_fullScreen;
        if (_fullScreen)
        {
            ShowExitHint();
            _borderBeforeFullScreen = FormBorderStyle;
            _stateBeforeFullScreen = WindowState;
            // Normal first: going straight from Maximized to a borderless maximized window
            // leaves the taskbar sitting over the class.
            WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.None;
            Bounds = Screen.FromControl(this).Bounds;
            _bar.Visible = false;
        }
        else
        {
            FormBorderStyle = _borderBeforeFullScreen;
            WindowState = _stateBeforeFullScreen;
            _bar.Visible = true;
            _exitHint.Visible = false;
        }
    }

    private readonly Label _exitHint = new()
    {
        Text = "Press Esc to exit full screen", AutoSize = true, Visible = false, Padding = new Padding(12, 8, 12, 8),
        BackColor = Color.FromArgb(38, 48, 42), ForeColor = Color.WhiteSmoke, Font = new Font("Segoe UI", 11f),
    };
    private readonly System.Windows.Forms.Timer _exitHintTimer = new() { Interval = 3000 };

    /// <summary>Said for three seconds on entering full screen, over the top of the page, as browsers do.</summary>
    private void ShowExitHint()
    {
        if (!Controls.Contains(_exitHint))
        {
            Controls.Add(_exitHint);
            _exitHintTimer.Tick += (_, _) => { _exitHintTimer.Stop(); _exitHint.Visible = false; };
        }
        _exitHint.Visible = true;
        _exitHint.BringToFront();
        BeginInvoke(() => _exitHint.Location = new Point(Math.Max(0, (ClientSize.Width - _exitHint.Width) / 2), 24));
        _exitHintTimer.Stop();
        _exitHintTimer.Start();
    }

    /// <summary>Move to the next display, keeping the window's proportions.</summary>
    private void MoveToNextScreen()
    {
        var screens = Screen.AllScreens;
        if (screens.Length < 2) return;
        var current = Array.FindIndex(screens, screen => screen.DeviceName == Screen.FromControl(this).DeviceName);
        var target = screens[(current + 1) % screens.Length].WorkingArea;
        var wasFullScreen = _fullScreen;
        if (wasFullScreen) ToggleFullScreen();
        WindowState = FormWindowState.Normal;
        Bounds = new Rectangle(
            target.X + (target.Width - Math.Min(Width, target.Width)) / 2,
            target.Y + (target.Height - Math.Min(Height, target.Height)) / 2,
            Math.Min(Width, target.Width),
            Math.Min(Height, target.Height));
        if (wasFullScreen) ToggleFullScreen();
    }
}
