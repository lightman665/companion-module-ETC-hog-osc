import type { CompanionActionDefinitions, DropdownChoice } from '@companion-module/base'
import { COMMAND_KEY_CHOICES, toWireKey } from './commandKeys.js'

export type SendOsc = (path: string, value: number) => void

/**
 * pig/release/blind/highlight/clear are confirmed in HOG_OSC_SPEC.md §4.
 * record/merge/copy/next/back are from the official ETC Hog Operations
 * Manual (§22.4.2) but NOT yet verified against a real console the way
 * everything else in this module is - the same manual already documented
 * refresh commands that turned out not to work (spec §9), so treat these
 * five as unconfirmed until tested.
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
  }
}
