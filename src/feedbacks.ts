import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import { COMMAND_KEY_CHOICES } from './commandKeys.js'
import { NAMED_BUTTON_CHOICES, toVariableId, type NamedButton } from './namedButtons.js'

export type GetVariableValue = (variableId: string) => unknown

export function createFeedbackDefinitions(getVariableValue: GetVariableValue): CompanionFeedbackDefinitions {
  return {
    command_key_led: {
      type: 'boolean',
      name: 'Command Key LED on',
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
    named_button_led: {
      type: 'boolean',
      name: 'Named Button LED on',
      description: 'Active-state color can be overridden per button in the Style section (e.g. red for Clear, white for HiLite/Blind).',
      options: [{ id: 'button', type: 'dropdown', label: 'Button', choices: NAMED_BUTTON_CHOICES, default: 'blind' }],
      defaultStyle: { bgcolor: combineRgb(255, 255, 255) },
      callback: (feedback) => {
        const button = feedback.options.button as NamedButton
        return Number(getVariableValue(`${toVariableId(button)}_led`)) === 1
      },
    },
    open_key_held: {
      type: 'boolean',
      name: 'Open Key held (indirect)',
      description:
        'Open has no dedicated OSC path (HOG_OSC_SPEC.md §16) - while held, the console relabels the 3 encoder wheels to their Open+Encoder combo functions (Scroll Up/Down, Scroll Left/Right, Zoom). This checks all 3 at once as an indirect "Open is held" signal; requires all 3 to avoid false positives from other combos that only touch one wheel.',
      options: [],
      defaultStyle: { bgcolor: combineRgb(0, 128, 255) },
      callback: () => {
        return (
          String(getVariableValue('encoder1_label') ?? '') === 'Scroll Up/Down' &&
          String(getVariableValue('encoder2_label') ?? '') === 'Scroll Left/Right' &&
          String(getVariableValue('encoder3_label') ?? '') === 'Zoom'
        )
      },
    },
  }
}
