Option Explicit
' Stops the Read Aloud program (only it: the node.exe running read-aloud\server.mjs, never the game's).
Dim proc, found
found = 0
For Each proc In GetObject("winmgmts:\\.\root\cimv2").ExecQuery("SELECT * FROM Win32_Process WHERE Name = 'node.exe'")
  If Not IsNull(proc.CommandLine) Then
    If InStr(1, proc.CommandLine, "read-aloud\server.mjs", vbTextCompare) > 0 Then proc.Terminate : found = found + 1
  End If
Next
If found = 0 Then MsgBox "Read Aloud was not running.", vbInformation, "Read Aloud" Else MsgBox "Read Aloud has stopped.", vbInformation, "Read Aloud"
