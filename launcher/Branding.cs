using System.Drawing;
using System.Reflection;

namespace TexasRevolution.Launcher;

/// <summary>
/// The emblem, on every window that has a title bar - and beside the installed program,
/// so its shortcuts can wear it too.
/// </summary>
/// <remarks>
/// This used to read the icon back out of the running executable, which was right while
/// there was only one icon. There are now two: the executable carries the setup emblem,
/// because the file a teacher downloads should look like a setup file, and the installed
/// program carries the plain emblem. So the plain one travels as an embedded resource and
/// is put where it is needed rather than extracted from whatever happens to be running.
/// </remarks>
public static class Branding
{
    /// <summary>The name the installed emblem is written under, beside the executable.</summary>
    public const string EmblemFileName = "TexasRevolution.ico";

    private const string Resource = "TexasRevolution.Launcher.emblem.ico";

    private static readonly Lazy<Icon?> Emblem = new(() =>
    {
        try
        {
            using var stream = typeof(Branding).Assembly.GetManifestResourceStream(Resource);
            if (stream is not null) return new Icon(stream);
        }
        catch { /* fall through to whatever the executable carries */ }
        try { return Environment.ProcessPath is { } exe ? Icon.ExtractAssociatedIcon(exe) : null; }
        catch { return null; }
    });

    /// <summary>Put the emblem on a window, quietly doing nothing if it cannot be read.</summary>
    public static void Apply(Form form)
    {
        if (Emblem.Value is { } icon) form.Icon = icon;
    }

    private const string PaintingResource = "TexasRevolution.Launcher.art.background.png";

    private static readonly Lazy<Image?> TitlePainting = new(() =>
    {
        try
        {
            using var stream = typeof(Branding).Assembly.GetManifestResourceStream(PaintingResource);
            if (stream is null) return null;
            // Copied off the resource stream first: Image keeps the stream it was made from, and a
            // manifest stream that is disposed under it turns every later draw into an exception.
            using var memory = new MemoryStream();
            stream.CopyTo(memory);
            memory.Position = 0;
            return Image.FromStream(memory, useEmbeddedColorManagement: false, validateImageData: false) is { } image
                ? new Bitmap(image)
                : null;
        }
        catch { return null; }
    });

    /// <summary>
    /// The launcher's title painting - the owner's own, supplied 2026-09-20 - or null if it
    /// cannot be read, in which case the window paints itself in plain colour instead.
    /// </summary>
    public static Image? Painting
    {
        get { try { return TitlePainting.Value; } catch { return null; } }
    }

    /// <summary>
    /// Write the plain emblem beside an installed copy and return its path, or null if it
    /// could not be written. A shortcut pointing at a missing icon file shows a blank
    /// page, so every caller falls back to the executable's own icon instead.
    /// </summary>
    public static string? WriteEmblemTo(string folder)
    {
        try
        {
            using var stream = typeof(Branding).Assembly.GetManifestResourceStream(Resource);
            if (stream is null) return null;
            var path = Path.Combine(folder, EmblemFileName);
            using var file = File.Create(path);
            stream.CopyTo(file);
            return path;
        }
        catch { return null; }
    }
}
