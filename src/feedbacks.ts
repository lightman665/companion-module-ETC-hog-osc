import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import { COMMAND_KEY_CHOICES } from './commandKeys.js'
import { NAMED_BUTTON_CHOICES, toVariableId, type NamedButton } from './namedButtons.js'

export type GetVariableValue = (variableId: string) => unknown

export function createFeedbackDefinitions(getVariableValue: GetVariableValue): CompanionFeedbackDefinitions {
  return {
    command_key_led: {
      type: 'boolean',
      name: 'Command Key LED aceso',
      description:
        'Requires both the LED variable and an actual assignment (line1/line2 not empty). The console can send these in separate bursts (§12), so LED alone can briefly stay 1 after a key is deleted - checking assignment too avoids a stuck-on indicator.',
      options: [{ id: 'key', type: 'dropdown', label: 'Command key', choices: COMMAND_KEY_CHOICES, default: 1 }],
      defaultStyle: { bgcolor: combineRgb(255, 0, 0) },
      callback: (feedback) => {
        const key = Number(feedback.options.key)
        const led = Number(getVariableValue(`h${key}_led`)) === 1
        const line1 = String(getVariableValue(`h${key}_line1`) ?? '').trim()
        const line2 = String(getVariableValue(`h${key}_line2`) ?? '').trim()
        return led && (line1.length > 0 || line2.length > 0)
      },
    },
    command_key_scene_active: {
      type: 'boolean',
      name: 'Command Key showing an active Scene',
      description:
        'True when the key is active AND line2 is literally "SCENE" - the console labels scene assignments this way instead of showing real state text, which is the only way to tell a scene apart from a cuelist in the data. Use this instead of Command Key LED aceso on keys that hold scenes, to show a different indicator color.',
      options: [{ id: 'key', type: 'dropdown', label: 'Command key', choices: COMMAND_KEY_CHOICES, default: 1 }],
      defaultStyle: { bgcolor: combineRgb(0, 0, 255) },
      callback: (feedback) => {
        const key = Number(feedback.options.key)
        const led = Number(getVariableValue(`h${key}_led`)) === 1
        const line2 = String(getVariableValue(`h${key}_line2`) ?? '').trim()
        return led && line2 === 'SCENE'
      },
    },
    named_button_led: {
      type: 'boolean',
      name: 'Named Button LED aceso',
      description: 'Active-state color can be overridden per button in the Style section (e.g. red for Clear, white for HiLite/Blind).',
      options: [{ id: 'button', type: 'dropdown', label: 'Button', choices: NAMED_BUTTON_CHOICES, default: 'blind' }],
      defaultStyle: { bgcolor: combineRgb(255, 255, 255) },
      callback: (feedback) => {
        const button = feedback.options.button as NamedButton
        return Number(getVariableValue(`${toVariableId(button)}_led`)) === 1
      },
    },
  }
}
