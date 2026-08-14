import type { CompanionVariableDefinition } from '@companion-module/base'

/**
 * One variable per command-key field, indexed by physical key (1..12, offset
 * already resolved — see commandKeys.ts). Only h1-h12 are covered by this PR;
 * playback masters, encoder wheels, and named buttons follow in later PRs.
 */
export function getVariableDefinitions(): Record<string, CompanionVariableDefinition> {
  const defs: Record<string, CompanionVariableDefinition> = {}

  for (let key = 1; key <= 12; key++) {
    defs[`h${key}_line1`] = { name: `Command key ${key} — nome do objeto` }
    defs[`h${key}_line2`] = { name: `Command key ${key} — estado` }
    defs[`h${key}_led`] = { name: `Command key ${key} — LED aceso` }
    defs[`h${key}_color`] = { name: `Command key ${key} — cor do LED` }
  }

  return defs
}
