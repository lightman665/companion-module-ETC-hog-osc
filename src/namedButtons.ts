/**
 * Named front-panel buttons (HOG_OSC_SPEC.md §3.2). Each has a boolean LED
 * state and a color, at /hog/status/led/<name> and /hog/status/led/<name>color
 * (color suffix concatenated with no slash — §6). "thruster upper" and
 * "go back" contain a literal space in the OSC path.
 */
export const NAMED_BUTTONS = [
  'blind',
  'clear',
  'highlight',
  'macro',
  'ratedisabled',
  'dbo',
  'thruster upper',
  'intensity',
  'position',
  'colour',
  'beam',
  'effects',
  'time',
  'maingo',
  'mainhalt',
  'mainback',
  'play',
  'pause',
  'go back',
  'flash',
] as const

export type NamedButton = (typeof NAMED_BUTTONS)[number]

const NAMED_BUTTON_SET: ReadonlySet<string> = new Set(NAMED_BUTTONS)

/** Companion variable ids can't contain spaces, so "go back" -> "go_back". */
export function toVariableId(button: NamedButton): string {
  return button.replace(/ /g, '_')
}

export interface NamedButtonUpdate {
  button: NamedButton
  field: 'led' | 'color'
}

const LED_PREFIX = '/hog/status/led/'

export function parseNamedButtonPath(oscPath: string): NamedButtonUpdate | undefined {
  if (!oscPath.startsWith(LED_PREFIX)) return undefined
  const rest = oscPath.slice(LED_PREFIX.length)

  if (rest.endsWith('color')) {
    const name = rest.slice(0, -'color'.length)
    return NAMED_BUTTON_SET.has(name) ? { button: name as NamedButton, field: 'color' } : undefined
  }

  return NAMED_BUTTON_SET.has(rest) ? { button: rest as NamedButton, field: 'led' } : undefined
}
