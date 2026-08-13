import type { CompanionVariableDefinition } from '@companion-module/base'
import { NAMED_BUTTONS, toVariableId } from './namedButtons.js'
import { MASTER_ACTIONS_WITH_COLOR, MASTER_COUNT } from './masters.js'
import { SYSTEM_PATH_VARIABLES } from './systemPaths.js'

/**
 * One variable per command-key field, indexed by physical key (1..12, offset
 * already resolved — see commandKeys.ts), plus one per named front-panel
 * button, plus one per playback-master action, plus encoder wheels and
 * fixed system paths. This covers all read-side variables from §13.
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

  for (let master = 0; master < MASTER_COUNT; master++) {
    for (const action of MASTER_ACTIONS_WITH_COLOR) {
      defs[`master${master}_${action}`] = { name: `Master ${master} — ${action} aceso` }
      defs[`master${master}_${action}_color`] = { name: `Master ${master} — ${action} cor` }
    }
    defs[`master${master}_choose`] = { name: `Master ${master} — choose aceso` }
  }

  for (let encoder = 1; encoder <= 5; encoder++) {
    defs[`encoder${encoder}_label`] = { name: `Encoder ${encoder} — label` }
    defs[`encoder${encoder}_value`] = { name: `Encoder ${encoder} — valor` }
  }

  defs[SYSTEM_PATH_VARIABLES['/hog/system/time']] = { name: 'Hora do sistema (heartbeat)' }
  defs[SYSTEM_PATH_VARIABLES['/hog/status/commandline']] = { name: 'Linha de comando (eco em tempo real)' }

  return defs
}
