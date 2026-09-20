using System.Drawing.Drawing2D;

namespace TexasRevolution.Launcher;

/// <summary>A window that can hand a child control the piece of the painting it is standing on.</summary>
internal interface IBackdrop
{
    void PaintBackdrop(Graphics g, Control child);
}

/// <summary>
/// The one thing every control on the title window has to do: paint the painting behind itself.
/// </summary>
/// <remarks>
/// WinForms has no real transparency. A control with <c>BackColor = Transparent</c> asks its
/// parent to paint into it, which works until the parent is itself custom-painted or the control
/// is inside a scrolling panel, and then it half works - which is worse. So every control here
/// asks the window for the slice of the scene under its own bounds and draws it first. The
/// window's coordinates are found through the screen, so it is right at any nesting depth.
/// </remarks>
internal static class Scene
{
    public static void Backdrop(Control child, Graphics g)
    {
        if (child.FindForm() is IBackdrop host) { host.PaintBackdrop(g, child); return; }
        using var brush = new SolidBrush(Palette.Ink);
        g.FillRectangle(brush, child.ClientRectangle);
    }

    /// <summary>Text with the dark halo that keeps it readable over sky, stone or parchment alike.</summary>
    public static void Shadowed(Graphics g, string text, Font font, Color colour, RectangleF box, StringAlignment align, bool wrap, float shadow = 1.4f)
    {
        if (string.IsNullOrEmpty(text)) return;
        using var format = new StringFormat(wrap ? StringFormatFlags.NoClip : StringFormatFlags.NoWrap | StringFormatFlags.NoClip)
        {
            Alignment = align,
            LineAlignment = StringAlignment.Center,
            Trimming = StringTrimming.EllipsisCharacter,
        };
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        using (var dark = new SolidBrush(Color.FromArgb(190, 0, 0, 0)))
        {
            var behind = box;
            behind.Offset(shadow, shadow);
            g.DrawString(text, font, dark, behind, format);
        }
        using var brush = new SolidBrush(colour);
        g.DrawString(text, font, brush, box, format);
    }

    public static float MeasureHeight(Graphics g, string text, Font font, float width)
    {
        if (string.IsNullOrEmpty(text)) return 0f;
        using var format = new StringFormat { Alignment = StringAlignment.Center };
        return g.MeasureString(text, font, (int)Math.Max(8, width), format).Height;
    }
}

/// <summary>A line of words on the painting.</summary>
internal class SceneLabel : Label
{
    public StringAlignment Align { get; set; } = StringAlignment.Center;
    public bool Wrap { get; set; }

    /// <summary>Spaced capitals, as the mockup's map labels and its subtitle are set.</summary>
    public float LetterSpacing { get; set; }

    /// <summary>Shrink the face until the line fits the width. The masthead is the reason this exists.</summary>
    public bool Fit { get; set; }

    public SceneLabel()
    {
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.SupportsTransparentBackColor, true);
        AutoSize = false;
        BackColor = Color.Transparent;
    }

    protected override void OnPaintBackground(PaintEventArgs e) => Scene.Backdrop(this, e.Graphics);

    protected override void OnPaint(PaintEventArgs e)
    {
        // A paint that throws throws again on the very next paint, and on a window that repaints
        // itself is a stream of Windows error dialogs in front of a teacher. Every paint on this
        // window swallows rather than bubbles; the worst that is lost is one line of text.
        try
        {
            Scene.Backdrop(this, e.Graphics);
            PaintContent(e.Graphics);
        }
        catch { /* a label that will not draw is not worth a dialog */ }
    }

    protected virtual void PaintContent(Graphics g)
    {
        if (LetterSpacing <= 0f && !Fit)
        {
            Scene.Shadowed(g, Text, Font, ForeColor, ClientRectangle, Align, Wrap);
            return;
        }
        var font = Fit ? Fitted(g) : Font;
        try
        {
            if (LetterSpacing <= 0f)
            {
                Scene.Shadowed(g, Text, font, ForeColor, ClientRectangle, Align, Wrap);
                return;
            }
            var spacing = LetterSpacing * font.SizeInPoints * DeviceDpi / 72f / 10f;
            var y = (Height - font.GetHeight(g)) / 2f;
            var at = Align switch
            {
                StringAlignment.Near => new PointF(0, y),
                StringAlignment.Far => new PointF(Width, y),
                _ => new PointF(Width / 2f, y),
            };
            var align = Align switch
            {
                StringAlignment.Near => TitleScene.Align.Left,
                StringAlignment.Far => TitleScene.Align.Right,
                _ => TitleScene.Align.Centre,
            };
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
            using (var dark = new SolidBrush(Color.FromArgb(190, 0, 0, 0)))
                TitleScene.DrawSpaced(g, Text, font, dark, new PointF(at.X + 1.4f, at.Y + 1.4f), spacing, align);
            using var brush = new SolidBrush(ForeColor);
            TitleScene.DrawSpaced(g, Text, font, brush, at, spacing, align);
        }
        finally { if (!ReferenceEquals(font, Font)) font.Dispose(); }
    }

    /// <summary>The largest size of this face that still fits the width, down to a floor.</summary>
    private Font Fitted(Graphics g)
    {
        try
        {
            var points = Font.SizeInPoints;
            for (var attempt = 0; attempt < 22; attempt++)
            {
                using var candidate = new Font(Font.FontFamily, points, Font.Style);
                var width = g.MeasureString(Text, candidate, PointF.Empty, StringFormat.GenericTypographic).Width;
                if (LetterSpacing > 0f) width += LetterSpacing * points * DeviceDpi / 72f / 10f * Math.Max(0, Text.Length - 1);
                var tall = candidate.GetHeight(g);
                // A short window squeezes the masthead's row as well as its width, and a line of
                // text taller than the row it is in spills over the rule beneath it.
                if (tall > Height && Height > 4) points *= Math.Max(0.80f, Height / tall);
                else if (width <= Width * 0.97f || points <= 7f) break;
                else points *= Math.Max(0.86f, Math.Min(0.98f, Width * 0.97f / Math.Max(1f, width)));
            }
            return new Font(Font.FontFamily, Math.Max(7f, points), Font.Style);
        }
        catch { return Font; }
    }

    /// <summary>What this label needs to show all of its text at the given width.</summary>
    public int PreferredHeightFor(int width)
    {
        try
        {
            using var g = CreateGraphics();
            return (int)Math.Ceiling(Scene.MeasureHeight(g, Text, Font, width));
        }
        catch { return Height; }
    }
}

/// <summary>Is it on? A lamp and a sentence, the way the mockup asks for it.</summary>
internal sealed class SceneStatus : SceneLabel
{
    public Color Lamp { get; set; } = Palette.LampStopped;

    protected override void PaintContent(Graphics g)
    {
        var size = Math.Max(6f, Height * 0.40f);
        using var format = new StringFormat(StringFormatFlags.NoWrap) { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
        var textWidth = g.MeasureString(Text, Font, Width, format).Width;
        var gap = size * 0.62f;
        var left = (Width - (textWidth + size + gap)) / 2f;
        var cy = Height / 2f;

        var mode = g.SmoothingMode;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        try
        {
            // A soft halo, so a small green dot still reads on a busy painting.
            using (var halo = new SolidBrush(Color.FromArgb(60, Lamp)))
                g.FillEllipse(halo, left - size * 0.34f, cy - size * 0.84f, size * 1.68f, size * 1.68f);
            using (var brush = new SolidBrush(Lamp))
                g.FillEllipse(brush, left, cy - size / 2f, size, size);
            using (var rim = new Pen(Color.FromArgb(150, Palette.Ink), Math.Max(1f, size * 0.10f)))
                g.DrawEllipse(rim, left, cy - size / 2f, size, size);
        }
        finally { g.SmoothingMode = mode; }

        var box = new RectangleF(left + size + gap, 0, Math.Max(8f, Width - (left + size + gap)), Height);
        Scene.Shadowed(g, Text, Font, ForeColor, box, StringAlignment.Near, false);
    }
}

/// <summary>A gold rule with a star set in the middle of it, as the mockup has under the masthead.</summary>
internal sealed class SceneRule : Control
{
    public bool Heavy { get; set; }

    public SceneRule()
    {
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer, true);
        TabStop = false;
    }

    protected override void OnPaintBackground(PaintEventArgs e) => Scene.Backdrop(this, e.Graphics);

    protected override void OnPaint(PaintEventArgs e)
    {
        try { PaintRule(e.Graphics); } catch { /* see SceneLabel.OnPaint */ }
    }

    private void PaintRule(Graphics g)
    {
        Scene.Backdrop(this, g);
        var star = Math.Max(5f, Height * (Heavy ? 0.80f : 0.62f));
        var cy = Height / 2f;
        var thickness = Heavy ? Math.Max(1.4f, Height * 0.085f) : Math.Max(1f, Height * 0.055f);
        var gap = star * 1.15f;
        var mode = g.SmoothingMode;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        try
        {
            foreach (var (from, to) in new[]
                     {
                         (Width * 0.06f, Width / 2f - gap),
                         (Width / 2f + gap, Width * 0.94f),
                     })
            {
                if (to - from < 4f) continue;
                var box = new RectangleF(from, cy - thickness, to - from, thickness * 2f);
                // Fades out at the far ends, so the rule sits on the painting instead of cutting it.
                using var brush = new LinearGradientBrush(box,
                    Color.FromArgb(0, Palette.Gold), Color.FromArgb(0, Palette.Gold), LinearGradientMode.Horizontal)
                {
                    InterpolationColors = new ColorBlend
                    {
                        Colors = new[] { Color.FromArgb(0, Palette.Gold), Palette.GoldBright, Palette.GoldBright, Color.FromArgb(0, Palette.Gold) },
                        Positions = new[] { 0f, 0.22f, 0.78f, 1f },
                    },
                };
                g.FillRectangle(brush, from, cy - thickness / 2f, to - from, thickness);
            }
            TitleScene.DrawStar(g, new RectangleF(Width / 2f - star / 2f, cy - star / 2f, star, star), Palette.GoldBright);
        }
        finally { g.SmoothingMode = mode; }
    }
}

/// <summary>The uninstall link, on the painting rather than on a grey strip.</summary>
internal sealed class SceneLink : LinkLabel
{
    public SceneLink()
    {
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.SupportsTransparentBackColor, true);
        AutoSize = false;
        BackColor = Color.Transparent;
    }

    protected override void OnPaintBackground(PaintEventArgs e) => Scene.Backdrop(this, e.Graphics);
}

/// <summary>
/// One of the owner's cast plates, or - when there is no plate for what the button says - one
/// drawn in the same shape.
/// </summary>
/// <remarks>
/// It stays a <see cref="Button"/> and not a control of its own on purpose. A Button is already
/// in the tab order, already answers to Space and Enter, already carries its text into the
/// accessibility tree, and already knows how to be a form's default button. All that is replaced
/// here is what it looks like.
///
/// <para>The plate's own label is part of the picture, so nothing is written over it; the
/// button's <c>Text</c> is still set, and is what the keyboard and the narrator use.</para>
///
/// <para><b>Hover, pressed, and not yet usable.</b> Hover lifts the plate with a warm glaze,
/// pressed darkens it and moves it a pixel down, and a plate a teacher cannot use yet is not
/// dimmed - it is not on the window at all (owner, 2026-09-20). The disabled glaze below is
/// therefore only ever seen in the moment between a press and the work finishing, when the plates
/// on screen stay where they are and stop answering, so the window does not jump under a hand
/// that is still moving.</para>
/// </remarks>
internal sealed class PlateButton : Button
{
    /// <summary>The plate to draw, by its file name in <c>launcher/art</c>; null draws one instead.</summary>
    public string? Plate { get; set; }

    /// <summary>The colour of a drawn plate, used only when <see cref="Plate"/> has no art behind it.</summary>
    public Color Accent { get; set; } = Palette.ButtonFill;

    /// <summary>The mark on a drawn plate. A plate from the art already has its own.</summary>
    public Glyph Mark { get; set; } = Glyph.None;

    private bool _hot;
    private bool _down;

    public PlateButton()
    {
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.SupportsTransparentBackColor, true);
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        BackColor = Color.Transparent;
        ForeColor = Palette.Cream;
        UseVisualStyleBackColor = false;
    }

    protected override void OnMouseEnter(EventArgs e) { _hot = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { _hot = false; _down = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseDown(MouseEventArgs e) { _down = true; Invalidate(); base.OnMouseDown(e); }
    protected override void OnMouseUp(MouseEventArgs e) { _down = false; Invalidate(); base.OnMouseUp(e); }
    protected override void OnEnabledChanged(EventArgs e) { _hot = false; _down = false; Invalidate(); base.OnEnabledChanged(e); }
    protected override void OnPaintBackground(PaintEventArgs e) => Scene.Backdrop(this, e.Graphics);

    protected override void OnPaint(PaintEventArgs e)
    {
        try { PaintPlate(e.Graphics); } catch { /* see SceneLabel.OnPaint */ }
    }

    private void PaintPlate(Graphics g)
    {
        Scene.Backdrop(this, g);
        if (Width < 8 || Height < 8) return;

        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.PixelOffsetMode = PixelOffsetMode.HighQuality;

        var box = new RectangleF(0, _down ? 1f : 0f, Width, Height);
        var art = Plate is null ? null : PlateArt.For(Plate);
        if (art is not null) PaintArt(g, art, box);
        else PaintDrawn(g, box);

        if (Focused && ShowFocusCues) PaintFocus(g, box);
    }

    private void PaintArt(Graphics g, Image art, RectangleF box)
    {
        try { g.DrawImage(art, box); }
        catch { PaintDrawn(g, box); return; }

        // The glaze is the plate drawn a second time as one flat colour, keeping its own alpha,
        // so a chamfered corner or the stop sign's torn flag never lights up as a rectangle.
        // GDI+ has no source-atop compositing; a colour matrix is how the shape is borrowed.
        var glaze = Glaze();
        if (glaze.A == 0) return;
        try
        {
            using var attributes = new System.Drawing.Imaging.ImageAttributes();
            attributes.SetColorMatrix(new System.Drawing.Imaging.ColorMatrix(new[]
            {
                new[] { 0f, 0f, 0f, 0f, 0f },
                new[] { 0f, 0f, 0f, 0f, 0f },
                new[] { 0f, 0f, 0f, 0f, 0f },
                new[] { 0f, 0f, 0f, glaze.A / 255f, 0f },
                new[] { glaze.R / 255f, glaze.G / 255f, glaze.B / 255f, 0f, 1f },
            }));
            g.DrawImage(art,
                new[]
                {
                    new PointF(box.X, box.Y),
                    new PointF(box.Right, box.Y),
                    new PointF(box.X, box.Bottom),
                },
                new RectangleF(0, 0, art.Width, art.Height), GraphicsUnit.Pixel, attributes);
        }
        catch { /* the plate without its glaze still works */ }
    }

    private Color Glaze() =>
        !Enabled ? Color.FromArgb(150, 20, 22, 20)
        : _down ? Color.FromArgb(70, 0, 0, 0)
        : _hot ? Color.FromArgb(46, 255, 236, 190)
        : Color.Empty;

    /// <summary>
    /// A plate drawn in the shape of the cast ones, for a button whose art is missing.
    /// </summary>
    /// <remarks>
    /// It is not a copy of the owner's plates and is not meant to be mistaken for one. Since the
    /// tenth plate arrived (2026-09-20) nothing on the window uses it: it exists so that a launcher
    /// whose art cannot be read is a plain, working window rather than a crash or a row of empty
    /// rectangles.
    ///
    /// <para>ceiling: one shape, one colour and a stroke mark, for every button that needs it. It
    /// would only be worth more if the window ever shipped a button with no plate of its own.</para>
    /// </remarks>
    private void PaintDrawn(Graphics g, RectangleF box)
    {
        var chamfer = Math.Min(box.Height * 0.26f, box.Width * 0.035f);
        using var outer = Chamfered(box, chamfer);
        using (var frame = new LinearGradientBrush(box, Palette.GoldBright, Palette.GoldDim, 90f))
            g.FillPath(frame, outer);

        var innerBox = RectangleF.Inflate(box, -Math.Max(2f, box.Height * 0.075f), -Math.Max(2f, box.Height * 0.075f));
        if (innerBox.Width <= 2 || innerBox.Height <= 2) return;
        using var inner = Chamfered(innerBox, chamfer * 0.7f);
        using (var fill = new LinearGradientBrush(innerBox,
                   ControlPaint.Light(Accent, 0.12f), ControlPaint.Dark(Accent, 0.18f), 90f))
            g.FillPath(fill, inner);
        using (var edge = new Pen(Color.FromArgb(170, Palette.GoldBright), Math.Max(1f, box.Height * 0.022f)))
            g.DrawPath(edge, inner);

        var pad = box.Height * 0.20f;
        var mark = box.Height * 0.46f;
        if (Mark != Glyph.None)
            TitleScene.DrawGlyph(g, Mark, new RectangleF(box.X + pad, box.Y + (box.Height - mark) / 2f, mark, mark), Palette.Cream);

        var chevron = box.Height * 0.26f;
        using (var pen = new Pen(Palette.Cream, Math.Max(1.4f, box.Height * 0.055f)) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round })
        {
            var cx = box.Right - pad - chevron * 0.5f;
            var cy = box.Y + box.Height / 2f;
            g.DrawLines(pen, new[]
            {
                new PointF(cx - chevron * 0.28f, cy - chevron * 0.52f),
                new PointF(cx + chevron * 0.30f, cy),
                new PointF(cx - chevron * 0.28f, cy + chevron * 0.52f),
            });
        }

        var textBox = new RectangleF(box.X + pad * 2f + mark, box.Y, Math.Max(10f, box.Width - (pad * 3f + mark + chevron)), box.Height);
        // The cast plates have their words set into them at a size that fits; a drawn one has to
        // find that size itself, or "Update to v2026.09.20.1" comes out as "Update to v2026…".
        using var font = Fitting(g, Text, box.Height * 0.30f, textBox.Width);
        Scene.Shadowed(g, Text, font, Palette.Cream, textBox, StringAlignment.Center, false);

        var glaze = Glaze();
        if (glaze.A == 0) return;
        using var wash = new SolidBrush(glaze);
        g.FillPath(wash, outer);
    }

    /// <summary>The display face at the largest size whose line fits the room it has.</summary>
    private static Font Fitting(Graphics g, string text, float points, float width)
    {
        points = Math.Max(7f, points);
        // Measured with the same StringFormat the text is drawn with. GenericTypographic measures
        // a good deal tighter than the default, and a line measured one way and drawn the other
        // comes out as "Update to v2026.09.2..." on a button that had room for all of it.
        using var format = new StringFormat(StringFormatFlags.NoWrap);
        for (var attempt = 0; attempt < 12 && points > 7f; attempt++)
        {
            using var candidate = Faces.Make(Faces.Display, points, FontStyle.Bold);
            var measured = g.MeasureString(text, candidate, new SizeF(4096f, 4096f), format).Width;
            if (measured <= width * 0.94f) break;
            points *= Math.Max(0.82f, width * 0.94f / Math.Max(1f, measured));
        }
        return Faces.Make(Faces.Display, Math.Max(7f, points), FontStyle.Bold);
    }

    private void PaintFocus(Graphics g, RectangleF box)
    {
        var ring = RectangleF.Inflate(box, -Math.Max(2f, box.Height * 0.06f), -Math.Max(2f, box.Height * 0.06f));
        if (ring.Width <= 2 || ring.Height <= 2) return;
        using var path = Chamfered(ring, Math.Min(ring.Height * 0.26f, ring.Width * 0.035f));
        using var pen = new Pen(Color.FromArgb(235, Palette.GoldBright), Math.Max(1.5f, box.Height * 0.035f))
        {
            DashStyle = DashStyle.Dot,
        };
        g.DrawPath(pen, path);
    }

    /// <summary>The plates' outline: a rectangle with its four corners cut, as the art has them.</summary>
    private static GraphicsPath Chamfered(RectangleF box, float cut)
    {
        var path = new GraphicsPath();
        cut = Math.Max(0f, Math.Min(cut, Math.Min(box.Width, box.Height) / 2f - 1f));
        if (cut <= 0.5f) { path.AddRectangle(box); return path; }
        path.AddPolygon(new[]
        {
            new PointF(box.X + cut, box.Y),
            new PointF(box.Right - cut, box.Y),
            new PointF(box.Right, box.Y + cut),
            new PointF(box.Right, box.Bottom - cut),
            new PointF(box.Right - cut, box.Bottom),
            new PointF(box.X + cut, box.Bottom),
            new PointF(box.X, box.Bottom - cut),
            new PointF(box.X, box.Y + cut),
        });
        return path;
    }
}
