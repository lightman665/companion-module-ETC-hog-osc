import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createFeedbackDefinitions } from '../src/feedbacks.js'

function fakeFeedback(options: Record<string, unknown>) {
  return { options } as any
}

test('command_key_led is true when LED is on and the key is actually assigned', () => {
  const values: Record<string, unknown> = { h3_led: 1, h3_line1: 'Cuelist 3', h3_line2: '' }
  const feedbacks = createFeedbackDefinitions((id) => values[id])
  const result = (feedbacks.command_key_led as any).callback(fakeFeedback({ key: 3 }), {})
  assert.equal(result, true)
})

test('command_key_led is false when off or unset', () => {
  const values: Record<string, unknown> = { h1_led: 0 }
  const feedbacks = createFeedbackDefinitions((id) => values[id])

  assert.equal((feedbacks.command_key_led as any).callback(fakeFeedback({ key: 1 }), {}), false)
  assert.equal((feedbacks.command_key_led as any).callback(fakeFeedback({ key: 9 }), {}), false)
})

test('command_key_led is false when LED is on but line1/line2 are empty (deleted key)', () => {
  // A burst-timing edge case (§12): the LED variable can briefly stay 1 after
  // a key is deleted, before/without the console re-sending it as 0.
  const values: Record<string, unknown> = { h4_led: 1, h4_line1: '', h4_line2: '' }
  const feedbacks = createFeedbackDefinitions((id) => values[id])

  assert.equal((feedbacks.command_key_led as any).callback(fakeFeedback({ key: 4 }), {}), false)
})

test('named_button_led is true when the button led variable is 1', () => {
  const values: Record<string, unknown> = { blind_led: 1, clear_led: 0, go_back_led: 1 }
  const feedbacks = createFeedbackDefinitions((id) => values[id])

  assert.equal((feedbacks.named_button_led as any).callback(fakeFeedback({ button: 'blind' }), {}), true)
  assert.equal((feedbacks.named_button_led as any).callback(fakeFeedback({ button: 'clear' }), {}), false)
})

test('named_button_led handles button names with spaces via toVariableId', () => {
  const values: Record<string, unknown> = { go_back_led: 1 }
  const feedbacks = createFeedbackDefinitions((id) => values[id])

  assert.equal((feedbacks.named_button_led as any).callback(fakeFeedback({ button: 'go back' }), {}), true)
})
