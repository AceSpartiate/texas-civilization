Option Explicit
' Read Aloud: starts the small read-aloud program (read-aloud\server.mjs) with the game's own node.exe and
' opens it in the browser. Separate from the game; it uses only the game's downloaded voices in runtime\voice.

Dim shell, files, root, node, script, http
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
  shell.Run """" & node & """ """ & script & """", 0, False
  WScript.Sleep 1200
End If
On Error GoTo 0

shell.Run "http://127.0.0.1:1840/"
