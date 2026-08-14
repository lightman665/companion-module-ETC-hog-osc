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

test('press/release hardware button also works for the newly-added programming keys', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.press_hardware_button as any).callback(fakeAction({ button: 'delete' }), {})
  ;(actions.release_hardware_button as any).callback(fakeAction({ button: 'setup' }), {})
  assert.deepEqual(sent, [
    ['/hog/hardware/delete', 1],
    ['/hog/hardware/setup', 0],
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

test('press/release master_key sends the /hog/hardware/<key>/<master> path', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.press_master_key as any).callback(fakeAction({ key: 'go', master: 0 }), {})
  ;(actions.release_master_key as any).callback(fakeAction({ key: 'pause', master: 4 }), {})
  assert.deepEqual(sent, [
    ['/hog/hardware/go/0', 1],
    ['/hog/hardware/pause/4', 0],
  ])
})

test('release_playback_item sends the item number to the right typed path', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.release_playback_item as any).callback(fakeAction({ itemType: 1, number: 7 }), {})
  assert.deepEqual(sent, [['/hog/playback/release/1', 7]])
})

test('go/halt/resume_playback_item send the item number to the right typed path', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.go_playback_item as any).callback(fakeAction({ itemType: 0, number: 3 }), {})
  ;(actions.halt_playback_item as any).callback(fakeAction({ itemType: 0, number: 3 }), {})
  ;(actions.resume_playback_item as any).callback(fakeAction({ itemType: 0, number: 3 }), {})
  assert.deepEqual(sent, [
    ['/hog/playback/go/0', 3],
    ['/hog/playback/halt/0', 3],
    ['/hog/playback/resume/0', 3],
  ])
})

test('set_grand_master_fader sends the level to /hog/hardware/fader/0', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.set_grand_master_fader as any).callback(fakeAction({ level: 128 }), {})
  assert.deepEqual(sent, [['/hog/hardware/fader/0', 128]])
})

test('set_encoder_wheel sends the value to /hog/hardware/encoderwheel/<N>', () => {
  const sent: Array<[string, number]> = []
  const actions = createActionDefinitions((path, value) => sent.push([path, value]))
  ;(actions.set_encoder_wheel as any).callback(fakeAction({ wheel: 3, value: -10 }), {})
  assert.deepEqual(sent, [['/hog/hardware/encoderwheel/3', -10]])
})
