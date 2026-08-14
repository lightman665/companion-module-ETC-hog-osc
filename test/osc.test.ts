import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeOscMessage } from '../src/osc.js'

function encodeString(s: string): Buffer {
  const raw = Buffer.from(s + '\0', 'utf8')
  const padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4)
  raw.copy(padded)
  return padded
}

function encodeFloatMessage(address: string, values: number[]): Buffer {
  const parts = [encodeString(address), encodeString(',' + 'f'.repeat(values.length))]
  for (const v of values) {
    const b = Buffer.alloc(4)
    b.writeFloatBE(v)
    parts.push(b)
  }
  return Buffer.concat(parts)
}

function encodeStringMessage(address: string, value: string): Buffer {
  return Buffer.concat([encodeString(address), encodeString(',s'), encodeString(value)])
}

test('decodes a float argument', () => {
  const buf = encodeFloatMessage('/hog/status/led/h2', [1])
  assert.deepEqual(decodeOscMessage(buf), { address: '/hog/status/led/h2', args: [1] })
})

test('decodes a string argument', () => {
  const buf = encodeStringMessage('/hog/system/time', '12:34:56')
  assert.deepEqual(decodeOscMessage(buf), { address: '/hog/system/time', args: ['12:34:56'] })
})

test('decodes an address with no arguments', () => {
  const buf = Buffer.concat([encodeString('/hog/status/commandline'), encodeString(',')])
  assert.deepEqual(decodeOscMessage(buf), { address: '/hog/status/commandline', args: [] })
})

test('rejects buffers that are not OSC messages', () => {
  assert.equal(decodeOscMessage(Buffer.from('not osc')), undefined)
  assert.equal(decodeOscMessage(Buffer.alloc(0)), undefined)
})
