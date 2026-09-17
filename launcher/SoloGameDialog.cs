namespace TexasRevolution.Launcher;

/// <summary>
/// Play Solo's first question: a new game, or one of the saved solo games.
/// </summary>
/// <remarks>
/// Owner, 2026-09-17: "When pressing Solo Game, a popup should ask if the player wants to start a new game, or continue an
/// old one. they can't continue a multiplayer game from there." By multiple choice, a list of every saved solo game. Only
/// the solo server's own games are listed (<see cref="ServerControl.ListSoloGamesAsync"/>), so a class is never offered.
/// The newest is selected, so Continue is one press; a double-click continues the game clicked.
/// </remarks>
public sealed class SoloGameDialog : Form
{
    private readonly ListBox _games = new() { Dock = DockStyle.Fill, IntegralHeight = false, BorderStyle = BorderStyle.FixedSingle };
    private readonly Button _new = new() { Text = "New game", AutoSize = true, Padding = new Padding(10, 4, 10, 4) };
    private readonly Button _continue = new() { Text = "Continue", AutoSize = true, Padding = new Padding(10, 4, 10, 4) };
    private readonly Button _cancel = new() { Text = "Cancel", AutoSize = true, Padding = new Padding(10, 4, 10, 4), DialogResult = DialogResult.Cancel };

    /// <summary>The saved game chosen, or null for a new game.</summary>
    public string? ContinueId { get; private set; }

    public SoloGameDialog(IReadOnlyList<SoloGame> games)
    {
        Text = "Play Solo";
        Branding.Apply(this);
        StartPosition = FormStartPosition.CenterParent;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false; MinimizeBox = false; ShowInTaskbar = false;
        ClientSize = new Size(520, 320);
        Padding = new Padding(14);
        BackColor = Color.FromArgb(38, 48, 42);
        ForeColor = Color.WhiteSmoke;
        Font = new Font("Segoe UI", 9.5f);

        var question = new Label
        {
            Dock = DockStyle.Top, Height = 44,
            Text = "Start a new game, or continue a saved one?",
            Font = new Font("Segoe UI", 12f, FontStyle.Bold),
        };
        _games.Font = new Font("Segoe UI", 10f);
        _games.BackColor = Color.FromArgb(246, 240, 225);
        _games.ForeColor = Color.FromArgb(40, 34, 24);
        foreach (var game in games) _games.Items.Add(game);
        if (_games.Items.Count > 0) _games.SelectedIndex = 0;

        var buttons = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 46, FlowDirection = FlowDirection.RightToLeft, Padding = new Padding(0, 8, 0, 0) };
        foreach (var button in new[] { _cancel, _continue, _new })
        {
            button.FlatStyle = FlatStyle.Flat;
            button.BackColor = Color.FromArgb(54, 66, 58);
            button.ForeColor = Color.WhiteSmoke;
            buttons.Controls.Add(button);
        }
        _continue.BackColor = Color.FromArgb(74, 104, 80);

        Controls.Add(_games);
        Controls.Add(buttons);
        Controls.Add(question);

        _new.Click += (_, _) => { ContinueId = null; DialogResult = DialogResult.OK; };
        _continue.Click += (_, _) => Continue();
        _games.DoubleClick += (_, _) => Continue();
        _games.SelectedIndexChanged += (_, _) => _continue.Enabled = _games.SelectedItem is SoloGame;
        AcceptButton = _continue;
        CancelButton = _cancel;
    }

    private void Continue()
    {
        if (_games.SelectedItem is not SoloGame game) return;
        ContinueId = game.Id;
        DialogResult = DialogResult.OK;
    }
}
