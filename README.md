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
   Example AutoHotkey v2 script (previous/next page on Ctrl+Alt+Z / Ctrl+Alt+X):

   ```ahk
   SendPageCmd(direction) {
       surfaceId := "streamdeck:A1B2C3D4E5"  ; replace with your surface id
       cmd := "SURFACE " . surfaceId . " " . direction . "`n"
       psCmd := "$c=New-Object System.Net.Sockets.TcpClient('127.0.0.1',16759);"
           . "$s=$c.GetStream();"
           . "$d=[System.Text.Encoding]::ASCII.GetBytes('" . cmd . "');"
           . "$s.Write($d,0,$d.Length);"
           . "$s.Close();$c.Close()"
       RunWait('powershell -NoProfile -WindowStyle Hidden -Command "' . psCmd . '"', , "Hide")
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
- Each hotkey press spawns a short-lived PowerShell process to open the TCP
  socket, so there's a small (sub-second) delay - acceptable for manual page
  switching, but not for anything latency-sensitive.
