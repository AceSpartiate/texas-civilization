using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

namespace TexasRevolution.Launcher;

/// <summary>
/// The owner's button plates: cast gold frames with the label and the mark already in them.
/// </summary>
/// <remarks>
/// Each plate arrived as a large picture of a sign lying on a black field
/// (<c>launcher/art/button-*.png</c>, supplied 2026-09-20). Three things have to happen before one
/// can be drawn on a window, and they happen once, the first time the plate is asked for:
///
/// <list type="number">
/// <item><b>Trimmed to the sign.</b> The black field is not part of the art. The seven straight
/// plates were measured and all eight sit within a pixel or two of the same box, so the box is a
/// constant rather than something computed per plate at every start-up.</item>
/// <item><b>Resampled once</b> to a master sixteen hundred pixels wide - more than the widest
/// plate this window will ever draw, on the largest screen at the highest scaling - and the
/// two-megabyte original is let go. Scaling two megabytes of pixels on every repaint is what
/// makes a window feel slow.</item>
/// <item><b>Keyed from the border.</b> The sign's corners are chamfered and the stop sign has a
/// torn flag hanging off it, so a rectangle cut round either one carries black in the corners.
/// The black is flooded from the edge of the picture inwards, which takes the field away and
/// leaves anything dark that is actually inside the sign alone. Flooding rather than keying every
/// dark pixel is the difference between a clean edge and a sign full of holes.</item>
/// </list>
///
/// <para><b>The labels are in the art</b>, so the button draws no text of its own over a plate.
/// The name of the file is the label, and <see cref="LauncherForm"/> keeps its <c>Text</c> in step
/// with it so the keyboard, the narrator and the accessibility tree still have the words.</para>
///
/// <para>ceiling: one master per plate at a fixed width, and every button scales from it at paint
/// time. Eight masters is about seventeen megabytes of memory, held for the life of the window,
/// and no measurable paint cost at this size. If plates are ever wanted much larger, cache a
/// scaled copy per drawn size instead of raising this.</para>
/// </remarks>
internal static class PlateArt
{
    public const string Stop = "button-stop-the-class";

    public const string UpdateAvailable = "button-update-available";

    /// <summary>
    /// Where the sign sits inside its picture, and how dark its field is.
    /// </summary>
    /// <param name="Box">The part of the delivered file that is the sign. Measured, not guessed.</param>
    /// <param name="FloodBelow">
    /// Luminance below which a pixel reachable from the edge is field and is taken away; zero for a
    /// picture that came with an alpha channel and needs nothing done to it.
    /// </param>
    private sealed record Cut(Rectangle Box, int FloodBelow);

    /// <summary>The seven straight plates: 2172 x 724, the sign in the middle, on dark stone.</summary>
    private static readonly Cut Straight = new(new Rectangle(136, 161, 1902, 348), 30);

    private static readonly Dictionary<string, Cut> Cuts = new(StringComparer.Ordinal)
    {
        // A red sign with a torn Lone Star flag over its left end, on pure black: 1774 x 887.
        [Stop] = new Cut(new Rectangle(30, 96, 1715, 674), 13),
        // The only one of the ten delivered with real transparency (1536 x 1024, RGBA). It needs no
        // key at all: it is cut to what its own alpha covers - the badge, the overhanging roundel,
        // the exclamation mark above it and the warm glow round the lot - and composited as it is.
        [UpdateAvailable] = new Cut(new Rectangle(10, 228, 1513, 515), 0),
    };

    private static Cut CutFor(string name) => Cuts.TryGetValue(name, out var cut) ? cut : Straight;

    /// <summary>Width of the drawn shape over its height, for the layout to keep.</summary>
    public static float AspectOf(string name)
    {
        var box = CutFor(name).Box;
        return (float)box.Width / box.Height;
    }

    private const int MasterWidth = 1600;

    private static readonly Dictionary<string, Image?> Loaded = new(StringComparer.Ordinal);

    /// <summary>The plate, or null if it cannot be read - in which case the button draws itself.</summary>
    public static Image? For(string name)
    {
        lock (Loaded)
        {
            if (Loaded.TryGetValue(name, out var cached)) return cached;
            Image? plate = null;
            try { plate = Load(name); } catch { plate = null; }
            Loaded[name] = plate;
            return plate;
        }
    }

    private static Image? Load(string name)
    {
        using var stream = typeof(PlateArt).Assembly.GetManifestResourceStream($"TexasRevolution.Launcher.art.{name}.png");
        if (stream is null) return null;
        using var memory = new MemoryStream();
        stream.CopyTo(memory);
        memory.Position = 0;
        using var source = new Bitmap(memory);

        var cut = CutFor(name);
        var box = Rectangle.Intersect(cut.Box, new Rectangle(0, 0, source.Width, source.Height));
        // A plate that is not the size it was measured at is a plate somebody replaced. Rather
        // than cut it in the wrong place, take the whole picture and let the border key sort it.
        if (box.Width < 32 || box.Height < 16) box = new Rectangle(0, 0, source.Width, source.Height);

        var height = Math.Max(8, (int)Math.Round(MasterWidth * (double)box.Height / box.Width));
        var master = new Bitmap(MasterWidth, height, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(master))
        {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingMode = CompositingMode.SourceCopy;
            g.DrawImage(source, new Rectangle(0, 0, MasterWidth, height), box, GraphicsUnit.Pixel);
        }
        // How dark the field is, which is not the same picture to picture and had to be measured.
        // The seven straight plates lie on textured dark stone (luminance 22-29) that is no
        // brighter than their own darkest interior (13-30), so the flood is held to the near-black
        // that only appears in the four chamfered corners. The stop sign lies on pure black (0)
        // while its darkest weathered red is 19, so it is flooded harder - and must be, because
        // its outline is a torn flag. Flooding the stop sign at the straight plates' threshold was
        // tried first and washed the whole red field half-transparent.
        // The update badge came with an alpha channel and is left alone.
        if (cut.FloodBelow > 0)
            try { KeyFromBorder(master, cut.FloodBelow); } catch { /* an unkeyed plate is still a plate */ }
        return master;
    }

    /// <summary>
    /// Take the black field away, from the outside in.
    /// </summary>
    /// <remarks>
    /// Every dark pixel reachable from the edge of the picture without crossing the sign becomes
    /// transparent; a dark patch inside the sign is never reached and is left alone. The edge is
    /// then softened by one pixel, because a hard cut through a bicubic ramp leaves a black hem
    /// round the gold.
    /// </remarks>
    private static void KeyFromBorder(Bitmap master, int dark)
    {
        var Dark = dark;                       // below this, and reachable from the edge, is field
        var Fringe = Math.Max(Dark + 4, Dark * 9 / 5); // above this a kept pixel is left opaque

        var w = master.Width;
        var h = master.Height;
        var rect = new Rectangle(0, 0, w, h);
        var data = master.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            var bytes = new byte[data.Stride * h];
            System.Runtime.InteropServices.Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);

            var clear = new bool[w * h];
            var stack = new Stack<int>(w * 4);
            void Consider(int x, int y)
            {
                if (x < 0 || y < 0 || x >= w || y >= h) return;
                var cell = y * w + x;
                if (clear[cell]) return;
                var i = y * data.Stride + x * 4;
                var lum = (byte)((bytes[i + 2] * 77 + bytes[i + 1] * 150 + bytes[i] * 29) >> 8);
                if (lum >= Dark) return;
                clear[cell] = true;
                stack.Push(cell);
            }

            for (var x = 0; x < w; x++) { Consider(x, 0); Consider(x, h - 1); }
            for (var y = 0; y < h; y++) { Consider(0, y); Consider(w - 1, y); }
            while (stack.Count > 0)
            {
                var cell = stack.Pop();
                var x = cell % w;
                var y = cell / w;
                Consider(x - 1, y); Consider(x + 1, y); Consider(x, y - 1); Consider(x, y + 1);
            }

            for (var y = 0; y < h; y++)
                for (var x = 0; x < w; x++)
                {
                    var i = y * data.Stride + x * 4;
                    if (clear[y * w + x]) { bytes[i] = bytes[i + 1] = bytes[i + 2] = bytes[i + 3] = 0; continue; }
                    // One pixel of hem: a kept pixel beside a cleared one fades out with its own darkness.
                    var beside = (x > 0 && clear[y * w + x - 1]) || (x + 1 < w && clear[y * w + x + 1])
                                 || (y > 0 && clear[(y - 1) * w + x]) || (y + 1 < h && clear[(y + 1) * w + x]);
                    if (!beside) continue;
                    var lum = (bytes[i + 2] * 77 + bytes[i + 1] * 150 + bytes[i] * 29) >> 8;
                    if (lum >= Fringe) continue;
                    // Format32bppArgb is not premultiplied, so the colour is left as it is.
                    bytes[i + 3] = (byte)Math.Clamp(lum * 255 / Fringe, 0, 255);
                }

            System.Runtime.InteropServices.Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
        }
        finally { master.UnlockBits(data); }
    }
}
