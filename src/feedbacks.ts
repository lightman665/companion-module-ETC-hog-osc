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
