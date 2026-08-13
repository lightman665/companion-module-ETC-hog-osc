import type { DropdownChoice } from '@companion-module/base'

const LINE_PATH = /^\/hog\/status\/h(\d+)\/(line[12])$/
const LED_PATH = /^\/hog\/status\/led\/h(\d+)(color)?$/

export const COMMAND_KEY_CHOICES: DropdownChoice[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  label: `Command Key ${i + 1}`,
}))

export type CommandKeyField = 'line1' | 'line2' | 'led' | 'color'

export interface CommandKeyUpdate {
  physicalKey: number
  field: CommandKeyField
}

/**
 * Hog OS uses two different numbering schemes for command keys depending on how
 * the update was triggered (HOG_OSC_SPEC.md §5):
 *  - Individual key events carry a +1 offset: physical key N arrives as h(N+1),
 *    so the wire range for events is h2..h13 covering physical keys 1..12.
 *  - A full state dump (log off + relaunch) carries h1..h12 with NO offset.
 * Individual events never produce "h1" on the wire, so an incoming h1 is
 * unambiguous — it can only be the un-offset dump value for physical key 1.
 */
export function parseCommandKeyPath(oscPath: string): CommandKeyUpdate | undefined {
  let wireKey: number
  let field: CommandKeyField

  const lineMatch = LINE_PATH.exec(oscPath)
  if (lineMatch) {
    wireKey = Number(lineMatch[1])
    field = lineMatch[2] as 'line1' | 'line2'
  } else {
    const ledMatch = LED_PATH.exec(oscPath)
    if (!ledMatch) return undefined
    wireKey = Number(ledMatch[1])
    field = ledMatch[2] ? 'color' : 'led'
  }

  const physicalKey = wireKey === 1 ? 1 : wireKey - 1
  if (physicalKey < 1 || physicalKey > 12) return undefined

  return { physicalKey, field }
}

/**
 * The +1 offset applies to sending too (§5: "Aplica-se tanto ao envio... como
 * à receção"). Unlike parseCommandKeyPath, there's no h1 special case here -
 * a simulated press is never ambiguous the way an incoming full-dump is.
 */
export function toWireKey(physicalKey: number): number {
  return physicalKey + 1
}
