import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMasterPath } from '../src/masters.js'

test('parses go/pause/goback/flash led paths', () => {
  assert.deepEqual(parseMasterPath('/hog/status/led/go/0'), { master: 0, action: 'go', field: 'led' })
  assert.deepEqual(parseMasterPath('/hog/status/led/pause/35'), { master: 35, action: 'pause', field: 'led' })
  assert.deepEqual(parseMasterPath('/hog/status/led/goback/12'), { master: 12, action: 'goback', field: 'led' })
  assert.deepEqual(parseMasterPath('/hog/status/led/flash/7'), { master: 7, action: 'flash', field: 'led' })
})

test('parses go/pause/goback/flash color paths', () => {
  assert.deepEqual(parseMasterPath('/hog/status/led/gocolor/0'), undefined)
  assert.deepEqual(parseMasterPath('/hog/status/led/go/0color'), { master: 0, action: 'go', field: 'color' })
})

test('parses choose led paths, but not choose color', () => {
  assert.deepEqual(parseMasterPath('/hog/status/led/choose/5'), { master: 5, action: 'choose', field: 'led' })
  assert.equal(parseMasterPath('/hog/status/led/choose/5color'), undefined)
})

test('rejects out-of-range masters', () => {
  assert.equal(parseMasterPath('/hog/status/led/go/36'), undefined)
  assert.equal(parseMasterPath('/hog/status/led/go/-1'), undefined)
})

test('rejects unrelated paths', () => {
  assert.equal(parseMasterPath('/hog/status/led/h2'), undefined)
  assert.equal(parseMasterPath('/hog/status/led/blind'), undefined)
})
