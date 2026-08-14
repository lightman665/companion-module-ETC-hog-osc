import {
  InstanceBase,
  InstanceStatus,
  type CompanionVariableValues,
  type InstanceTypes,
  type SharedUdpSocket,
  type SomeCompanionConfigField,
} from '@companion-module/base'
import { DEFAULT_CONFIG, getConfigFields, type HogConfig } from './config.js'
import { getVariableDefinitions } from './variables.js'
import { decodeOscMessage } from './osc.js'
import { parseCommandKeyPath } from './commandKeys.js'
import { parseNamedButtonPath, toVariableId } from './namedButtons.js'
import { parseMasterPath } from './masters.js'
import { HogState } from './state.js'

interface HogInstanceTypes extends InstanceTypes {
  config: HogConfig
  secrets: undefined
  actions: Record<string, never>
  feedbacks: Record<string, never>
  variables: CompanionVariableValues
}

class HogOscInstance extends InstanceBase<HogInstanceTypes> {
  private config: HogConfig = DEFAULT_CONFIG
  private readonly state = new HogState()
  private socket: SharedUdpSocket | undefined

  async init(config: HogConfig): Promise<void> {
    this.config = config
    this.setVariableDefinitions(getVariableDefinitions())
    this.startListening()
  }

  async configUpdated(config: HogConfig): Promise<void> {
    this.config = config
    this.stopListening()
    this.startListening()
  }

  async destroy(): Promise<void> {
    this.stopListening()
  }

  getConfigFields(): SomeCompanionConfigField[] {
    return getConfigFields()
  }

  private startListening(): void {
    this.updateStatus(InstanceStatus.Connecting)

    const socket = this.createSharedUdpSocket('udp4', (msg) => this.handleMessage(msg))
    socket.on('error', (err) => {
      this.log('error', `Erro no socket UDP: ${err.message}`)
      this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
    })
    socket.bind(this.config.listenPort, undefined, () => {
      this.updateStatus(InstanceStatus.Ok)
    })

    this.socket = socket
  }

  private stopListening(): void {
    this.socket?.close()
    this.socket = undefined
  }

  private handleMessage(buf: Buffer): void {
    const message = decodeOscMessage(buf)
    if (!message) return

    const value = message.args[0]
    if (value === undefined) return

    this.state.setRaw(message.address, value)

    const commandKey = parseCommandKeyPath(message.address)
    if (commandKey) {
      this.setVariableValues({
        [`h${commandKey.physicalKey}_${commandKey.field}`]: value,
      })
      return
    }

    const namedButton = parseNamedButtonPath(message.address)
    if (namedButton) {
      this.setVariableValues({
        [`${toVariableId(namedButton.button)}_${namedButton.field}`]: value,
      })
      return
    }

    const master = parseMasterPath(message.address)
    if (master) {
      const suffix = master.field === 'color' ? '_color' : ''
      this.setVariableValues({
        [`master${master.master}_${master.action}${suffix}`]: value,
      })
    }
  }
}

export default HogOscInstance
