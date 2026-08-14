import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface HogConfig {
  host: string
  sendPort: number
  listenPort: number
  [key: string]: string | number
}

export const DEFAULT_CONFIG: HogConfig = {
  host: '172.31.0.1',
  sendPort: 7000,
  listenPort: 7009,
}

export function getConfigFields(): SomeCompanionConfigField[] {
  return [
    {
      type: 'static-text',
      id: 'info',
      width: 12,
      label: 'Connection',
      value:
        'The Hog console sends and receives on the same port (see HOG_OSC_SPEC.md §2). Only UDP is supported — TCP is not viable (§7).',
    },
    {
      type: 'textinput',
      id: 'host',
      label: 'Console IP',
      width: 6,
      default: DEFAULT_CONFIG.host,
      regex: Regex.IP,
    },
    {
      type: 'number',
      id: 'sendPort',
      label: 'Console port (send/receive)',
      width: 6,
      default: DEFAULT_CONFIG.sendPort,
      min: 1,
      max: 65535,
    },
    {
      type: 'number',
      id: 'listenPort',
      label: 'Companion listen port',
      width: 6,
      default: DEFAULT_CONFIG.listenPort,
      min: 1,
      max: 65535,
    },
  ]
}
