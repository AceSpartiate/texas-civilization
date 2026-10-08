READ ALOUD
==========

Reads aloud anything you type, teaching phrases, jokes and stories at a click, or a long pasted story, in natural
computer voices made on this computer. Nothing is sent over the Internet; it needs no Internet at all.

INSTALL
  1. Unzip this folder anywhere: Documents, the Desktop, or one shared folder for everybody
     (Program Files or a network drive is fine; Read Aloud writes nothing inside its own folder).
  2. Double-click "Add desktop shortcut.vbs" if you want a desktop icon.

USE
  Double-click "Read Aloud.vbs" (or the desktop shortcut). Your browser opens Read Aloud.
  The first time each phrase is spoken takes a second or two; after that it is instant.

  - Click a phrase to hear it, or type in the bar at the bottom and press Speak (or Enter).
  - Voice: Heart, Kore, Puck and Fenrir are the Texas Revolution game's voices; "More voices" has 24 more.
  - Auto voice: reads a line in a woman's or a man's voice when the words say who is speaking
    ("said Mom", "Dad: ...", "I am a mother"). Anything else is read in the voice you chose.
  - Story mode: hides the phrases for a long story. Click inside a sentence to start reading from there.

STOP
  Closing the browser leaves Read Aloud ready in the background. Double-click "Stop Read Aloud.vbs" to stop it.

MANY TEACHERS
  Every teacher's Read Aloud runs on their own computer and is heard only there: nothing goes between
  computers. Two people signed in to one computer at once each get their own (their own address, settings
  and sentences), and "Stop Read Aloud.vbs" stops only your own. Each person's spoken sentences are kept in
  %LOCALAPPDATA%Read Aloudspoken (trimmed back to 400 MB if they ever pass 600 MB).

IF WINDOWS ASKS
  If Windows warns about running a file downloaded from the Internet, right-click the zip, choose
  Properties, tick "Unblock", OK, and unzip again.

NEEDS
  Windows 10 or 11, 64-bit. About 500 MB of disk, and about 1.2 GB of memory while it runs.

WHAT IT IS MADE OF
  read-aloud\voice-worker\
                         keeps the voice loaded so it answers quickly: sherpa-onnx for Node (Apache-2.0,
                         k2-fsa), which has the same GPL-3.0 espeak-ng inside; worker.mjs is GPL-3.0 too
  runtime\node.exe       Node.js (MIT, runtime\LICENSE)
  runtime\voice\         Kokoro-82M voices and sherpa-onnx; see runtime\voice\LICENSES\README.txt for every
                         part, its licence, and the source of the GPL-3.0 program inside it.
