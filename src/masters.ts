/**
 * Playback masters 0-35 (HOG_OSC_SPEC.md §3.3). go/pause/goback/flash each
 * have a led + color variant; choose has no documented color variant, so a
 * stray "choose...color" message is treated as unrecognized rather than
 * silently defining an undeclared variable.
 */
export const MASTER_COUNT = 36
export const MASTER_ACTIONS_WITH_COLOR = ['go', 'pause', 'goback', 'flash'] as const
export type MasterActionWithColor = (typeof MASTER_ACTIONS_WITH_COLOR)[number]
export type MasterAction = MasterActionWithColor | 'choose'

export interface MasterUpdate {
  master: number
  action: MasterAction
  field: 'led' | 'color'
}

const MASTER_LED_PATH = /^\/hog\/status\/led\/(go|pause|goback|flash|choose)\/(\d+)(color)?$/

export function parseMasterPath(oscPath: string): MasterUpdate | undefined {
  const match = MASTER_LED_PATH.exec(oscPath)
  if (!match) return undefined

  const action = match[1] as MasterAction
  const master = Number(match[2])
  const isColor = Boolean(match[3])

  if (master < 0 || master >= MASTER_COUNT) return undefined
  if (isColor && action === 'choose') return undefined

  return { master, action, field: isColor ? 'color' : 'led' }
}
