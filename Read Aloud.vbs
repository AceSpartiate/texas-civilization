Option Explicit
' Read Aloud: starts the small read-aloud program (read-aloud\server.mjs) with the bundled node.exe and
' opens it in the browser. Separate from the game; it uses only the game's downloaded voices in runtime\voice.
'
' Every person has their own copy running, on their own port: two teachers signed in to one computer at once
' (or a shared lab machine) must not end up using each other's, which would stop when the other signs out. The
' port comes from the Windows user name, so it is the same every time and the page keeps its settings; if it is
' taken by somebody else, the next one is tried. A copy answers /config with whose it is.

Dim shell, files, root, node, script, http, quoted, user, port, i, h, answer, started
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(WScript.ScriptFullName)
node = files.BuildPath(root, "runtime\node.exe")
If Not files.FileExists(node) Then node = "node.exe"
script = files.BuildPath(root, "read-aloud\server.mjs")
user = CreateObject("WScript.Network").UserName

' 18400 to 18899, from the user name.
h = 0
For i = 1 To Len(user)
  h = (h * 31 + AscW(Mid(LCase(user), i, 1))) Mod 500
Next
port = 18400 + h

' Asks a port whose copy it is: "" if nobody answers, the owner's name otherwise.
Function Owner(p)
  Owner = ""
  On Error Resume Next
  Set http = CreateObject("MSXML2.XMLHTTP")
  http.Open "GET", "http://127.0.0.1:" & p & "/config", False
  http.Send
  If Err.Number = 0 Then
    If http.Status = 200 Then
      answer = http.responseText
      Owner = "?"
      Dim a, b
      a = InStr(answer, """user"":""")
      If a > 0 Then
        a = a + 8
        b = InStr(a, answer, """")
        If b > a Then Owner = Mid(answer, a, b - a)
      End If
    End If
  End If
  Err.Clear
End Function

started = False
For i = 0 To 9
  answer = Owner(port + i)
  If LCase(answer) = LCase(user) Then
    port = port + i
    started = True
    Exit For
  ElseIf answer = "" Then
    port = port + i
    Exit For
  End If
Next

If Not started Then
  ' A zip downloaded through a browser marks every file it unpacks as from the Internet, and Windows then asks
  ' before starting node.exe. Take the mark off this folder only (the same as ticking "Unblock" on the zip);
  ' it fails quietly where it cannot, as Launch.vbs does.
  On Error Resume Next
  quoted = Replace(root, "'", "''")
  shell.Run "powershell.exe -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass" & _
    " -Command ""Get-ChildItem -LiteralPath '" & quoted & "' -Recurse -File -ErrorAction SilentlyContinue |" & _
    " Unblock-File -ErrorAction SilentlyContinue""", 0, True
  Err.Clear
  shell.Environment("Process")("READ_ALOUD_PORT") = CStr(port)
  shell.Run """" & node & """ """ & script & """", 0, False
  On Error GoTo 0
  ' Wait until it answers (the voice itself loads in the background after this).
  For i = 1 To 40
    WScript.Sleep 250
    If LCase(Owner(port)) = LCase(user) Then Exit For
  Next
End If

shell.Run "http://127.0.0.1:" & port & "/"
