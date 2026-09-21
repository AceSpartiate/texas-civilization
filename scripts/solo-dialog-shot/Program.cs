using System.Drawing.Imaging;

namespace TexasRevolution.Launcher;

/// <summary>One saved solo game, as the solo server lists it. The same shape and the same line as ServerControl's.</summary>
public sealed record SoloGame(string Id, string Family, string Date, int Period, string Status, string SavedAt)
{
    public override string ToString()
    {
        var when = DateTimeOffset.TryParse(SavedAt, out var at) ? at.ToLocalTime().ToString("MMM d, h:mm tt") : SavedAt;
        var standing = Status == "ended" ? "finished" : $"{Date}";
        return $"{Family}  —  {standing}  ·  played {when}";
    }
}

/// <summary>Stands in for the launcher's own Branding, which reads an icon embedded in the launcher assembly.</summary>
internal static class Branding { internal static void Apply(Form form) { } }

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        var path = args.Length > 0 ? args[0] : "solo-dialog.png";
        var games = new List<SoloGame>
        {
            new("s-a1b2c3d4e5", "The Navarro family", "October 2, 1835", 1, "running", DateTimeOffset.Now.AddMinutes(-4).ToString("o")),
            new("s-f6g7h8i9j0", "The Proofwright family", "November 14, 1835", 1, "paused", DateTimeOffset.Now.AddHours(-3).ToString("o")),
            new("s-k1l2m3n4o5", "The Esparza family", "", 2, "ended", DateTimeOffset.Now.AddDays(-2).ToString("o")),
        };
        using var dialog = new SoloGameDialog(games, _ => Task.FromResult<string?>(null));
        // Shown off the side of the screen and drawn from there. A form that has never been shown draws itself
        // empty - the first picture taken this way was a bare green rectangle - because its children are not
        // created until it is.
        dialog.StartPosition = FormStartPosition.Manual;
        dialog.Location = new Point(-4000, -4000);
        dialog.Show();
        for (var settle = 0; settle < 12; settle++) { Application.DoEvents(); Thread.Sleep(20); }
        using var picture = new Bitmap(dialog.Width, dialog.Height);
        dialog.DrawToBitmap(picture, new Rectangle(0, 0, dialog.Width, dialog.Height));
        dialog.Hide();
        picture.Save(path, ImageFormat.Png);
        Console.WriteLine($"wrote {path} ({picture.Width}x{picture.Height})");
        return 0;
    }
}
