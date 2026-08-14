# Hog OSC — Specification for the Bitfocus Companion module

Reference document with everything confirmed empirically by capturing OSC traffic
(Wireshark + Companion logs + Protokol) against a **Gig Hog** console running
**Hog OS 5.2.0 (build 212)**.

All behavior described here has been verified with packet-level evidence, not assumed
from the manual. Where the manual contradicts what was observed, it is flagged.

---

## 1. Purpose of the module

Replace the current workaround (`generic-osc` module + 36 triggers + custom variables),
which is **structurally unreliable**.

**Why:** `generic-osc` only exposes two shared, volatile variables
(`latest_received_path` and `latest_received_args`), overwritten by every incoming message.
Hog sends **bursts of 20+ messages in ~350 ms**, with 5–60 ms gaps between them.
There's no reliable way to capture each value in time — tested via events, a single
dispatcher, and 100 ms polling; all fail intermittently.

**Solution:** the module keeps an **internal dictionary** (`Map<path, value>`) updated on
every incoming message, and exposes **one Companion variable per path**. No shared state,
no race, immune to bursts.

---

## 2. Connection

| | |
|---|---|
| Transport | UDP (UDP only — see §7) |
| Console → Companion | Console sends from `172.31.0.1:7000` |
| Listen port | 7009 (configurable) |
| Companion → Console | Sends to `172.31.0.1:7000` |

The console uses the **same port (7000)** to send state and receive commands.

**Confirmed (2026-08-14): port 7001 itself doesn't work on the console,
regardless of which field it's assigned to.** The console's OSC settings
screen has separate In and Out port fields, defaulting to `In=7000` /
`Out=7001`. Testing showed 7001 fails whether it's put in the In field or
the Out field - it isn't that "Out" specifically is broken, it's that 7001
specifically doesn't work on this console. Since 7001 is the *default* value
of the Out field, most consoles will hit this out of the box without anyone
having deliberately chosen it. This module sidesteps the bug entirely by
using port 7000 for *everything* - both sending commands to the console and
receiving its status (see table above).

This is very likely the explanation behind a common complaint in the Hog/OSC
community: "the console randomly stopped sending OSC" - anyone who left the
console's OSC Out port on its own default (7001) was never going to get
anything out of it, regardless of what changed on the receiving end. Worth
checking first whenever OSC "stops working" on a console this module isn't
controlling.

---

## 3. Confirmed OSC paths (incoming — console → Companion)

### 3.1 Command keys (h-keys)

| Path | Type | Notes |
|---|---|---|
| `/hog/status/h<N>/line1` | string | Name of the assigned object |
| `/hog/status/h<N>/line2` | string | State (`on`, `on 1`, `....`, `Cue 1`, free text) |
| `/hog/status/led/h<N>` | float 0/1 | On/off state |
| `/hog/status/led/h<N>color` | string hex | **No slash before `color`** — see §6 |

> **Watch the offset** — see §5.

### 3.2 Named buttons (front panel)

All with the pair `<name>` (float 0/1) and `<name>color` (string hex):

```
blind, clear, highlight, macro, ratedisabled, dbo, thruster upper,
intensity, position, colour, beam, effects, time,
maingo, mainhalt, mainback,
play, pause, go back,
flash
```

Note: `colour` (British spelling) for the button; but the color suffix is always `color`
(American spelling). E.g.: `/hog/status/led/colourcolor`.

Note: `thruster upper` and `go back` contain a **space** in the path.

### 3.3 Playback masters

Confirmed from **0 to 35** (36 masters):

```
/hog/status/led/go/<M>          float 0/1   + /go/<M>color
/hog/status/led/pause/<M>       float 0/1   + /pause/<M>color
/hog/status/led/goback/<M>      float 0/1   + /goback/<M>color
/hog/status/led/flash/<M>       float 0/1   + /flash/<M>color
/hog/status/led/choose/<M>      float 0/1
```

> **Contradicts the manual.** Section 22.5.1 of the v5.2.0 manual states that Hog OS
> doesn't send playback activity over OSC. That's false — it does, and in detail.

### 3.4 Encoder wheels

```
/hog/status/encoderwheel<1-5>/label    string
/hog/status/encoderwheel<1-5>/value    string
```

E.g.: `label="Playback Rate"`, `value="100%"`; `label="Intensity"`, `value="Full"`.
Labels change depending on context (e.g. `Scroll Up/Down`, `Zoom`).

**Careful:** labels arrive **fragmented** — first truncated to 7 characters, then
complete. E.g.: `"Playbac"` followed by `"Playback Rate"`. The module should always
accept the latest value received.

### 3.5 System

```
/hog/system/time              string HH:MM:SS   heartbeat, ~1–2 s
/hog/status/commandline       string            real-time echo of the command line
/hog/status/led/flash         float 0/1         + flashcolor — blinks continuously
```

`commandline` reflects what's being typed, character by character
(e.g.: `"Scene 1"` → `"Scene 1 Move To"` → `"Scene 1 Record Command 1 "`).
Useful for showing the live command line on the Stream Deck.

---

## 4. Outgoing OSC paths (command — Companion → console)

```
/hog/hardware/h<N>       0 = up, 1 = down     command keys
/hog/hardware/pig        0/1                  Pig modifier
/hog/hardware/release    0/1
/hog/hardware/blind      0/1
/hog/hardware/highlight  0/1
/hog/hardware/clear      0/1
/hog/playback/release/0 <list>   releases a cuelist by list number
/hog/playback/release/1 <scene>
/hog/playback/release/2 <macro>
```

---

## 5. CONFIRMED BUG — +1 offset on command keys

**Physical key N ⟶ `h(N+1)` on all paths.**

| Physical key | OSC path |
|---|---|
| 1 | `h2` |
| 2 | `h3` |
| … | … |
| 12 | `h13` |

Applies both to **sending** (`/hog/hardware/h<N>`) and **receiving** (`/hog/status/h<N>/...`).

Contradicts the manual itself, whose example documents `/hog/status/h1/line1` for key 1.
Reported on the ETC forum ("BUG Report - OSC - Function Keys numbers are off by 1").

**The module must hide this:** the user picks "Command Key 5", the module internally
handles `h6`.

**Important exception:** in the full dump generated by log off + relaunch, the console
sends `h1`–`h12` **with no offset**. In other words, the real internal indexing is 1–12;
the offset appears to be a bug only in individual events.

---

## 6. Color path format

The color suffix is **concatenated to the name, with no slash**:

```
✅ /hog/status/led/h2color
✅ /hog/status/led/flashcolor
✅ /hog/status/led/go/1color
❌ /hog/status/led/h2/color
```

---

## 7. TCP is not viable

The console offers TCP with SLIP or HDR framing. Tested exhaustively against both
`generic-osc` TCP modes (TCP and TCP RAW): either it doesn't connect, or it connects and
dies within seconds.

**Use UDP only.**

---

## 8. When `line1` (name) is sent

`line1` is **not** transmitted continuously. It's only sent when the displayed name
changes:

| Action | Sends `line1`? |
|---|---|
| Rename (select object → `SET` → text → Enter) | ✅ |
| `[Object] Move To [key]` | ✅ |
| `[Object] Copy To [key]` | ✅ |
| `Delete Command <N>` | ✅ (empty string) |
| Copy within the directory (generates `"Copy of <name>"`) | ✅ |
| Firing the key (Go/Off) | ❌ |
| Changing the object's color | ❌ |
| Undo / Redo | ❌ |

On Hog, **all** assignment goes through command-line syntax
(`Move To`, `Copy To`, `Record To`, `Merge To`, `Update To`, `Delete To`) — there's no
drag-and-drop. So the normal workflow already keeps `line1` in sync.

**Consequence for the module:** it must **persist** the values received. There's no way
to request the current state at any point (see §9).

---

## 9. CONFIRMED BUG — refresh commands don't work

Documented in the manual (section 22.4.5), but with no effect on v5.2.0:

```
/hog/command  refreshall
/hog/command  consoleledrefresh
/hog/command  consolefaderrefresh
```

Produce no response at all. Reported on the ETC forum.

**Only full-sync mechanism:** doing a **log off + session relaunch** on the console.
This generates a full state dump — all `h1`–`h12` (no offset), the 36 playback masters,
and all named buttons.

> **Mandatory rule of thumb:** Companion must be connected and listening at the moment
> the session launches, otherwise this window is missed and the module is left with
> stale data until each key changes individually.

---

## 10. The object's real color does NOT exist over OSC

`/hog/status/led/h<N>color` does **not** reflect the color assigned to the
cuelist/scene/page. It only transmits the generic LED blink cycle:

```
ffffff  on
000000  off
0000ff  transition/inactive
```

Tested in isolation: cuelist alternated between orange and red, with the key active,
with and without Undo/Redo. **None of those colors ever appeared.**

Makes sense: color is assigned by a separate module (right-click → color picker) and
is an attribute of the object, not of the key's state.

**Implication:** the module can use `h<N>color` as an activity indicator (blinks while
the key is active), but never as "the cuelist's color". Recommended to filter `000000`
to avoid visual flicker.

---

## 11. BUG — key 12 and page change

Key 12 sometimes causes a malformed address to be sent:

```
/hog/status/led/Invalid input        FLOAT(1)
/hog/status/led/Invalid inputcolor   STRING(ffffff)
```

instead of the expected `/hog/status/led/h13` and `/hog/status/led/h13color`.
Captured at packet level, correlated with h13 activation.

**Confirmed hypothesis (2026-08-13):** physical key 12 works as **command directory
page change**, cycling the view in blocks of 12 — not a key defect, it's normal console
behavior when there are more than 12 available commands. Confirmed by the operator's
direct knowledge of how the console works (not packet-captured like the rest of this
document). This explains the malformed address: when changing page, key 12 stops
matching a fixed `h<N>`, hence the `Invalid input` address.

The module must tolerate malformed addresses without failing.

**Confirmed (2026-08-14):** key 12 NEVER works as a normal command slot, on any
generation of console hardware — it's always dedicated to page change. The text shown
in `h12_line1`/`h12_line2` (e.g. `"CMD>>"` / `"1 of 2"`) is not an assigned
cuelist/scene, nor stale data — it's the **fixed label of the page-change function
itself** (`"1 of 2"` indicates how many command pages exist). This explains an initial
observation after a relaunch that looked like "stale data not yet cleared" — it wasn't;
it's the correct, expected value for this key.

**But the function itself isn't working right now (2026-08-14):** pressing physical key
12 directly on the console (not through Companion) doesn't change the command page. The
label displays correctly, but the action itself has no effect. Not related to the
module/Companion — tested directly on the physical console.

**But it works on Hog PC (virtual console):** the same command-page-change function
works correctly in the Hog PC application (software), unlike the physical console
where key 12 has no effect. Suggests an issue specific to this console's physical
hardware (or this particular unit), not the console's general logic.

**Also doesn't work via OSC/Companion (2026-08-14):** tested by sending
`press_command_key` (key 12) from a Companion button — `/hog/hardware/h13` (+1 offset
applied) — and the command page doesn't change, same as the physical key. In other
words, the problem isn't only the key's physical contact; the page-change function tied
to key 12 doesn't respond even when triggered via OSC — but it's still a problem with
this console's (desk's) hardware, not the console's general logic: the OSC send reaches
the same physical desk with the same problem, while Hog PC (which runs separately,
without depending on the desk's hardware) keeps working correctly, as noted above.
`press_command_key`/`release_command_key` remain correct and available in the module
for the other 11 command keys (normal use), but should not be used for key 12 for the
purpose of changing pages — see `func` below for the working alternative.

**Physical "FUNC" key (2026-08-14, Protokol capture):** produces exactly the same
refresh burst (h6 to h13, `line1`/`line2` empty) associated with the command-key page
change above. Has no OSC path documented in any known source (official manual nor
highend-hog4). Combined with Open (Open+FUNC), opens a command directory/menu -
a distinct function, not tested at the OSC level.

**Confirmed (2026-08-14):** `/hog/hardware/func` (same naming pattern as the other
hardware buttons) was tested from Companion and **does change the command page** — the
same function that key 12's label advertises but that currently doesn't work on this
console (see above). Added to `HARDWARE_BUTTON_CHOICES` as `func`. This gives the
module a working way to change the command page from Companion while physical key 12
isn't fixed by ETC - use `press_hardware_button`/`release_hardware_button` with `func`
instead of `press_command_key`/`release_command_key` with key 12. Temporary solution:
until ETC resolves this hardware-vs-software discrepancy on key 12, the physical key 12
button in the module's example Companion layout was replaced with `func`.

Note: the earlier ambiguity about "FUNC alone vs Pig+FUNC vs Open+FUNC" referred to the
physical key pressed directly on the console. The confirmed test here is specifically
sending `/hog/hardware/func` via OSC/Companion (equivalent to "FUNC alone"), which
produced a visible and consistent page change.

---

## 12. Burst behavior

Any assignment/removal operation triggers a **full sweep** from h2 to h13:

```
09:47:52.770  h2/line1  = "test"
09:47:52.778  h2/line2  = "...."      (+8 ms)
09:47:52.815  h3/line1  = ""          (+45 ms)
...
09:47:53.135  h10/line2 = ""          (~365 ms total)
```

This is exactly what makes `generic-osc`'s shared variable unusable, and what the
module's internal dictionary solves.

**Additional note:** releasing many cuelists at once ("release all") causes UDP packet
loss — some indicators don't update. Releasing one at a time is 100% reliable. This is a
UDP limitation, not the console's; the module can mitigate it by reacting to any later
update of the same path.

**The relaunch dump covers the ENTIRE console state (2026-08-14), not just the command
keys.** When relaunching the session (logoff + relaunch), the full burst includes
playback masters, named buttons, and not just `h1`-`h12`. The module already has
dedicated logic for the command-key special case (no-offset dump vs. +1-offset
individual events, §5), tested in `test/commandKeys.test.ts`; the other variable types
(masters, named buttons, encoders) use the same simple parsing path that already
handles individual updates, so there shouldn't be any special logic missing for them -
but to be confirmed with a real capture of a full relaunch before considering it
definitively confirmed.

**Confirmed by a real relaunch capture (2026-08-14):** the observed full burst uses
exactly the same paths already handled by the module, with nothing new:
- Masters: `/hog/status/led/{choose,go,pause,goback,flash}/<M>` (and the `color`
  variants), observed from `M=26` down to `M=0` in this session (27 masters "in use" -
  not necessarily the maximum addressable limit, just what the console had assigned in
  this show).
- Command keys: `/hog/status/led/h12` down to `/hog/status/led/h1` (no `line1`/`line2`
  in this particular capture - probably because no names were assigned in this test
  session).
- Named buttons: `time`, `effects`, `beam`, `colour`, `position`, `intensity`, `blind`,
  `clear`, `highlight`, `macro`, `ratedisabled`, `thruster upper`, `mainhalt`,
  `mainback`, `maingo`, `dbo` - all already covered by `NAMED_BUTTONS` in
  `namedButtons.ts`.

No new or unexpected path appeared. The existing parsing (with no extra special-casing
for masters/named buttons) already handles the full dump correctly.

---

## 13. Module requirements

### Variables (one per path — the central point)

```
h<N>_line1        h<N>_line2        h<N>_led        h<N>_color     (N = 1..12, offset already handled)
master<M>_go      master<M>_pause   master<M>_goback   master<M>_flash   master<M>_choose
encoder<E>_label  encoder<E>_value  (E = 1..5)
commandline
blind, clear, highlight, dbo, macro, ...
```

### Feedbacks

- Command key LED state (boolean)
- LED color (for border/fill)
- Named button state
- Go/pause state per master

### Actions

- Press command key (offset handled internally)
- Press named button (Pig, Blind, Clear, Highlight, Release…)
- Release cuelist/scene/macro by number
- Send an arbitrary command-line command

### Implementation

- Internal `Map<path, value>` dictionary, updated on every message
- Persist values across restarts (no refresh on demand — §9)
- Tolerate malformed addresses (§11)
- Always accept the latest value for fragmented labels (§3.4)

---

## 14. State reported to ETC

Reported on the ETC community forum:

1. +1 offset on command keys
2. `refreshall` / `consoleledrefresh` / `consolefaderrefresh` have no effect
3. `line1` doesn't update on reassignment (stale claim — see §8: it does update, via
   `Move To`)

Commented on issue **#7** of the `bitfocus/companion-module-highend-hog4` repository
(request for native OSC feedback), with these findings.

Related in the `generic-osc` module: issues **#76**, **#78**, **#82** — all requesting
per-path value capture for variables. Still unimplemented in v2.8.2, the latest version.

---

## 15. Long names and spaces — unpredictable line1/line2 wrap

Confirmed by testing on 2026-08-13: the console does automatic **word-wrap** of the
object's name between `line1` and `line2` when it doesn't fit on one line, breaking at
the nearest space to the limit.

| Assigned name | `line1` | `line2` |
|---|---|---|
| `"again"` (5 characters) | `again` | *(empty)* |
| `"test SC"` (7 characters, with space) | `test` | `SC` |

This is **not** a type-of-object indicator (see the false discovery below) — it's just
the physical console screen's line-wrap behavior, applicable to any object (cuelist,
scene, macro) whose name is too long.

**False discovery, corrected:** it initially looked like `line2 === "SCENE"`
distinguished a scene from a cuelist — coincidence: the scene's test name literally
contained the word "SCENE", which happened to land isolated in `line2` after the wrap.
**There is no OSC field indicating the object's type** (cuelist vs. scene vs. macro).
See §13 of the module's README for the design conclusion (per-button style has to be
chosen manually by the operator).

**Loose thread, not confirmed:** during a live rename, `line2` momentarily showed the
text being typed (e.g. `"222"`) while `line1` still had the old, confirmed name -
possible real-time typing echo before Enter, similar to `commandline` (§3.5). To be
confirmed whether the same happens with cuelists, not only scenes.

**Limitation to report to ETC:** there's no reliable way to reconstruct the full
original name from `line1`+`line2` - the wrap doesn't always happen at a predictable
space, and the behavior itself may change in future Hog OS versions. Worth re-testing
after every console update.

---

## 16. U-Keys — all 4 interaction modes confirmed

The console has **12 U-Keys** (user-configurable macro keys), each with **4** possible
**interaction modes**: single press, double-click, Pig+U-key, and Open+U-key.

**Confirmed by testing on 2026-08-13 (single press) and 2026-08-14 (the other 3
modes):**

```
/hog/hardware/u<N>   0 = up, 1 = down
```

Matches exactly what the ETC manual documents — **no offset** (unlike command keys,
§5). `u1` is `u1`, not `u2`. **All 4 interaction modes produce the exact same path** —
double-click, Pig+U-key, and Open+U-key have no OSC signal distinct from a single
press. The distinction between modes happens entirely on the console side (which
function the key runs), not in the OSC protocol.

**Status feedback: intentionally doesn't exist, by design** (clarified by the user
2026-08-14) — U-Keys are user-configurable for any function (including things with no
state of their own, like "lock console"), so the console has no way to expose a
generic, useful feedback for them. This isn't a gap to fill later; it makes no sense to
keep looking for `/hog/status/u<N>/...`.

**How to apply:** `press_u_key`/`release_u_key` already implement the confirmed path
above and cover all 4 modes automatically (no need for separate actions per mode, since
the protocol is identical).

**False lead tested and disproven (2026-08-13):** `/hog/hardware/open` was tried as the
path for the "Open" modifier key (used in combos like Pig+Open+U-key), by analogy with
"pig" and because it matches what the separate `companion-module-highend-hog4` project
already uses in its `HardwareKey`. Tested via Companion against the real console — **did
nothing**. Removed from `HARDWARE_BUTTON_CHOICES`. The real path for the Open key (if
any) remains unknown.

**The console doesn't echo the physical Open key directly, but produces an indirect
signal (corrected 2026-08-14):** a ~16s Protokol capture including 3 physical presses
of the Open key on the console — no dedicated "hardware key pressed"-type event, but a
pattern that repeats exactly 3 times, coinciding with the 3 presses:

```
/hog/status/encoderwheel1/label   STRING(Scroll Up/Down)
/hog/status/encoderwheel2/label   STRING(Scroll Left/Right)
/hog/status/encoderwheel3/label   STRING(Zoom)
... ~0.3s later ...
/hog/status/encoderwheel1/label   STRING()
/hog/status/encoderwheel2/label   STRING()
/hog/status/encoderwheel3/label   STRING()
```

These labels match exactly the official ETC documentation
(chap-magic_keys_combos.htm): "Open + encoder wheels: Controls vertical/horizontal
scrolling and zooming". Conclusion: Open doesn't have its own hardware/status path —
instead, **pressing Open makes the console temporarily relabel the encoder wheels** to
reflect the function they take on while Open is held, and the labels go back to empty
when Open is released. This is an indirect but real and reproducible signal of "Open is
pressed/released", useful as a proxy if a feedback for this is ever needed - but it's
not a dedicated `/hog/hardware/open` path, and it's still unknown whether any send-only
path exists to simulate pressing Open itself from Companion.

---

## 17. Programming keys (macro/list/page/delete/move/update/setup/goto/set) — unverified

Added to `HARDWARE_BUTTON_CHOICES` (2026-08-14) from the separate
`bitfocus/companion-module-highend-hog4` project, whose `src/setup.js` already lists
these exact ids in `Choices.HardwareKey`:

```
/hog/hardware/macro
/hog/hardware/list
/hog/hardware/page
/hog/hardware/delete
/hog/hardware/move
/hog/hardware/update
/hog/hardware/setup
/hog/hardware/goto
/hog/hardware/set
```

This source already got right every other id already confirmed in this module (pig,
release, blind, highlight, clear, next, back, record, merge, copy) — but it also listed
"open", which we tested and disproved (§16). **So: a good lead, not proof.** Each of
these 9 remains to be tested against the real console before being considered
confirmed.

**Bulk copy of the rest of `HardwareKey` (2026-08-14):** the rest of
`companion-module-highend-hog4`'s list was also copied into `HARDWARE_BUTTON_CHOICES`,
for future use, with the same "unverified" warning:

```
/hog/hardware/zero .. /hog/hardware/nine, /period, /at, /minus, /plus, /slash, /thru, /full,
/backspace, /enter, /up, /down, /left, /right, /live, /scene, /cue, /fan, /intensity,
/position, /colour, /beam, /effect, /time, /group, /fixture, /maingo, /mainhalt, /mainback,
/mainchoose, /skipfwd, /skipback, /assert, /restore, /rate
```

---

## 18. Master Key press/release (Choose/Go/Pause/Back/Flash) — confirmed by the official manual

`HARDWARE_BUTTON_CHOICES` covers fixed keys, but playback masters (§3.3) have their own
physical Choose/Go/Pause/Back/Flash keys per master (the Gig Hog has 5 physical
masters; other Hog consoles have 10 per bank - see §21). There was no action to press
them from Companion - only the status variables already existed.

Initially sourced from `bitfocus/companion-module-highend-hog4`'s `src/actions.js`
(`masterKey` action), and **since 2026-08-14 also confirmed by the official ETC
manual** (`sect-osc_mappings.htm`, section 22.4.3 "OSC Button Mappings"):

```
/hog/hardware/choose/master#
/hog/hardware/go/master#
/hog/hardware/pause/master#
/hog/hardware/goback/master#      ("Back" key)
/hog/hardware/flash/master#
```

Value: 1 = key pressed, 0 = key released. Names match exactly the ones already
confirmed by packet capture in §3.3. Implemented as
`press_master_key`/`release_master_key`.

**Tested on 2026-08-14, NEGATIVE result**: `choose` pressed via Companion on Master 1 -
**doesn't work** (doesn't select the master in any useful way). A Protokol capture of
the same window showed changes in the encoder wheels and the choose LED, but the user
confirmed those changes weren't caused by our button (coincidence/pre-existing state) -
lesson: correlating log timestamps with an action isn't proof without direct
confirmation of cause and effect. Removed from `MASTER_KEY_CHOICES` - same pattern as
"open"/"slash" (two agreeing sources, but tested and disproven).
`go`/`pause`/`goback`/`flash` remain untested, same caveat.

**User note (2026-08-14) on deprioritizing further testing here**: these master keys
(the Choose/Go/Pause/Back/Flash-per-master concept as documented) exist on Hog 4 but no
longer exist in the same form on more recent generations of the Hog console - so it's
not worth exhaustively testing `go`/`pause`/`goback`/`flash` or the Grand Master
Fader/Encoder Wheels (§20) for now. Kept in the code for compatibility with anyone
still using Hog 4, but not a priority for continued testing in this session.

The manual (full section 22.4.3) also confirms exactly the ids already bulk-copied into
`HARDWARE_BUTTON_CHOICES` (§17): `ewheelbutton/#`, `iwheelup`, `iwheeldown`, `pig`,
`period`, `up`/`down`/`left`/`right`, `at`/`minus`/`plus`, `backspace`, `h#`
(function/command keys), `maingo`/`mainhalt`/`mainback`/`mainchoose`,
`skipfwd`/`skipback`, `zero`..`nine` - now with the same double confirmation.

**False lead tested and disproven (2026-08-14): `/hog/hardware/slash`.** Despite being
confirmed by TWO independent sources (manual §22.4.3 and highend-hog4), tested via
Companion against the real console and **did nothing** — same pattern as "open" (§16).
Important: the physical "/" key works normally on the console and the corresponding
echo reaches `/hog/status/commandline` fine (confirmed by Protokol capture) — only the
SEND path is wrong, not reception. Removed from `HARDWARE_BUTTON_CHOICES`. Lesson: not
even two agreeing sources replace real testing.

**`goto` — inconclusive, not disproven (2026-08-14).** Tested via Companion and did
nothing, but unlike "open"/"slash", this **doesn't prove the OSC path is wrong** — the
"Goto" function itself also doesn't work when pressing the physical key on the console
in this Hog OS version (suspected console-side bug, not the module's). Kept in
`HARDWARE_BUTTON_CHOICES` as is; to be re-confirmed on a Hog OS version where the Goto
function works.

## 19. Playback Go/Halt/Resume — confirmed by the official manual (new, not implemented yet)

Manual section 22.4.1 ("OSC Playback Mappings") confirms the same pattern already used
by `release_playback_item`, but reveals three actions missing from the module:

```
/hog/playback/go/<type>       value = <number>            (or <number>.<cue#> to go to a specific cue within a cuelist)
/hog/playback/halt/<type>     value = <number>
/hog/playback/resume/<type>   value = <number>
/hog/playback/release/<type>  value = <number>             (already confirmed and implemented)
```

`<type>`: 0=Cuelist, 1=Scene, 2=Macro (same values as `PLAYBACK_ITEM_CHOICES`). The path
is fixed per item type; the cuelist/scene/macro number goes in the OSC message's value,
not in the path - exactly as `release_playback_item` already does. "Resume" is only
documented for cuelists in the manual, but the table lists the same generic
`/hog/playback/resume/<type>` path for all types.

**Tested on 2026-08-14, NEGATIVE result**: `go_playback_item`/`halt_playback_item`/
`resume_playback_item` tested via Companion (Cuelist 1) - none worked. Unlike
`release_playback_item` (already confirmed working), these three produced no effect at
all. Kept in the code (not removed) by the user's decision - they might start working in
a future Hog OS version, or there might be an undocumented prerequisite (e.g. the item
already having been "chosen" beforehand - which itself isn't confirmed to work either,
see §18). To be re-confirmed when more information from ETC is available.

## 20. Faders, Encoders, and Trackball — confirmed by the official manual (new, not implemented yet)

Manual section 22.4.4 ("OSC Fader and Encoder Mappings") - send-only paths (Companion →
console), continuous values instead of 1/0:

```
/hog/hardware/posmode              0 = toggle off, 1 = toggle on (trackball position mode)
/hog/hardware/trackball             X,Y values
/hog/hardware/fader/0               0-255 (Grand Master Fader - master 0 is the Grand Master)
/hog/hardware/encoderwheel/#        -20 to 20 (variable value, main encoder wheels)
/hog/hardware/ratewheel              -20 to 20 (variable value)
/hog/hardware/iwheel                  -20 to 20 (variable value)
```

Note: `/hog/hardware/fader/<M>` uses the same pattern as highend-hog4's `masterFader`
(§18), but now with `M=0` confirmed to specifically be the Grand Master, not a normal
playback master - to be checked whether `fader/<M>` with M>0 works the same way for the
other masters.

## 21. Master bank structure — confirmed visually on Hog PC, OSC addressing to be confirmed

Per the user (2026-08-14): the console organizes physical masters into **9 banks
(numbered 0-8)**, each with **10 physical masters** (Fader + Back + Pause + Play/Go +
Choose per master) - a theoretical total of 90 addressable masters. This is higher than
the 36 already confirmed by packet capture in §3.3.

**Confirmed visually (2026-08-14)** from a Hog PC video (`Virtual Wing Window`, frames
extracted with `ffmpeg`): the window clearly shows "Master Segment N" with N=0 to 8 (9
tabs), and each segment shows 10 continuously-numbered masters:
- Segment 0 → masters 1-10
- Segment 2 → masters 21-30
- Segment 5 → masters 51-60
- Segment 8 → masters 81-90

Confirms exactly the 9×10=90 structure described by the user. **What remains to be
verified**: how this maps to the `<M>` index used in the OSC paths already confirmed in
§18 (`/hog/hardware/go/master#` etc.) and in §3.3 - for example, whether the "Master 1"
shown in the UI corresponds to `master#=0` (0-based index, like the U-Keys) or to
`master#=1`, and whether the 36 already confirmed by capture correspond to segments 0-3
(partial) or some other distribution. Don't change `MASTER_COUNT` or build banked UI
without confirming the exact index with a real capture. The Gig Hog specifically only
shows 5 physical masters at a time (vs. 10 on Hog PC/other consoles), but should
address the same logical 90-master space over OSC.
