import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCommandKeyPath } from '../src/commandKeys.js'

test('individual key events carry a +1 offset (h2 -> physical key 1)', () => {
  assert.deepEqual(parseCommandKeyPath('/hog/status/h2/line1'), { physicalKey: 1, field: 'line1' })
  assert.deepEqual(parseCommandKeyPath('/hog/status/h13/line2'), { physicalKey: 12, field: 'line2' })
})

test('full-dump h1 is unambiguous and maps to physical key 1 with no offset', () => {
  assert.deepEqual(parseCommandKeyPath('/hog/status/h1/line1'), { physicalKey: 1, field: 'line1' })
})

test('led and color paths', () => {
  assert.deepEqual(parseCommandKeyPath('/hog/status/led/h2'), { physicalKey: 1, field: 'led' })
  assert.deepEqual(parseCommandKeyPath('/hog/status/led/h2color'), { physicalKey: 1, field: 'color' })
})

test('out-of-range wire keys are ignored', () => {
  assert.equal(parseCommandKeyPath('/hog/status/led/h14'), undefined)
  assert.equal(parseCommandKeyPath('/hog/status/led/h14color'), undefined)
  assert.equal(parseCommandKeyPath('/hog/status/led/h0'), undefined)
})

test('unrelated paths are ignored', () => {
  assert.equal(parseCommandKeyPath('/hog/system/time'), undefined)
  assert.equal(parseCommandKeyPath('/hog/status/led/go/1'), undefined)
})
