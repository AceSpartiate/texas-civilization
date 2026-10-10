Option Explicit
' Puts a "Read Aloud" shortcut on this computer's desktop that starts Read Aloud from this folder.
Dim shell, files, root, link
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(WScript.ScriptFullName)
Set link = shell.CreateShortcut(files.BuildPath(shell.SpecialFolders("Desktop"), "Read Aloud.lnk"))
link.TargetPath = files.BuildPath(shell.ExpandEnvironmentStrings("%SystemRoot%"), "System32\wscript.exe")
link.Arguments = """" & files.BuildPath(root, "Read Aloud.vbs") & """"
link.WorkingDirectory = root
link.IconLocation = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\System32\SndVol.exe,0"
link.Description = "Read Aloud: reads typed text, presets and stories aloud"
link.Save
MsgBox "A Read Aloud shortcut is on your desktop.", vbInformation, "Read Aloud"
