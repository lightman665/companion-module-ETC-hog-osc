import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseNamedButtonPath, toVariableId } from '../src/namedButtons.js'

test('parses a simple named-button led path', () => {
  assert.deepEqual(parseNamedButtonPath('/hog/status/led/blind'), { button: 'blind', field: 'led' })
})

test('parses a simple named-button color path', () => {
  assert.deepEqual(parseNamedButtonPath('/hog/status/led/blindcolor'), { button: 'blind', field: 'color' })
})

test('handles button names that contain a literal space', () => {
  assert.deepEqual(parseNamedButtonPath('/hog/status/led/thruster upper'), {
    button: 'thruster upper',
    field: 'led',
  })
  assert.deepEqual(parseNamedButtonPath('/hog/status/led/go backcolor'), {
    button: 'go back',
    field: 'color',
  })
})

test('does not collide with command-key or master paths', () => {
  assert.equal(parseNamedButtonPath('/hog/status/led/h2'), undefined)
  assert.equal(parseNamedButtonPath('/hog/status/led/h2color'), undefined)
  assert.equal(parseNamedButtonPath('/hog/status/led/go/1'), undefined)
})

test('rejects unrelated paths', () => {
  assert.equal(parseNamedButtonPath('/hog/system/time'), undefined)
  assert.equal(parseNamedButtonPath('/hog/status/commandline'), undefined)
})

test('toVariableId replaces spaces with underscores', () => {
  assert.equal(toVariableId('thruster upper'), 'thruster_upper')
  assert.equal(toVariableId('go back'), 'go_back')
  assert.equal(toVariableId('blind'), 'blind')
})
