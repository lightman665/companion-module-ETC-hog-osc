import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import { COMMAND_KEY_CHOICES } from './commandKeys.js'

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
  }
}
