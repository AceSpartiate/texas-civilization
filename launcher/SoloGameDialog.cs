namespace TexasRevolution.Launcher;

/// <summary>
/// Play Solo's first question: a new game, or one of the saved solo games.
/// </summary>
/// <remarks>
/// Owner, 2026-09-17: "When pressing Solo Game, a popup should ask if the player wants to start a new game, or continue an
/// old one. they can't continue a multiplayer game from there." By multiple choice, a list of every saved solo game. Only
/// the solo server's own games are listed (<see cref="ServerControl.ListSoloGamesAsync"/>), so a class is never offered.
/// The newest is selected, so Continue is one press; a double-click continues the game clicked.
///
/// Owner, 2026-09-21: "I need a way to delete solo games" — and, asked where it should live, "When I click Play Solo a
/// menu appears. This menu has the saves. That's where a little trash can emblem should appear and let me delete the
/// save." So the list draws itself: one line a game and a trash can at the end of that line. It asks once, naming the
/// family, and the server *sets the game aside* rather than destroying it.
/// </remarks>
public sealed class SoloGameDialog : Form
{
    private static readonly Lazy<Image?> DeleteSaveIcon = new(() =>
    {
        try
        {
            using var stream = typeof(SoloGameDialog).Assembly.GetManifestResourceStream("TexasRevolution.Launcher.art.icon-delete-save.png");
            if (stream is null) return null;
            using var source = Image.FromStream(stream, useEmbeddedColorManagement: false, validateImageData: false);
            return new Bitmap(source);
        }
        catch { return null; }
    });
    private readonly ListBox _games = new() { Dock = DockStyle.Fill, IntegralHeight = false, BorderStyle = BorderStyle.FixedSingle };
    private readonly Button _new = new() { Text = "New game", AutoSize = true, Padding = new Padding(10, 4, 10, 4) };
    private readonly Button _continue = new() { Text = "Continue", AutoSize = true, Padding = new Padding(10, 4, 10, 4) };
    private readonly Button _cancel = new() { Text = "Cancel", AutoSize = true, Padding = new Padding(10, 4, 10, 4), DialogResult = DialogResult.Cancel };
    private readonly Label _said = new() { Dock = DockStyle.Bottom, Height = 20, ForeColor = Color.FromArgb(214, 196, 150) };
    private readonly Func<string, Task<string?>>? _delete;

    /// <summary>The width at the end of a row that belongs to the trash can, and nothing else.</summary>
    private const int BinWidth = 34;
    /// <summary>Row height: a line of text and a target a finger or a tired hand can hit.</summary>
    private const int RowHeight = 30;

    /// <summary>The saved game chosen, or null for a new game.</summary>
    public string? ContinueId { get; private set; }

    /// <param name="delete">
    /// Asks the solo server to set one game aside; returns why it could not, or null when it did. Null here leaves the
    /// trash cans undrawn altogether, which is what a dialog with no server behind it should look like.
    /// </param>
    public SoloGameDialog(IReadOnlyList<SoloGame> games, Func<string, Task<string?>>? delete = null)
    {
        _delete = delete;
        Text = "Play Solo";
        Branding.Apply(this);
        StartPosition = FormStartPosition.CenterParent;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false; MinimizeBox = false; ShowInTaskbar = false;
        ClientSize = new Size(520, 340);
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
        // Drawn by hand only so each row can carry its own trash can; the text is the same line SoloGame writes.
        _games.DrawMode = DrawMode.OwnerDrawFixed;
        _games.ItemHeight = RowHeight;
        _games.DrawItem += DrawGame;
        _games.MouseMove += (_, click) => { var over = BinUnder(click.Location); if (over != _hovered) { _hovered = over; _games.Invalidate(); } };
        _games.MouseLeave += (_, _) => { if (_hovered >= 0) { _hovered = -1; _games.Invalidate(); } };
        _games.MouseDown += (_, click) => { var bin = BinUnder(click.Location); if (bin >= 0) _ = DeleteAsync(bin); };
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
        Controls.Add(_said);
        Controls.Add(buttons);
        Controls.Add(question);

        _new.Click += (_, _) => { ContinueId = null; DialogResult = DialogResult.OK; };
        _continue.Click += (_, _) => Continue();
        _games.DoubleClick += (_, _) => Continue();
        _games.SelectedIndexChanged += (_, _) => _continue.Enabled = _games.SelectedItem is SoloGame;
        AcceptButton = _continue;
        CancelButton = _cancel;
    }

    private int _hovered = -1;
    private bool _deleting;

    /// <summary>Which row's trash can is under this point, or -1. A double-click on a row must never mean delete.</summary>
    private int BinUnder(Point point)
    {
        if (_delete is null) return -1;
        var row = _games.IndexFromPoint(point);
        if (row < 0 || row >= _games.Items.Count || _games.Items[row] is not SoloGame) return -1;
        var bounds = _games.GetItemRectangle(row);
        return point.X >= bounds.Right - BinWidth ? row : -1;
    }

    private void DrawGame(object? sender, DrawItemEventArgs args)
    {
        if (args.Index < 0 || args.Index >= _games.Items.Count) return;
        var game = _games.Items[args.Index] as SoloGame;
        var chosen = (args.State & DrawItemState.Selected) != 0;
        var background = chosen ? Color.FromArgb(74, 104, 80) : _games.BackColor;
        var ink = chosen ? Color.WhiteSmoke : _games.ForeColor;
        using (var fill = new SolidBrush(background)) args.Graphics.FillRectangle(fill, args.Bounds);
        var text = new Rectangle(args.Bounds.X + 6, args.Bounds.Y, args.Bounds.Width - BinWidth - 10, args.Bounds.Height);
        TextRenderer.DrawText(args.Graphics, game?.ToString() ?? string.Empty, _games.Font, text, ink,
            TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis | TextFormatFlags.NoPrefix);
        if (_delete is not null && game is not null)
            DrawBin(args.Graphics, new Rectangle(args.Bounds.Right - BinWidth, args.Bounds.Y, BinWidth, args.Bounds.Height), _hovered == args.Index, ink);
        args.DrawFocusRectangle();
    }

    /// <summary>
    /// The illustrated frontier pail, tinted to the row or warning red. The line drawing remains a safe packaging fallback.
    /// </summary>
    private static void DrawBin(Graphics graphics, Rectangle cell, bool lit, Color ink)
    {
        var colour = lit ? Color.FromArgb(150, 52, 30) : ink;
        if (DeleteSaveIcon.Value is { } icon)
        {
            var side = Math.Min(22, Math.Min(cell.Width - 8, cell.Height - 6));
            var target = new Rectangle(cell.X + (cell.Width - side) / 2, cell.Y + (cell.Height - side) / 2, side, side);
            var c = colour;
            var matrix = new System.Drawing.Imaging.ColorMatrix(new[] {
                new[] { c.R / 255f, 0f, 0f, 0f, 0f },
                new[] { 0f, c.G / 255f, 0f, 0f, 0f },
                new[] { 0f, 0f, c.B / 255f, 0f, 0f },
                new[] { 0f, 0f, 0f, lit ? 1f : .78f, 0f },
                new[] { 0f, 0f, 0f, 0f, 1f },
            });
            using var attributes = new System.Drawing.Imaging.ImageAttributes();
            attributes.SetColorMatrix(matrix);
            graphics.DrawImage(icon, target, 0, 0, icon.Width, icon.Height, GraphicsUnit.Pixel, attributes);
            return;
        }
        var was = graphics.SmoothingMode;
        graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        colour = lit ? colour : Color.FromArgb(150, ink.R, ink.G, ink.B);
        using var pen = new Pen(colour, lit ? 2f : 1.6f);
        var width = 14; var height = 15;
        var left = cell.X + (cell.Width - width) / 2;
        var top = cell.Y + (cell.Height - height) / 2 + 1;
        // The lid and its handle.
        graphics.DrawLine(pen, left - 2, top, left + width + 2, top);
        graphics.DrawLine(pen, left + 4, top - 3, left + width - 4, top - 3);
        graphics.DrawLine(pen, left + 4, top - 3, left + 4, top);
        graphics.DrawLine(pen, left + width - 4, top - 3, left + width - 4, top);
        // The body, a little narrower at the bottom, and the lines down it.
        graphics.DrawLine(pen, left + 1, top + 2, left + 3, top + height);
        graphics.DrawLine(pen, left + width - 1, top + 2, left + width - 3, top + height);
        graphics.DrawLine(pen, left + 3, top + height, left + width - 3, top + height);
        graphics.DrawLine(pen, left + 5, top + 4, left + 6, top + height - 3);
        graphics.DrawLine(pen, left + width - 5, top + 4, left + width - 6, top + height - 3);
        graphics.SmoothingMode = was;
    }

    /// <summary>
    /// Ask once, naming the family, then set the game aside. Asked once and only once: the dialog is not a place to
    /// lose an afternoon's play to a mis-click, and the wording says where the game goes rather than claiming it is
    /// destroyed, because it is not.
    /// </summary>
    private async Task DeleteAsync(int row)
    {
        if (_deleting || _delete is null || _games.Items[row] is not SoloGame game) return;
        var sure = MessageBox.Show(this,
            $"Delete {game.Family}?\n\n{game}\n\nThe game is set aside rather than destroyed: it leaves this list, and the file stays on this computer.",
            "Delete this solo game", MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2);
        if (sure != DialogResult.Yes) return;
        _deleting = true;
        _games.Enabled = false; _continue.Enabled = false;
        _said.Text = $"Deleting {game.Family}…";
        try
        {
            var error = await _delete(game.Id);
            if (error is not null) { _said.Text = $"That game could not be deleted. {error}"; return; }
            _games.Items.RemoveAt(row);
            _said.Text = _games.Items.Count == 0 ? "No saved games left. Press New game." : $"{game.Family} deleted.";
            if (_games.Items.Count > 0) _games.SelectedIndex = Math.Min(row, _games.Items.Count - 1);
        }
        finally
        {
            _deleting = false;
            _games.Enabled = true;
            _continue.Enabled = _games.SelectedItem is SoloGame;
            _hovered = -1;
            _games.Invalidate();
        }
    }

    private void Continue()
    {
        if (_games.SelectedItem is not SoloGame game) return;
        ContinueId = game.Id;
        DialogResult = DialogResult.OK;
    }
}
