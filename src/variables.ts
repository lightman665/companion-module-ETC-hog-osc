import type { CompanionVariableDefinition } from '@companion-module/base'

/**
 * One variable per command-key field, indexed by physical key (1..12, offset
 * already resolved — see commandKeys.ts). Only h1-h12 are covered by this PR;
 * playback masters, encoder wheels, and named buttons follow in later PRs.
 */
export function getVariableDefinitions(): CompanionVariableDefinition[] {
  const defs: CompanionVariableDefinition[] = []

  for (let key = 1; key <= 12; key++) {
    defs.push(
      { variableId: `h${key}_line1`, name: `Command key ${key} — nome do objeto` },
      { variableId: `h${key}_line2`, name: `Command key ${key} — estado` },
      { variableId: `h${key}_led`, name: `Command key ${key} — LED aceso` },
      { variableId: `h${key}_color`, name: `Command key ${key} — cor do LED` },
    )
  }

  return defs
}
