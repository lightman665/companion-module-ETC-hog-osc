import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import { COMMAND_KEY_CHOICES } from './commandKeys.js'
import { NAMED_BUTTON_CHOICES, toVariableId, type NamedButton } from './namedButtons.js'

export type GetVariableValue = (variableId: string) => unknown

export function createFeedbackDefinitions(getVariableValue: GetVariableValue): CompanionFeedbackDefinitions {
  return {
    command_key_led: {
      type: 'boolean',
      name: 'Command Key LED aceso',
      options: [{ id: 'key', type: 'dropdown', label: 'Command key', choices: COMMAND_KEY_CHOICES, default: 1 }],
      defaultStyle: { bgcolor: combineRgb(255, 0, 0) },
      callback: (feedback) => {
        const key = Number(feedback.options.key)
        return Number(getVariableValue(`h${key}_led`)) === 1
      },
    },
    command_key_assigned: {
      type: 'boolean',
      name: 'Command Key has assignment (line1/line2 not empty)',
      description: 'True when the key has a name or state text - i.e. something is actually assigned to it, distinct from the LED blink state.',
      options: [{ id: 'key', type: 'dropdown', label: 'Command key', choices: COMMAND_KEY_CHOICES, default: 1 }],
      defaultStyle: { bgcolor: combineRgb(255, 255, 255) },
      callback: (feedback) => {
        const key = Number(feedback.options.key)
        const line1 = String(getVariableValue(`h${key}_line1`) ?? '').trim()
        const line2 = String(getVariableValue(`h${key}_line2`) ?? '').trim()
        return line1.length > 0 || line2.length > 0
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
