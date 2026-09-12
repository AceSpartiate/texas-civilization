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
/// </remarks>
public sealed class TeacherWindow : Form
{
    private readonly WebView2 _view = new() { Dock = DockStyle.Fill };
    private readonly Panel _bar = new() { Dock = DockStyle.Top, Height = 40, Padding = new Padding(6, 5, 6, 5) };
    private FormBorderStyle _borderBeforeFullScreen;
    private FormWindowState _stateBeforeFullScreen;
    private bool _fullScreen;

    public TeacherWindow(string hostUrl)
    {
        Text = "Texas Revolution — class view";
        Branding.Apply(this);
        StartPosition = FormStartPosition.CenterScreen;
        Width = 1280;
        Height = 800;
        MinimumSize = new Size(720, 480);
        BackColor = Color.FromArgb(38, 48, 42);

        var fullScreen = Button("Full screen", (_, _) => ToggleFullScreen());
        var nextMonitor = Button("Next monitor", (_, _) => MoveToNextScreen());
        var reload = Button("Reload", (_, _) => _view.CoreWebView2?.Reload());
        // Right to left, so the order reads left to right on the bar.
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
            _view.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            _view.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _view.CoreWebView2.Settings.AreDevToolsEnabled = false;
            // Nothing in this page opens a new window, and a stray one would land off-screen.
            _view.CoreWebView2.NewWindowRequested += (_, args) => args.Handled = true;
            _view.CoreWebView2.Navigate(hostUrl);
        };
        KeyPreview = true;
        KeyDown += (_, args) =>
        {
            if (args.KeyCode == Keys.F11) ToggleFullScreen();
            if (args.KeyCode == Keys.Escape && _fullScreen) ToggleFullScreen();
        };
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
        }
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
