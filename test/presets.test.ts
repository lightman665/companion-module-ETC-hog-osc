import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getPresetDefinitions, getPresetStructure } from '../src/presets.js'

test('creates a preset for all 12 command keys plus func', () => {
  const presets = getPresetDefinitions()
  for (let key = 1; key <= 12; key++) {
    assert.ok(presets[`command_key_${key}`], `missing preset for command_key_${key}`)
  }
  assert.ok(presets.func)
})

test('command key presets use the +1-offset-free key option and the LED feedback', () => {
  const presets = getPresetDefinitions()
  const preset = presets.command_key_5 as any
  assert.equal(preset.steps[0].down[0].actionId, 'press_command_key')
  assert.equal(preset.steps[0].down[0].options.key, 5)
  assert.equal(preset.feedbacks[0].feedbackId, 'command_key_led')
  assert.equal(preset.feedbacks[0].options.key, 5)
})

test('every preset id referenced by the structure exists in the definitions', () => {
  const presets = getPresetDefinitions()
  const structure = getPresetStructure()
  for (const section of structure) {
    for (const id of section.definitions as string[]) {
      assert.ok(presets[id], `structure references missing preset id "${id}"`)
    }
  }
})
