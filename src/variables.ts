import type { CompanionVariableDefinition } from '@companion-module/base'
import { NAMED_BUTTONS, toVariableId } from './namedButtons.js'

/**
 * One variable per command-key field, indexed by physical key (1..12, offset
 * already resolved — see commandKeys.ts), plus one per named front-panel
 * button. Playback masters and encoder wheels follow in later PRs.
 */
export function getVariableDefinitions(): Record<string, CompanionVariableDefinition> {
  const defs: Record<string, CompanionVariableDefinition> = {}

  for (let key = 1; key <= 12; key++) {
    defs[`h${key}_line1`] = { name: `Command key ${key} — nome do objeto` }
    defs[`h${key}_line2`] = { name: `Command key ${key} — estado` }
    defs[`h${key}_led`] = { name: `Command key ${key} — LED aceso` }
    defs[`h${key}_color`] = { name: `Command key ${key} — cor do LED` }
  }

  for (const button of NAMED_BUTTONS) {
    const id = toVariableId(button)
    defs[`${id}_led`] = { name: `Botão "${button}" — LED aceso` }
    defs[`${id}_color`] = { name: `Botão "${button}" — cor do LED` }
  }

  return defs
}
