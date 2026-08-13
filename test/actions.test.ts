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

test('press/release hardware button also works for the new manual-sourced buttons', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.press_hardware_button as any).callback(fakeAction({ button: 'record' }), {})
  ;(actions.release_hardware_button as any).callback(fakeAction({ button: 'next' }), {})
  assert.deepEqual(sent, [
    ['/hog/hardware/record', 1],
    ['/hog/hardware/next', 0],
  ])
})

test('press/release hardware button works for the unverified "open" guess', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.press_hardware_button as any).callback(fakeAction({ button: 'open' }), {})
  ;(actions.release_hardware_button as any).callback(fakeAction({ button: 'open' }), {})
  assert.deepEqual(sent, [
    ['/hog/hardware/open', 1],
    ['/hog/hardware/open', 0],
  ])
})

test('select_all_in_programmer sends the Back+Next chord', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.press_select_all_in_programmer as any).callback(fakeAction({}), {})
  ;(actions.release_select_all_in_programmer as any).callback(fakeAction({}), {})
  assert.deepEqual(sent, [
    ['/hog/hardware/back', 1],
    ['/hog/hardware/next', 1],
    ['/hog/hardware/back', 0],
    ['/hog/hardware/next', 0],
  ])
})

test('press/release u_key sends the unoffset u<N> path', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.press_u_key as any).callback(fakeAction({ key: 1 }), {})
  ;(actions.release_u_key as any).callback(fakeAction({ key: 12 }), {})
  assert.deepEqual(sent, [
    ['/hog/hardware/u1', 1],
    ['/hog/hardware/u12', 0],
  ])
})

test('release_playback_item sends the item number to the right typed path', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.release_playback_item as any).callback(fakeAction({ itemType: 1, number: 7 }), {})
  assert.deepEqual(sent, [['/hog/playback/release/1', 7]])
})
