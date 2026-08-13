import type { CompanionActionDefinitions, DropdownChoice } from '@companion-module/base'
import { COMMAND_KEY_CHOICES, toWireKey } from './commandKeys.js'

export type SendOsc = (path: string, value: number) => void

const HARDWARE_BUTTON_CHOICES: DropdownChoice[] = ['pig', 'release', 'blind', 'highlight', 'clear'].map((id) => ({
  id,
  label: id,
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
