import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface HogConfig {
  host: string
  sendPort: number
  listenPort: number
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
      label: 'Ligação',
      value:
        'A consola Hog envia de e recebe na mesma porta (ver HOG_OSC_SPEC.md §2). Só UDP é suportado — TCP não é viável (§7).',
    },
    {
      type: 'textinput',
      id: 'host',
      label: 'IP da consola',
      width: 6,
      default: DEFAULT_CONFIG.host,
      regex: Regex.IP,
    },
    {
      type: 'number',
      id: 'sendPort',
      label: 'Porta da consola (envio/receção)',
      width: 6,
      default: DEFAULT_CONFIG.sendPort,
      min: 1,
      max: 65535,
    },
    {
      type: 'number',
      id: 'listenPort',
      label: 'Porta de escuta do Companion',
      width: 6,
      default: DEFAULT_CONFIG.listenPort,
      min: 1,
      max: 65535,
    },
  ]
}
