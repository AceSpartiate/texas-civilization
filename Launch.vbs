Option Explicit

Dim shell, files, root, scriptPath, command, result, unblock, quoted
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(WScript.ScriptFullName)
scriptPath = files.BuildPath(root, "scripts\launch.ps1")

If Not files.FileExists(scriptPath) Then
  MsgBox "The launcher files are incomplete. Keep Launch.vbs beside the scripts folder, then try again.", vbCritical, "Texas Revolution"
  WScript.Quit 1
End If

' Take the Mark of the Web off our own folder first.
'
' A zip downloaded through a browser leaves every file it unpacks marked as having come
' from the Internet, and RemoteSigned below then refuses to load an unsigned script that
' carries that mark. PowerShell exits before writing anything, so the teacher gets a
' failure with no error file and no way to tell why. This is the same thing as ticking
' "Unblock" on the zip by hand, done for them, on this folder only, and it fails quietly
' if it cannot: a copy that was never downloaded has no mark to remove.
'
' Bypass is deliberate and is scoped to this one inline command rather than to the
' launcher: an enforced school policy overrides it, exactly as it overrides RemoteSigned.
quoted = Replace(root, "'", "''")
unblock = "powershell.exe -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass" & _
  " -Command ""Get-ChildItem -LiteralPath '" & quoted & "' -Recurse -File -ErrorAction SilentlyContinue |" & _
  " Unblock-File -ErrorAction SilentlyContinue"""
On Error Resume Next
shell.Run unblock, 0, True
On Error GoTo 0

' RemoteSigned applies only to this child process; enforced school policy still wins.
' The child writes a readable error file; VBS supplies a fallback if PowerShell is blocked.
command = "powershell.exe -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy RemoteSigned -File """ & scriptPath & """ -NoDialog"
On Error Resume Next
result = shell.Run(command, 0, True)
If Err.Number <> 0 Then
  MsgBox "Windows could not start the classroom launcher. Ask your school IT team whether this application is permitted. No firewall or system settings were changed.", vbCritical, "Texas Revolution"
  WScript.Quit 1
End If
On Error GoTo 0

If result <> 0 Then
  MsgBox "The classroom did not open. Details, when available, are in:" & vbCrLf & files.BuildPath(root, "data\launcher-error.txt") & vbCrLf & "or, if this folder is read-only, in:" & vbCrLf & shell.ExpandEnvironmentStrings("%LOCALAPPDATA%\TexasRevolution\data\launcher-error.txt") & vbCrLf & vbCrLf & "If there is no new error file, Windows blocked PowerShell before it could write one. Right-click this folder's original .zip, tick Unblock on the General tab, and unpack it again. If it still will not open, share this folder with your school IT team.", vbCritical, "Texas Revolution"
End If
WScript.Quit result
