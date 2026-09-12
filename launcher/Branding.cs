using System.Drawing;

namespace TexasRevolution.Launcher;

/// <summary>
/// The emblem, on every window that has a title bar.
/// </summary>
/// <remarks>
/// `ApplicationIcon` in the project file puts the icon on the executable, which is what
/// Explorer, the taskbar, the Start menu and the desktop shortcut all read. It does not
/// reach a WinForms title bar, which falls back to a generic icon unless it is told
/// otherwise - so this reads the icon back out of the running executable rather than
/// carrying a second copy of it as an embedded resource.
/// </remarks>
public static class Branding
{
    private static readonly Lazy<Icon?> Emblem = new(() =>
    {
        try { return Environment.ProcessPath is { } exe ? Icon.ExtractAssociatedIcon(exe) : null; }
        catch { return null; }
    });

    /// <summary>Put the emblem on a window, quietly doing nothing if it cannot be read.</summary>
    public static void Apply(Form form)
    {
        if (Emblem.Value is { } icon) form.Icon = icon;
    }
}
