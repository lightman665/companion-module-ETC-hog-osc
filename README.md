# companion-module-ETC-hog-osc

Bitfocus Companion module for native OSC integration with High End Systems Hog
consoles (Hog OS 4/5), replacing the `generic-osc` + 36-trigger workaround
described in [HOG_OSC_SPEC.md](./HOG_OSC_SPEC.md).

## Status

Early scaffold. This first PR ships:

- UDP connection handling (config for console IP, send port, listen port)
- A minimal OSC message decoder (`s`/`f`/`i` type tags — the only ones the
  console emits)
- An internal `Map<path, value>` state dictionary, so bursts of 20+ messages
  in ~350ms don't race each other (§1)
- Variables for command keys `h1`-`h12`, with the +1 wire-offset bug (§5)
  resolved transparently

Playback masters, encoder wheels, named buttons, feedbacks, and actions are
not implemented yet — see `HOG_OSC_SPEC.md` §13 for the full requirements
list and follow-up PRs.

## Development

Targets `@companion-module/base` v2 (Companion 5.x).

```bash
npm install
npm run build
npm test
```

## Trying it in Companion

```bash
npm run package
```

This produces `etc-hog-osc-<version>.tgz`. In Companion, go to **Modules → Import
module package**, and select that file.

## Reference

All OSC paths and console quirks are documented, with evidence, in
[HOG_OSC_SPEC.md](./HOG_OSC_SPEC.md).

## Tip: switching Companion pages from a PC keyboard shortcut

If you're running Companion on the same machine you're operating from, you can
switch pages without spending a grid button on page navigation, by using
Companion's built-in TCP remote-control listener together with a global
hotkey tool (e.g. [AutoHotkey](https://www.autohotkey.com/) on Windows).

1. In Companion, go to **Settings → Protocols → TCP** and enable **TCP
   Listener**. Note the port shown there (defaults to `16759`, but always
   confirm it in your own instance — do not assume it hasn't changed).
2. Find your surface's ID under **Surfaces → (click your device)** — it's
   shown in the panel title, e.g. `streamdeck:A1B2C3D4E5`.
3. Companion accepts newline-terminated text commands on that TCP port:
   ```
   SURFACE <surface id> PAGE-SET <page number>
   SURFACE <surface id> PAGE-UP
   SURFACE <surface id> PAGE-DOWN
   ```
4. Bind a global hotkey to open a TCP connection and send one of the above.
   Example AutoHotkey v2 script (previous/next page on Ctrl+Alt+Z / Ctrl+Alt+X),
   using a raw Winsock call so each keypress doesn't spawn a subprocess:

   ```ahk
   COMPANION_HOST := "127.0.0.1"
   COMPANION_PORT := 16759
   SURFACE_ID := "streamdeck:A1B2C3D4E5"  ; replace with your surface id

   ; Minimal raw TCP send using Winsock (ws2_32.dll, built into Windows).
   SendTCP(host, port, text) {
       wsaData := Buffer(408, 0)
       DllCall("ws2_32\WSAStartup", "UShort", 0x0202, "Ptr", wsaData)

       sock := DllCall("ws2_32\socket", "Int", 2, "Int", 1, "Int", 6, "Ptr")

       sockaddr := Buffer(16, 0)
       NumPut("UShort", 2, sockaddr, 0)
       NumPut("UShort", DllCall("ws2_32\htons", "UShort", port, "UShort"), sockaddr, 2)
       NumPut("UInt", DllCall("ws2_32\inet_addr", "AStr", host, "UInt"), sockaddr, 4)

       if (DllCall("ws2_32\connect", "Ptr", sock, "Ptr", sockaddr, "Int", 16, "Int") = 0) {
           bytes := Buffer(StrPut(text, "CP0"))
           len := StrPut(text, bytes, "CP0") - 1
           DllCall("ws2_32\send", "Ptr", sock, "Ptr", bytes, "Int", len, "Int", 0, "Int")
       }
       DllCall("ws2_32\closesocket", "Ptr", sock)
       DllCall("ws2_32\WSACleanup")
   }

   SendPageCmd(direction) {
       global COMPANION_HOST, COMPANION_PORT, SURFACE_ID
       SendTCP(COMPANION_HOST, COMPANION_PORT, "SURFACE " . SURFACE_ID . " " . direction . "`n")
   }

   ^!z::SendPageCmd("PAGE-DOWN")  ; Ctrl+Alt+Z -> previous page
   ^!x::SendPageCmd("PAGE-UP")    ; Ctrl+Alt+X -> next page
   ```

**Gotchas found while setting this up:**
- The TCP Listener is **disabled by default** — the connection will be
  refused until you enable it.
- On some keyboard layouts, `Ctrl+Alt` acts as `AltGr` and typing a digit
  produces a symbol (e.g. `Ctrl+Alt+2` → `@`) instead of triggering the
  hotkey — avoid plain number keys for the shortcut on those layouts.
- `Ctrl+Alt+F1`-style function-key combos can conflict with unrelated
  Windows/driver-level window shortcuts (observed: changed the active
  window's icon view size) — letter keys tend to be safer.
- The Winsock version above sends the TCP packet directly with no subprocess,
  so it's near-instant. An earlier version of this tip used PowerShell's
  `System.Net.Sockets.TcpClient` instead, which also works but has a
  noticeable (sub-second) per-press delay from spawning a new process.
