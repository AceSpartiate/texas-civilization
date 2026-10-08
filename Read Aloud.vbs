Option Explicit
' Read Aloud: starts the small read-aloud program (read-aloud\server.mjs) with the bundled node.exe and
' opens it in the browser. Separate from the game; it uses only the game's downloaded voices in runtime\voice.

Dim shell, files, root, node, script, http, quoted
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(WScript.ScriptFullName)
node = files.BuildPath(root, "runtime\node.exe")
If Not files.FileExists(node) Then node = "node.exe"
script = files.BuildPath(root, "read-aloud\server.mjs")

' Start the program unless it is already running.
On Error Resume Next
Set http = CreateObject("MSXML2.XMLHTTP")
http.Open "GET", "http://127.0.0.1:1840/config", False
http.Send
If Err.Number <> 0 Or http.Status <> 200 Then
  Err.Clear
  ' A zip downloaded through a browser marks every file it unpacks as from the Internet, and Windows then asks
  ' before starting node.exe. Take the mark off this folder only (the same as ticking "Unblock" on the zip);
  ' it fails quietly where it cannot, as Launch.vbs does.
  quoted = Replace(root, "'", "''")
  shell.Run "powershell.exe -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass" & _
    " -Command ""Get-ChildItem -LiteralPath '" & quoted & "' -Recurse -File -ErrorAction SilentlyContinue |" & _
    " Unblock-File -ErrorAction SilentlyContinue""", 0, True
  Err.Clear
  shell.Run """" & node & """ """ & script & """", 0, False
  WScript.Sleep 1500
End If
On Error GoTo 0

shell.Run "http://127.0.0.1:1840/"
