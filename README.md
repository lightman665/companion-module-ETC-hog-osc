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
