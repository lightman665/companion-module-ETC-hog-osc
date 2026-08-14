import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseEncoderPath } from '../src/encoders.js'

test('parses label and value paths for each encoder', () => {
  assert.deepEqual(parseEncoderPath('/hog/status/encoderwheel1/label'), { encoder: 1, field: 'label' })
  assert.deepEqual(parseEncoderPath('/hog/status/encoderwheel5/value'), { encoder: 5, field: 'value' })
})

test('rejects out-of-range encoders', () => {
  assert.equal(parseEncoderPath('/hog/status/encoderwheel0/label'), undefined)
  assert.equal(parseEncoderPath('/hog/status/encoderwheel6/label'), undefined)
})

test('rejects unrelated paths', () => {
  assert.equal(parseEncoderPath('/hog/status/h2/line1'), undefined)
  assert.equal(parseEncoderPath('/hog/system/time'), undefined)
})
