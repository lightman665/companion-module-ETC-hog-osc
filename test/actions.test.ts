import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createActionDefinitions } from '../src/actions.js'

function fakeAction(options: Record<string, unknown>) {
  return { options } as any
}

test('press_command_key applies the +1 wire offset', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  // physical key 1 -> wire h2, per HOG_OSC_SPEC.md §5
  ;(actions.press_command_key as any).callback(fakeAction({ key: 1 }), {})
  assert.deepEqual(sent, [['/hog/hardware/h2', 1]])
})

test('release_command_key sends 0 with the same offset', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.release_command_key as any).callback(fakeAction({ key: 5 }), {})
  assert.deepEqual(sent, [['/hog/hardware/h6', 0]])
})

test('press/release hardware button sends the raw button name', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.press_hardware_button as any).callback(fakeAction({ button: 'blind' }), {})
  ;(actions.release_hardware_button as any).callback(fakeAction({ button: 'pig' }), {})
  assert.deepEqual(sent, [
    ['/hog/hardware/blind', 1],
    ['/hog/hardware/pig', 0],
  ])
})

test('release_playback_item sends the item number to the right typed path', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.release_playback_item as any).callback(fakeAction({ itemType: 1, number: 7 }), {})
  assert.deepEqual(sent, [['/hog/playback/release/1', 7]])
})
