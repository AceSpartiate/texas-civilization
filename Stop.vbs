Option Explicit

Dim shell, files, root, scriptPath, command, result
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(WScript.ScriptFullName)
scriptPath = files.BuildPath(root, "scripts\stop.ps1")

If Not files.FileExists(scriptPath) Then
  MsgBox "The launcher files are incomplete. Keep Stop.vbs beside the scripts folder, then try again.", vbCritical, "Texas Revolution"
  WScript.Quit 1
End If

' The helper asks the running server to save, pause and close itself. It never
' terminates a process by force, because that can leave a save lock behind.
command = "powershell.exe -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy RemoteSigned -File """ & scriptPath & """"
On Error Resume Next
result = shell.Run(command, 0, True)
If Err.Number <> 0 Then
  MsgBox "Windows could not start the stop helper. Stop the server from the Host page instead, or ask your school IT team whether this application is permitted.", vbCritical, "Texas Revolution"
  WScript.Quit 1
End If
On Error GoTo 0
WScript.Quit result
