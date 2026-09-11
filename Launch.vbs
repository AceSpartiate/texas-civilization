Option Explicit

Dim shell, files, root, scriptPath, command, result
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(WScript.ScriptFullName)
scriptPath = files.BuildPath(root, "scripts\launch.ps1")

If Not files.FileExists(scriptPath) Then
  MsgBox "The launcher files are incomplete. Keep Launch.vbs beside the scripts folder, then try again.", vbCritical, "Texas Revolution"
  WScript.Quit 1
End If

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
  MsgBox "The classroom did not open. Details, when available, are in:" & vbCrLf & files.BuildPath(root, "data\launcher-error.txt") & vbCrLf & "or, if this folder is read-only, in:" & vbCrLf & shell.ExpandEnvironmentStrings("%LOCALAPPDATA%\TexasRevolution\data\launcher-error.txt") & vbCrLf & vbCrLf & "If there is no new error file, Windows may have blocked PowerShell. Share this folder with your school IT team.", vbCritical, "Texas Revolution"
End If
WScript.Quit result
