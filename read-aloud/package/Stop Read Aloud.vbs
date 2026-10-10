Option Explicit
' Stops your Read Aloud (only it: the node.exe processes running from its read-aloud folder - the program and its
' voice helpers - and only your own, never another person's signed in to this computer, never the game's).
Dim proc, found, self, owner, domain
found = 0
self = LCase(CreateObject("WScript.Network").UserName)
' The voice helpers end themselves when the program ends, so one may be gone by the time it is reached.
On Error Resume Next
For Each proc In GetObject("winmgmts:\\.\root\cimv2").ExecQuery("SELECT * FROM Win32_Process WHERE Name = 'node.exe'")
  If Not IsNull(proc.CommandLine) Then
    If InStr(1, proc.CommandLine, "\read-aloud\", vbTextCompare) > 0 Then
      owner = "" : proc.GetOwner owner, domain
      If LCase(owner) = self Then proc.Terminate : found = found + 1
    End If
  End If
Next
If found = 0 Then MsgBox "Read Aloud was not running.", vbInformation, "Read Aloud" Else MsgBox "Read Aloud has stopped.", vbInformation, "Read Aloud"
