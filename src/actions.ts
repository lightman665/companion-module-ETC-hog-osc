import type { CompanionActionDefinitions, DropdownChoice } from '@companion-module/base'
import { COMMAND_KEY_CHOICES, toWireKey } from './commandKeys.js'
import { MASTER_COUNT } from './masters.js'

export type SendOsc = (path: string, value: number | string) => void

/**
 * pig/release/blind/highlight/clear are confirmed in HOG_OSC_SPEC.md §4.
 *
 * CONFIRMED by real console testing 2026-08-14: record/merge/copy/next/back
 * (originally from the official ETC Hog Operations Manual §22.4.2);
 * delete/move/update/macro (originally bulk-copied from highend-hog4); and
 * zero/one/two/three/four/five/six/seven/eight/nine/period/at/minus/plus/
 * thru/full/backspace/enter/up/down/left/right/live/scene/cue/fan/
 * intensity/position/colour/beam/effect/time/group/fixture/maingo/
 * mainhalt/mainback/mainchoose/skipfwd/skipback/assert/restore/rate (also
 * bulk-copied from highend-hog4, tested via the "Test A"/"Test B"/"Test C"
 * scratchpad pages).
 *
 * list/page/setup/goto/set are still UNVERIFIED (2026-08-14), added from
 * the separate, established bitfocus/companion-module-highend-hog4
 * project's src/setup.js (HardwareKey choices) - the same source that
 * correctly matched every already-confirmed id above. It also listed
 * "open" and "slash", which we tested and disproved (see below) - so this
 * source is a good lead but not proof for the remaining untested ids; test
 * each before fully trusting them.
 *
 * "open" is deliberately NOT in this list: tested against the real console
 * 2026-08-13 (pressed via Companion) and /hog/hardware/open did nothing -
 * disproven despite matching the naming pattern of the confirmed "pig" path
 * and matching what the separate companion-module-highend-hog4 project uses.
 * See HOG_OSC_SPEC.md §16 for the note on this false lead.
 *
 * "all" is deliberately NOT in this list: the manual documents
 * /hog/hardware/all as a single path, but real testing showed the console's
 * "select all active in the programmer" is actually a Back+Next chord, not
 * a dedicated key - see select_all_in_programmer below.
 *
 * "slash" is deliberately NOT in this list: tested against the real console
 * 2026-08-14 (pressed via Companion) and /hog/hardware/slash did nothing,
 * despite being confirmed by BOTH the official manual (§22.4.3) and
 * highend-hog4. Confirmed via Protokol that the physical "/" key DOES work
 * and echoes correctly to /hog/status/commandline - only the Companion-side
 * send path is wrong. See HOG_OSC_SPEC.md §17 for the note.
 */
const HARDWARE_BUTTON_CHOICES: DropdownChoice[] = [
  'pig',
  'release',
  'blind',
  'highlight',
  'clear',
  'record',
  'merge',
  'copy',
  'next',
  'back',
  'macro',
  'list',
  'page',
  'delete',
  'move',
  'update',
  'setup',
  'goto',
  'set',
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'period',
  'at',
  'minus',
  'plus',
  'thru',
  'full',
  'backspace',
  'enter',
  'up',
  'down',
  'left',
  'right',
  'live',
  'scene',
  'cue',
  'fan',
  'intensity',
  'position',
  'colour',
  'beam',
  'effect',
  'time',
  'group',
  'fixture',
  'maingo',
  'mainhalt',
  'mainback',
  'mainchoose',
  'skipfwd',
  'skipback',
  'assert',
  'restore',
  'rate',
].map((id) => ({
  id,
  label: id,
}))

/**
 * Confirmed by testing 2026-08-13 (HOG_OSC_SPEC.md §16) plus the ETC-provided PDF in
 * https://github.com/bitfocus/companion-module-highend-hog4/issues/24: single-press U-Keys
 * use /hog/hardware/u<N>, no offset (u1 is u1). There are 12 U-Keys total, each also
 * supporting double-press, Pig+U-key, and Open+U-key modes, but only single-press has been
 * verified against a real console - the other 3 modes are not implemented until captured.
 * No feedback exists for U-Keys: each key's function is configured in the console's user
 * preferences, not broadcast over OSC like command key assignments are.
 */
const U_KEY_CHOICES: DropdownChoice[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  label: `U${i + 1}`,
}))

const PLAYBACK_ITEM_CHOICES: DropdownChoice[] = [
  { id: 0, label: 'Cuelist' },
  { id: 1, label: 'Scene' },
  { id: 2, label: 'Macro' },
]

/**
 * UNVERIFIED (2026-08-14), sourced from bitfocus/companion-module-highend-hog4's
 * src/actions.js `masterKey` action: /hog/hardware/<type>/<master>, matching the
 * same action names as the confirmed status paths (masters.ts's MASTER_ACTIONS).
 * Same "good lead, not proof" caveat as the other highend-hog4-sourced ids.
 */
const MASTER_KEY_CHOICES: DropdownChoice[] = ['choose', 'go', 'pause', 'goback', 'flash'].map((id) => ({
  id,
  label: id,
}))

/**
 * The dropdown for press/release_master_key intentionally goes up to 90 (9 banks x 10
 * masters, per the user's description of the console's bank structure - HOG_OSC_SPEC.md
 * §21), NOT MASTER_COUNT (36, the packet-confirmed range for status variables). Sending
 * an action doesn't require the same prior confirmation as claiming a status variable
 * exists - this is just making the dropdown cover the full known range. Displayed as
 * "Master 1"-"Master 90" (1-based, matching the console's own UI) but the OSC value sent
 * is 0-based (id), matching "os bank masters começam no zero" per the user.
 */
const MASTER_BANK_COUNT = 9
const MASTERS_PER_BANK = 10
const TOTAL_MASTERS = MASTER_BANK_COUNT * MASTERS_PER_BANK

const MASTER_NUMBER_CHOICES: DropdownChoice[] = Array.from({ length: TOTAL_MASTERS }, (_, i) => ({
  id: i,
  label: `Master ${i + 1}`,
}))

/**
 * Actions for the outgoing OSC paths confirmed in HOG_OSC_SPEC.md §4. Command
 * keys use toWireKey() to apply the same +1 offset as receiving does (§5).
 */
export function createActionDefinitions(send: SendOsc): CompanionActionDefinitions {
  return {
    press_command_key: {
      name: 'Command Key: Press',
      options: [{ id: 'key', type: 'dropdown', label: 'Command key', choices: COMMAND_KEY_CHOICES, default: 1 }],
      callback: (action) => {
        send(`/hog/hardware/h${toWireKey(Number(action.options.key))}`, 1)
      },
    },
    release_command_key: {
      name: 'Command Key: Release',
      options: [{ id: 'key', type: 'dropdown', label: 'Command key', choices: COMMAND_KEY_CHOICES, default: 1 }],
      callback: (action) => {
        send(`/hog/hardware/h${toWireKey(Number(action.options.key))}`, 0)
      },
    },
    press_hardware_button: {
      name: 'Hardware Button: Press',
      options: [{ id: 'button', type: 'dropdown', label: 'Button', choices: HARDWARE_BUTTON_CHOICES, default: 'pig' }],
      callback: (action) => {
        send(`/hog/hardware/${String(action.options.button)}`, 1)
      },
    },
    release_hardware_button: {
      name: 'Hardware Button: Release',
      options: [{ id: 'button', type: 'dropdown', label: 'Button', choices: HARDWARE_BUTTON_CHOICES, default: 'pig' }],
      callback: (action) => {
        send(`/hog/hardware/${String(action.options.button)}`, 0)
      },
    },
    press_select_all_in_programmer: {
      name: 'Select All in Programmer (Back+Next chord): Press',
      description: 'Confirmed by testing: this is not a dedicated hardware key, the console triggers it via Back+Next pressed together.',
      options: [],
      callback: () => {
        send('/hog/hardware/back', 1)
        send('/hog/hardware/next', 1)
      },
    },
    release_select_all_in_programmer: {
      name: 'Select All in Programmer (Back+Next chord): Release',
      options: [],
      callback: () => {
        send('/hog/hardware/back', 0)
        send('/hog/hardware/next', 0)
      },
    },
    press_u_key: {
      name: 'U-Key: Press (single press)',
      options: [{ id: 'key', type: 'dropdown', label: 'U-Key', choices: U_KEY_CHOICES, default: 1 }],
      callback: (action) => {
        send(`/hog/hardware/u${Number(action.options.key)}`, 1)
      },
    },
    release_u_key: {
      name: 'U-Key: Release (single press)',
      options: [{ id: 'key', type: 'dropdown', label: 'U-Key', choices: U_KEY_CHOICES, default: 1 }],
      callback: (action) => {
        send(`/hog/hardware/u${Number(action.options.key)}`, 0)
      },
    },
    press_master_key: {
      name: 'Master Key: Press',
      options: [
        { id: 'key', type: 'dropdown', label: 'Key', choices: MASTER_KEY_CHOICES, default: 'go' },
        { id: 'master', type: 'dropdown', label: 'Master', choices: MASTER_NUMBER_CHOICES, default: 0 },
      ],
      callback: (action) => {
        send(`/hog/hardware/${String(action.options.key)}/${Number(action.options.master)}`, 1)
      },
    },
    release_master_key: {
      name: 'Master Key: Release',
      options: [
        { id: 'key', type: 'dropdown', label: 'Key', choices: MASTER_KEY_CHOICES, default: 'go' },
        { id: 'master', type: 'dropdown', label: 'Master', choices: MASTER_NUMBER_CHOICES, default: 0 },
      ],
      callback: (action) => {
        send(`/hog/hardware/${String(action.options.key)}/${Number(action.options.master)}`, 0)
      },
    },
    release_playback_item: {
      name: 'Release Cuelist/Scene/Macro by number',
      options: [
        { id: 'itemType', type: 'dropdown', label: 'Type', choices: PLAYBACK_ITEM_CHOICES, default: 0 },
        { id: 'number', type: 'number', label: 'Number', default: 1, min: 0, max: 9999 },
      ],
      callback: (action) => {
        send(`/hog/playback/release/${Number(action.options.itemType)}`, Number(action.options.number))
      },
    },
    go_playback_item: {
      name: 'Go Cuelist/Scene/Macro by number',
      description: 'Confirmed by the official ETC manual (HOG_OSC_SPEC.md §19), same path pattern as the already-verified release_playback_item.',
      options: [
        { id: 'itemType', type: 'dropdown', label: 'Type', choices: PLAYBACK_ITEM_CHOICES, default: 0 },
        { id: 'number', type: 'number', label: 'Number', default: 1, min: 0, max: 9999 },
      ],
      callback: (action) => {
        send(`/hog/playback/go/${Number(action.options.itemType)}`, Number(action.options.number))
      },
    },
    halt_playback_item: {
      name: 'Halt Cuelist/Scene/Macro by number',
      description: 'Confirmed by the official ETC manual (HOG_OSC_SPEC.md §19), same path pattern as the already-verified release_playback_item.',
      options: [
        { id: 'itemType', type: 'dropdown', label: 'Type', choices: PLAYBACK_ITEM_CHOICES, default: 0 },
        { id: 'number', type: 'number', label: 'Number', default: 1, min: 0, max: 9999 },
      ],
      callback: (action) => {
        send(`/hog/playback/halt/${Number(action.options.itemType)}`, Number(action.options.number))
      },
    },
    resume_playback_item: {
      name: 'Resume Cuelist/Scene/Macro by number',
      description: 'Confirmed by the official ETC manual (HOG_OSC_SPEC.md §19), same path pattern as the already-verified release_playback_item.',
      options: [
        { id: 'itemType', type: 'dropdown', label: 'Type', choices: PLAYBACK_ITEM_CHOICES, default: 0 },
        { id: 'number', type: 'number', label: 'Number', default: 1, min: 0, max: 9999 },
      ],
      callback: (action) => {
        send(`/hog/playback/resume/${Number(action.options.itemType)}`, Number(action.options.number))
      },
    },
    set_grand_master_fader: {
      name: 'Set Grand Master Fader Level',
      description: 'Confirmed by the official ETC manual (HOG_OSC_SPEC.md §20): /hog/hardware/fader/0, 0-255. Untested against a real console.',
      options: [{ id: 'level', type: 'number', label: 'Level (0-255)', default: 255, min: 0, max: 255 }],
      callback: (action) => {
        send('/hog/hardware/fader/0', Number(action.options.level))
      },
    },
    set_encoder_wheel: {
      name: 'Nudge Main Encoder Wheel',
      description: 'Confirmed by the official ETC manual (HOG_OSC_SPEC.md §20): /hog/hardware/encoderwheel/<N>, -20 to 20. Untested against a real console.',
      options: [
        { id: 'wheel', type: 'number', label: 'Encoder wheel # (1-5)', default: 1, min: 1, max: 5 },
        { id: 'value', type: 'number', label: 'Value (-20 to 20)', default: 1, min: -20, max: 20 },
      ],
      callback: (action) => {
        send(`/hog/hardware/encoderwheel/${Number(action.options.wheel)}`, Number(action.options.value))
      },
    },
    send_custom_osc: {
      name: 'Debug: Send Custom OSC Message',
      description:
        'For testing unconfirmed paths/hypotheses without writing new code - e.g. sending a string argument instead of the usual 1/0. If the value looks like a plain number it is sent as a float, otherwise as a string.',
      options: [
        { id: 'path', type: 'textinput', label: 'OSC Path', default: '/hog/hardware/', useVariables: true },
        { id: 'value', type: 'textinput', label: 'Value', default: '1', useVariables: true },
      ],
      callback: (action) => {
        const path = String(action.options.path)
        const raw = String(action.options.value)
        const asNumber = Number(raw)
        send(path, raw.trim() !== '' && !Number.isNaN(asNumber) ? asNumber : raw)
      },
    },
  }
}
