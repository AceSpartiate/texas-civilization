using System.Diagnostics;

namespace TexasRevolution.Launcher;

/// <summary>
/// The setup window. One decision, one button.
/// </summary>
/// <remarks>
/// A teacher installing this has a lesson to teach, not a wizard to complete. There is one
/// place it goes, one checkbox, and one button; the folder can be changed for the rare
/// person who cares, and everybody else can ignore it. No licence page, no component tree,
/// no offers.
/// </remarks>
public sealed class InstallerForm : Form
{
    private readonly Label _title = new() { Dock = DockStyle.Top, Height = 32, ForeColor = Color.WhiteSmoke };
    private readonly Label _blurb = new() { Dock = DockStyle.Top, Height = 56, ForeColor = Color.FromArgb(198, 210, 196) };
    private readonly Label _whereLabel = new() { Dock = DockStyle.Top, Height = 20, Text = "It will go here:", ForeColor = Color.FromArgb(150, 168, 150) };
    private readonly TextBox _where = new() { Dock = DockStyle.Top, ReadOnly = true, BorderStyle = BorderStyle.FixedSingle, BackColor = Color.FromArgb(48, 58, 50), ForeColor = Color.WhiteSmoke };
    private readonly Button _change = new() { Dock = DockStyle.Top, Height = 30, Text = "Choose a different folder…", FlatStyle = FlatStyle.Flat, BackColor = Color.FromArgb(48, 58, 50), ForeColor = Color.FromArgb(206, 216, 204) };
    private readonly CheckBox _desktop = new() { Dock = DockStyle.Top, Height = 30, Text = "Put a shortcut on the desktop", Checked = true, ForeColor = Color.WhiteSmoke };
    private readonly Button _install = new() { Dock = DockStyle.Top, Height = 50, Text = "Install", FlatStyle = FlatStyle.Flat, BackColor = Color.FromArgb(74, 104, 80), ForeColor = Color.White };
    private readonly ProgressBar _progress = new() { Dock = DockStyle.Top, Height = 16, Visible = false, Style = ProgressBarStyle.Continuous, Maximum = 100 };
    private readonly Label _state = new() { Dock = DockStyle.Fill, ForeColor = Color.FromArgb(214, 190, 140) };
    private string _target = Installer.DefaultTarget;

    public InstallerForm()
    {
        Text = "Install Texas Revolution";
        Branding.Apply(this);
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(520, 420);
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        BackColor = Color.FromArgb(38, 48, 42);
        Padding = new Padding(20, 16, 20, 16);
        Font = new Font("Segoe UI", 9.5f);

        _title.Text = "Texas Revolution";
        _title.Font = new Font("Segoe UI", 14f, FontStyle.Bold);
        var upgrading = Installer.AlreadyInstalled(_target);
        _blurb.Text = upgrading
            ? "A copy is already installed here. Installing again replaces it and keeps every class you have saved."
            : "A classroom simulation of Gonzales in 1835. This installs for you only — no administrator needed, and nothing is changed for anyone else who uses this computer.";
        _where.Text = _target;
        _install.Text = upgrading ? "Update" : "Install";
        _install.Font = new Font("Segoe UI", 11.5f, FontStyle.Bold);

        _change.Click += (_, _) => ChooseFolder();
        _install.Click += async (_, _) => await InstallAsync();

        Controls.Add(_state);
        foreach (var control in new Control[] { _progress, _install, _desktop, _change, _where, _whereLabel, _blurb, _title })
            Controls.Add(control);
    }

    private void ChooseFolder()
    {
        using var dialog = new FolderBrowserDialog
        {
            Description = "Where should Texas Revolution go?",
            UseDescriptionForTitle = true,
            SelectedPath = Directory.Exists(_target) ? _target : Path.GetDirectoryName(_target) ?? _target,
        };
        if (dialog.ShowDialog(this) != DialogResult.OK) return;
        // Chosen a folder that is not ours: put ours inside it rather than scattering the
        // game across somebody's Documents.
        _target = Path.GetFileName(dialog.SelectedPath.TrimEnd(Path.DirectorySeparatorChar))
            .Equals("TexasRevolution", StringComparison.OrdinalIgnoreCase)
            ? dialog.SelectedPath
            : Path.Combine(dialog.SelectedPath, "TexasRevolution");
        _where.Text = _target;
        _install.Text = Installer.AlreadyInstalled(_target) ? "Update" : "Install";
    }

    private async Task InstallAsync()
    {
        foreach (var control in new Control[] { _install, _change, _desktop }) control.Enabled = false;
        _progress.Visible = true;
        var progress = new Progress<(int Percent, string What)>(step =>
        {
            _progress.Value = Math.Clamp(step.Percent, 0, 100);
            _state.Text = step.What;
        });
        try
        {
            var target = _target;
            var desktop = _desktop.Checked;
            await Task.Run(() => Installer.Install(target, desktop, progress));
            _state.Text = "Installed. Opening Texas Revolution…";
            Process.Start(new ProcessStartInfo(Path.Combine(target, "TexasRevolution.exe"))
            {
                UseShellExecute = true,
                WorkingDirectory = target,
            });
            await Task.Delay(600);
            Close();
        }
        catch (Exception error)
        {
            _progress.Visible = false;
            _state.Text = $"It did not install. {error.Message}";
            foreach (var control in new Control[] { _install, _change, _desktop }) control.Enabled = true;
        }
    }
}
