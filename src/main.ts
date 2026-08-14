import { InstanceBase, InstanceStatus, type SharedUdpSocket, type SomeCompanionConfigField } from '@companion-module/base'
import { DEFAULT_CONFIG, getConfigFields, type HogConfig } from './config.js'
import { getVariableDefinitions } from './variables.js'
import { decodeOscMessage } from './osc.js'
import { parseCommandKeyPath } from './commandKeys.js'
import { parseNamedButtonPath, toVariableId } from './namedButtons.js'
import { parseMasterPath } from './masters.js'
import { parseEncoderPath } from './encoders.js'
import { SYSTEM_PATH_VARIABLES } from './systemPaths.js'
import { createActionDefinitions } from './actions.js'
import { createFeedbackDefinitions } from './feedbacks.js'
import { getPresetDefinitions, getPresetStructure } from './presets.js'
import { HogState } from './state.js'
import type { HogInstanceTypes } from './instanceTypes.js'

class HogOscInstance extends InstanceBase<HogInstanceTypes> {
  private config: HogConfig = DEFAULT_CONFIG
  private readonly state = new HogState()
  private socket: SharedUdpSocket | undefined

  async init(config: HogConfig): Promise<void> {
    this.config = config
    this.setVariableDefinitions(getVariableDefinitions())
    this.setActionDefinitions(createActionDefinitions((path, value) => this.sendToConsole(path, value)))
    this.setFeedbackDefinitions(createFeedbackDefinitions((variableId) => this.getVariableValue(variableId)))
    this.setPresetDefinitions(getPresetStructure(), getPresetDefinitions())
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
      this.log('error', `UDP socket error: ${err.message}`)
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

  private sendToConsole(path: string, value: number | string): void {
    this.oscSend(this.config.host, this.config.sendPort, path, value)
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
      this.checkFeedbacks('command_key_led')
      return
    }

    const namedButton = parseNamedButtonPath(message.address)
    if (namedButton) {
      this.setVariableValues({
        [`${toVariableId(namedButton.button)}_${namedButton.field}`]: value,
      })
      this.checkFeedbacks('named_button_led')
      return
    }

    const master = parseMasterPath(message.address)
    if (master) {
      const suffix = master.field === 'color' ? '_color' : ''
      this.setVariableValues({
        [`master${master.master}_${master.action}${suffix}`]: value,
      })
      return
    }

    const encoder = parseEncoderPath(message.address)
    if (encoder) {
      this.setVariableValues({
        [`encoder${encoder.encoder}_${encoder.field}`]: value,
      })
      if (encoder.field === 'label') {
        this.checkFeedbacks('open_key_held')
      }
      return
    }

    const systemVariable = SYSTEM_PATH_VARIABLES[message.address]
    if (systemVariable) {
      this.setVariableValues({ [systemVariable]: value })
    }
  }
}

export default HogOscInstance
