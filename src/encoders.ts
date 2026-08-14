/**
 * Encoder wheels 1-5 (HOG_OSC_SPEC.md §3.4). Labels arrive fragmented over the
 * wire (truncated to 7 chars first, then the full value) - the module always
 * takes the latest received value, which falls out naturally here since each
 * message just overwrites the variable.
 */
export interface EncoderUpdate {
  encoder: number
  field: 'label' | 'value'
}

const ENCODER_PATH = /^\/hog\/status\/encoderwheel([1-5])\/(label|value)$/

export function parseEncoderPath(oscPath: string): EncoderUpdate | undefined {
  const match = ENCODER_PATH.exec(oscPath)
  if (!match) return undefined
  return { encoder: Number(match[1]), field: match[2] as 'label' | 'value' }
}
