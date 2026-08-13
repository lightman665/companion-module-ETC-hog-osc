import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import dgram from 'node:dgram'
import { DEFAULT_CONFIG, getConfigFields, type HogConfig } from './config.js'
import { getVariableDefinitions } from './variables.js'
import { decodeOscMessage } from './osc.js'
import { parseCommandKeyPath } from './commandKeys.js'
import { HogState } from './state.js'

class HogOscInstance extends InstanceBase<HogConfig> {
  private config: HogConfig = DEFAULT_CONFIG
  private readonly state = new HogState()
  private socket: dgram.Socket | undefined

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

    const socket = dgram.createSocket('udp4')
    socket.on('error', (err) => {
      this.log('error', `Erro no socket UDP: ${err.message}`)
      this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
    })
    socket.on('message', (msg) => this.handleMessage(msg))
    socket.bind(this.config.listenPort, () => {
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
    }
  }
}

runEntrypoint(HogOscInstance, [])
