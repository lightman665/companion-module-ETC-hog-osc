export interface OscMessage {
  address: string
  args: Array<string | number>
}

function readPaddedString(buf: Buffer, offset: number): { value: string; next: number } {
  let end = offset
  while (end < buf.length && buf[end] !== 0) end++
  const value = buf.toString('utf8', offset, end)
  const next = (end + 4) & ~3
  return { value, next }
}

/**
 * Decodes a single OSC message. Only 's' (string), 'f' (float32) and 'i' (int32)
 * type tags are supported — the only ones observed on the wire (see HOG_OSC_SPEC.md §3).
 */
export function decodeOscMessage(buf: Buffer): OscMessage | undefined {
  if (buf.length === 0 || buf[0] !== 0x2f /* '/' */) return undefined

  const { value: address, next: afterAddress } = readPaddedString(buf, 0)
  if (buf[afterAddress] !== 0x2c /* ',' */) return undefined

  const { value: typeTags, next: afterTypeTags } = readPaddedString(buf, afterAddress)
  const args: Array<string | number> = []
  let offset = afterTypeTags

  for (const tag of typeTags.slice(1)) {
    if (tag === 's') {
      const { value, next } = readPaddedString(buf, offset)
      args.push(value)
      offset = next
    } else if (tag === 'f') {
      args.push(buf.readFloatBE(offset))
      offset += 4
    } else if (tag === 'i') {
      args.push(buf.readInt32BE(offset))
      offset += 4
    } else {
      return undefined
    }
  }

  return { address, args }
}
