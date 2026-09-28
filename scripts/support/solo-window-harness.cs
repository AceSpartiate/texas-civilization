namespace TexasRevolution.Launcher;

// A development instrument for scripts/solo-window-close-proof.mjs, never shipped (scripts/package.ps1 copies three named
// scripts and nothing else). It opens the solo player's page in the launcher's own TeacherWindow - launcher/TeacherWindow.cs,
// compiled unchanged beside this file - as LauncherForm.PlaySoloAsync opens it ("Texas Revolution — Play Solo", developer
// tools on), under an application that stays running after the window closes, as the launcher's main window does.
//
// Usage: SoloWindowHarness <playUrl> <mode>
//   stay           - the window is closed from outside (its X); the application lives on for two minutes after.
//   exit-on-stdin  - a line "exit" on standard input ends the application with the window still open, as closing the
//                    launcher does.
// Either way "window closed <UTC time>" is written when the window closes.
static class Harness
{
    [STAThread]
    static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        var url = args[0];
        var mode = args.Length > 1 ? args[1] : "stay";
        var window = new TeacherWindow(url, "Texas Revolution — Play Solo", developer: true);
        window.FormClosed += (_, _) => { Console.WriteLine($"window closed {DateTime.UtcNow:o}"); Console.Out.Flush(); };
        var context = new ApplicationContext();
        window.Show();
        if (mode == "exit-on-stdin")
        {
            var ui = SynchronizationContext.Current!;
            new Thread(() =>
            {
                while (Console.In.ReadLine() is { } line) if (line.Trim() == "exit") { ui.Post(_ => Application.Exit(), null); return; }
            }) { IsBackground = true }.Start();
        }
        else
        {
            window.FormClosed += (_, _) =>
            {
                var linger = new System.Windows.Forms.Timer { Interval = 120000 };
                linger.Tick += (_, _) => context.ExitThread();
                linger.Start();
            };
        }
        Application.Run(context);
    }
}
