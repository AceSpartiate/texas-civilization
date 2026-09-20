using System.Drawing.Drawing2D;

namespace TexasRevolution.Launcher;

/// <summary>
/// The colours the launcher's face is painted in, in one place.
/// </summary>
/// <remarks>
/// Every one of these is taken off the owner's mockup of 2026-09-20 and off the painting behind
/// it: gold rules, cream lettering, a green for the one button that starts a lesson and a night
/// blue for the one that is only ever pressed by the owner.
/// </remarks>
internal static class Palette
{
    // Only used when the painting cannot be read; see TitleScene.Fallback.
    public static readonly Color PaperLight = Color.FromArgb(228, 208, 168);
    public static readonly Color PaperDark = Color.FromArgb(146, 120, 82);
    public static readonly Color Dusk = Color.FromArgb(42, 54, 62);

    public static readonly Color Gold = Color.FromArgb(198, 160, 74);
    public static readonly Color GoldBright = Color.FromArgb(230, 196, 116);
    public static readonly Color GoldDim = Color.FromArgb(146, 120, 62);
    public static readonly Color Cream = Color.FromArgb(246, 236, 214);
    public static readonly Color Ink = Color.FromArgb(18, 14, 10);

    /// <summary>The fill behind an ordinary button: dark, and thin enough to read the painting through.</summary>
    public static readonly Color ButtonFill = Color.FromArgb(30, 26, 22);
    public static readonly Color StartGreen = Color.FromArgb(46, 86, 52);
    public static readonly Color StopRust = Color.FromArgb(116, 62, 44);
    public static readonly Color SoloBlue = Color.FromArgb(38, 52, 88);
    public static readonly Color UpdateAmber = Color.FromArgb(104, 84, 38);

    public static readonly Color LampRunning = Color.FromArgb(128, 206, 126);
    public static readonly Color LampBusy = Color.FromArgb(228, 178, 88);
    public static readonly Color LampStopped = Color.FromArgb(166, 160, 144);
}

/// <summary>
/// The typefaces, chosen once from what the machine actually has.
/// </summary>
/// <remarks>
/// A school computer is not guaranteed to have any particular font, and asking for a missing
/// one throws rather than substituting, so every face is a list whose last entry is a family
/// Windows has always shipped.
/// </remarks>
internal static class Faces
{
    public static readonly string Display = Pick("Bookman Old Style", "Georgia", "Palatino Linotype", "Times New Roman");
    public static readonly string Serif = Pick("Georgia", "Palatino Linotype", "Times New Roman");
    public static readonly string Mono = Pick("Consolas", "Courier New");
    public static readonly string Ui = Pick("Segoe UI", "Tahoma", "Arial");

    private static string Pick(params string[] names)
    {
        foreach (var name in names)
        {
            try { using var family = new FontFamily(name); return name; }
            catch { /* not on this machine; try the next */ }
        }
        return FontFamily.GenericSerif.Name;
    }

    public static Font Make(string family, float points, FontStyle style = FontStyle.Regular)
    {
        try { return new Font(family, Math.Max(4f, points), style); }
        catch { return new Font(FontFamily.GenericSansSerif, Math.Max(4f, points), style); }
    }
}

/// <summary>The small gold marks on the buttons. Drawn in strokes, not loaded.</summary>
internal enum Glyph { None, People, Monitor, Person, Clipboard, Link, Swords, Gear, Star }

/// <summary>
/// The launcher's face: the owner's painting, cropped to the window, with the two washes that
/// make words readable over it.
/// </summary>
/// <remarks>
/// The painting (<c>launcher/art/background.png</c>, supplied by the owner 2026-09-20) is the
/// Alamo at sunset with the Lone Star flag on a timber pole, a field cannon at the right, a
/// column of riflemen at the lower left and the left edge dissolving into cracked parchment
/// carrying the outline of Texas. It has no lettering on it: the masthead, the release line, the
/// buttons and the dividers are all drawn over it by this program.
///
/// <para><b>Cropped, never squashed.</b> The painting is 3:4 and the window is taller and
/// narrower than that, so it is scaled to cover and the overflow is cut. The crop is anchored
/// high (36% down) because everything worth seeing - the sky, the flag, the chapel - is in the
/// top half, and what is lost off the bottom is foreground grass. On a short screen that is what
/// keeps the flag on the window instead of a stretched one.</para>
///
/// <para><b>The two washes.</b> The painting is light parchment at the top left and dark cloud at
/// the top right, so cream lettering laid straight on it would read against one half and vanish
/// against the other. A dark gradient down from the top carries the masthead, and a second up
/// from the bottom seats the buttons and the uninstall link. Neither is opaque; the painting is
/// visible through both, which is the whole point of putting it there.</para>
///
/// <para><b>Nothing in here may throw.</b> A launcher that will not open because an image
/// resource is missing is worse than a plain green window, so the painting, the fonts and the
/// whole render are guarded and fall back to flat colour.</para>
///
/// <para>ceiling: the scene is re-rendered to a bitmap the size of the window whenever the window
/// changes size or DPI, and nothing in it is parallaxed or animated. A window this size renders
/// in a few milliseconds. If that ever stops being true, cache one scaled copy per size instead.</para>
/// </remarks>
internal static class TitleScene
{
    /// <summary>
    /// Paint the whole face at this size. Never throws: on any failure the caller gets a flat
    /// parchment bitmap, which is plain and works.
    /// </summary>
    /// <param name="size">The window's client area, in device pixels.</param>
    /// <param name="scale">Device pixels per logical pixel, so the motto is the same size to the eye at any DPI.</param>
    public static Bitmap Render(Size size, float scale)
    {
        var width = Math.Max(1, size.Width);
        var height = Math.Max(1, size.Height);
        var bitmap = new Bitmap(width, height);
        try
        {
            using var g = Graphics.FromImage(bitmap);
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            if (!Painting(g, width, height)) Fallback(g, width, height);
            Washes(g, width, height);
            Motto(g, width, scale);
        }
        catch
        {
            try { using var g = Graphics.FromImage(bitmap); g.Clear(Palette.PaperDark); }
            catch { /* a blank bitmap is still a bitmap */ }
        }
        return bitmap;
    }

    /// <summary>The height, in device pixels, that <see cref="Motto"/> needs kept clear at the top.</summary>
    public static int MottoHeight(float scale) => (int)Math.Round(20 * scale);

    /// <summary>Scale to cover and cut the overflow, anchored high. False when there is no painting to draw.</summary>
    private static bool Painting(Graphics g, int w, int h)
    {
        var art = Branding.Painting;
        if (art is null) return false;
        try
        {
            var cover = Math.Max((float)w / art.Width, (float)h / art.Height);
            var drawn = new SizeF(art.Width * cover, art.Height * cover);
            // 0.5 across (the flag is at the right, the parchment at the left, and both deserve
            // their share); 0.36 down, which keeps the sky, the flag and the chapel.
            var x = (w - drawn.Width) * 0.50f;
            var y = (h - drawn.Height) * 0.36f;
            g.DrawImage(art, x, y, drawn.Width, drawn.Height);
            return true;
        }
        catch { return false; }
    }

    /// <summary>Plain colour, for the day the painting cannot be read.</summary>
    private static void Fallback(Graphics g, int w, int h)
    {
        var all = new Rectangle(0, 0, w, h);
        using (var paper = new LinearGradientBrush(all, Palette.PaperLight, Palette.PaperDark, 62f))
            g.FillRectangle(paper, all);
        var duskHeight = Math.Max(2, (int)(h * 0.66f));
        using var dusk = new LinearGradientBrush(
            new Rectangle(0, -1, w, duskHeight + 1),
            Color.FromArgb(245, Palette.Dusk), Color.FromArgb(0, Palette.Dusk), 90f);
        g.FillRectangle(dusk, new Rectangle(0, 0, w, duskHeight));
    }

    private static void Washes(Graphics g, int w, int h)
    {
        try
        {
            var top = Math.Max(2, (int)(h * 0.30f));
            using (var brush = new LinearGradientBrush(
                       new Rectangle(0, -1, w, top + 1),
                       Color.FromArgb(176, Palette.Ink), Color.FromArgb(0, Palette.Ink), 90f))
                g.FillRectangle(brush, new Rectangle(0, 0, w, top));

            var bottomTop = (int)(h * 0.46f);
            var bottom = Math.Max(2, h - bottomTop);
            using (var brush = new LinearGradientBrush(
                       new Rectangle(0, bottomTop - 1, w, bottom + 2),
                       Color.FromArgb(0, Palette.Ink), Color.FromArgb(150, Palette.Ink), 90f))
                g.FillRectangle(brush, new Rectangle(0, bottomTop, w, bottom));
        }
        catch { /* the painting without its washes is still a painting */ }
    }

    /// <summary>
    /// The motto from the owner's mockup, in the top right where the mockup puts it.
    /// </summary>
    /// <remarks>
    /// Decorative, on the same terms as the emblem in docs/art-provenance.json: it is the design
    /// the owner drew, not a caption on the picture, and it makes no claim about what this window
    /// is showing.
    /// </remarks>
    private static void Motto(Graphics g, int w, float scale)
    {
        try
        {
            using var font = Faces.Make(Faces.Serif, 7.5f * scale, FontStyle.Bold);
            using var brush = new SolidBrush(Color.FromArgb(136, Palette.Cream));
            DrawSpaced(g, "COME AND TAKE IT", font, brush,
                new PointF(w - 14 * scale, 6 * scale), 2.6f * scale, Align.Right);
        }
        catch { /* skip */ }
    }

    internal enum Align { Left, Centre, Right }

    /// <summary>
    /// Spaced capitals. GDI+ has no letter-spacing, so the letters are placed one at a time -
    /// which is also the only way to get the wide, quiet lettering the mockup uses.
    /// </summary>
    internal static void DrawSpaced(Graphics g, string text, Font font, Brush brush, PointF at, float spacing, Align align)
    {
        var format = StringFormat.GenericTypographic;
        var widths = new float[text.Length];
        var total = 0f;
        for (var i = 0; i < text.Length; i++)
        {
            widths[i] = g.MeasureString(text[i].ToString(), font, PointF.Empty, format).Width;
            total += widths[i] + spacing;
        }
        if (text.Length > 0) total -= spacing;
        var x = align switch { Align.Right => at.X - total, Align.Centre => at.X - total / 2f, _ => at.X };
        for (var i = 0; i < text.Length; i++)
        {
            g.DrawString(text[i].ToString(), font, brush, x, at.Y, format);
            x += widths[i] + spacing;
        }
    }

    /// <summary>The five-pointed star that sits in the middle of every gold rule on this window.</summary>
    internal static void DrawStar(Graphics g, RectangleF box, Color colour)
    {
        var cx = box.X + box.Width / 2f;
        var cy = box.Y + box.Height / 2f;
        var outer = Math.Min(box.Width, box.Height) / 2f;
        var inner = outer * 0.42f;
        var points = new PointF[10];
        for (var i = 0; i < 10; i++)
        {
            var radius = i % 2 == 0 ? outer : inner;
            var angle = -Math.PI / 2 + i * Math.PI / 5;
            points[i] = new PointF(cx + (float)(Math.Cos(angle) * radius), cy + (float)(Math.Sin(angle) * radius));
        }
        using var brush = new SolidBrush(colour);
        g.FillPolygon(brush, points);
    }

    /// <summary>
    /// The button marks: a group of people, a monitor, a person, a clipboard, a chain link,
    /// crossed swords, a gear.
    /// </summary>
    /// <remarks>
    /// Not a stand-in: every plate the launcher shows is cast, and its mark is in the art. These
    /// strokes are drawn only on a plate whose art could not be read, so they are what a launcher
    /// with no pictures in it falls back to rather than something waiting to be replaced.
    ///
    /// <para>ceiling: seven marks in a switch, each a few strokes, and no attempt to match the cast
    /// ones. A fallback is allowed to look like a fallback. If the day comes that a plate is wanted
    /// without its label baked in, ask for the marks as cut art instead (docs/ART_REQUESTS.md,
    /// Request 2026-09-20).</para>
    /// </remarks>
    internal static void DrawGlyph(Graphics g, Glyph glyph, RectangleF box, Color colour)
    {
        if (glyph == Glyph.None || box.Width < 2f) return;
        var stroke = Math.Max(1.1f, box.Width * 0.085f);
        using var pen = new Pen(colour, stroke) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round };
        using var brush = new SolidBrush(colour);
        var x = box.X;
        var y = box.Y;
        var s = box.Width;
        var mode = g.SmoothingMode;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        try
        {
            switch (glyph)
            {
                case Glyph.People:
                    g.DrawEllipse(pen, x + s * 0.02f, y + s * 0.20f, s * 0.24f, s * 0.24f);
                    g.DrawArc(pen, x - s * 0.02f, y + s * 0.52f, s * 0.34f, s * 0.42f, 180, 180);
                    g.DrawEllipse(pen, x + s * 0.74f, y + s * 0.20f, s * 0.24f, s * 0.24f);
                    g.DrawArc(pen, x + s * 0.68f, y + s * 0.52f, s * 0.34f, s * 0.42f, 180, 180);
                    g.DrawEllipse(pen, x + s * 0.33f, y + s * 0.06f, s * 0.34f, s * 0.34f);
                    g.DrawArc(pen, x + s * 0.23f, y + s * 0.46f, s * 0.54f, s * 0.56f, 180, 180);
                    break;
                case Glyph.Monitor:
                    g.DrawRectangle(pen, x + s * 0.05f, y + s * 0.12f, s * 0.90f, s * 0.58f);
                    g.DrawLine(pen, x + s * 0.50f, y + s * 0.72f, x + s * 0.50f, y + s * 0.86f);
                    g.DrawLine(pen, x + s * 0.28f, y + s * 0.88f, x + s * 0.72f, y + s * 0.88f);
                    break;
                case Glyph.Person:
                    g.DrawEllipse(pen, x + s * 0.30f, y + s * 0.08f, s * 0.40f, s * 0.40f);
                    g.DrawArc(pen, x + s * 0.10f, y + s * 0.54f, s * 0.80f, s * 0.68f, 180, 180);
                    break;
                case Glyph.Clipboard:
                    g.DrawRectangle(pen, x + s * 0.16f, y + s * 0.14f, s * 0.68f, s * 0.78f);
                    g.FillRectangle(brush, x + s * 0.36f, y + s * 0.04f, s * 0.28f, s * 0.16f);
                    g.DrawLine(pen, x + s * 0.32f, y + s * 0.46f, x + s * 0.68f, y + s * 0.46f);
                    g.DrawLine(pen, x + s * 0.32f, y + s * 0.66f, x + s * 0.68f, y + s * 0.66f);
                    break;
                case Glyph.Link:
                    g.DrawArc(pen, x + s * 0.02f, y + s * 0.30f, s * 0.54f, s * 0.40f, 40, 280);
                    g.DrawArc(pen, x + s * 0.44f, y + s * 0.30f, s * 0.54f, s * 0.40f, 220, 280);
                    g.DrawLine(pen, x + s * 0.34f, y + s * 0.50f, x + s * 0.66f, y + s * 0.50f);
                    break;
                case Glyph.Swords:
                    g.DrawLine(pen, x + s * 0.08f, y + s * 0.94f, x + s * 0.88f, y + s * 0.08f);
                    g.DrawLine(pen, x + s * 0.92f, y + s * 0.94f, x + s * 0.12f, y + s * 0.08f);
                    g.DrawLine(pen, x + s * 0.62f, y + s * 0.06f, x + s * 0.88f, y + s * 0.28f);
                    g.DrawLine(pen, x + s * 0.38f, y + s * 0.06f, x + s * 0.12f, y + s * 0.28f);
                    break;
                case Glyph.Gear:
                    // A ring with eight short stubs. Longer teeth on a smaller ring read as a sun.
                    g.DrawEllipse(pen, x + s * 0.20f, y + s * 0.20f, s * 0.60f, s * 0.60f);
                    g.FillEllipse(brush, x + s * 0.40f, y + s * 0.40f, s * 0.20f, s * 0.20f);
                    using (var teeth = new Pen(colour, stroke * 1.9f) { StartCap = LineCap.Flat, EndCap = LineCap.Flat })
                        for (var i = 0; i < 8; i++)
                        {
                            var angle = i * Math.PI / 4;
                            var cx = x + s * 0.5f;
                            var cy = y + s * 0.5f;
                            g.DrawLine(teeth,
                                cx + (float)Math.Cos(angle) * s * 0.30f, cy + (float)Math.Sin(angle) * s * 0.30f,
                                cx + (float)Math.Cos(angle) * s * 0.47f, cy + (float)Math.Sin(angle) * s * 0.47f);
                        }
                    break;
                case Glyph.Star:
                    DrawStar(g, box, colour);
                    break;
            }
        }
        catch { /* a button with no mark is still a button */ }
        finally { g.SmoothingMode = mode; }
    }
}
