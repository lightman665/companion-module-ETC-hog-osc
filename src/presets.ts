import {
  combineRgb,
  type CompanionLayeredButtonPresetDefinition,
  type CompanionPresetDefinitions,
  type CompanionPresetSection,
} from '@companion-module/base'
import type { HogInstanceTypes } from './instanceTypes.js'
import { PIG_ICON_BASE64 } from './pigIcon.js'

/**
 * Reproduces the layout hand-built and confirmed in Companion during this
 * session: blue-grey text (the RECORD button's reference color, 4210943),
 * pushed down 10% so it never overlaps the top-right feedback dot, fontsize
 * 23 for single-line buttons. The per-button active-state feedback colors
 * below (blind/clear/highlight) are copied from the confirmed live config,
 * not guessed.
 */
const KEY_TEXT_COLOR = 4210943
const LED_ON_COLOR = combineRgb(0, 255, 0)
const LINE2BG_ACTIVE_COLOR = 2105376

/**
 * Essential presets so a user has working buttons without configuring
 * actions/feedbacks/style by hand: the 12 command keys (two-line layout with
 * LED feedback, matching Command Key 1's hand-tuned layout from this
 * session), the FUNC hardware button with its command-page indicator
 * (HOG_OSC_SPEC.md §11 - the working alternative to Command Key 12), and the
 * most commonly used named/hardware buttons (Pig, Blind, Clear, Highlight,
 * Release).
 */
export function getPresetDefinitions(): CompanionPresetDefinitions<HogInstanceTypes> {
  const presets: CompanionPresetDefinitions<HogInstanceTypes> = {}

  for (let key = 1; key <= 12; key++) {
    presets[`command_key_${key}`] = {
      type: 'layered',
      name: `Command Key ${key}`,
      elements: [
        { id: 'bg', type: 'box', x: 0, y: 0, width: 100, height: 100, color: 0 },
        { id: 'line2bg', type: 'box', x: 0, y: 65, width: 100, height: 50, color: 0 },
        {
          id: 'line1',
          type: 'text',
          x: 0,
          y: 15,
          width: 100,
          height: 40,
          text: `$(hog-osc:h${key}_line1)`,
          fontsize: 65,
          fontsizeAllowShrink: true,
          color: combineRgb(255, 255, 255),
          halign: 'center',
          valign: 'top',
        },
        {
          id: 'line2',
          type: 'text',
          x: 0,
          y: 60,
          width: 100,
          height: 40,
          text: `$(hog-osc:h${key}_line2)`,
          fontsize: 50,
          fontsizeAllowShrink: true,
          color: combineRgb(255, 255, 255),
          halign: 'center',
          valign: 'center',
        },
        { id: 'dot', type: 'box', x: 82, y: 3, width: 8, height: 8, color: 0, opacity: 0 },
      ],
      steps: [
        {
          down: [{ actionId: 'press_command_key', options: { key } }],
          up: [{ actionId: 'release_command_key', options: { key } }],
        },
      ],
      feedbacks: [
        {
          feedbackId: 'command_key_led',
          options: { key },
          styleOverrides: [
            { elementId: 'dot', elementProperty: 'opacity', override: 100 },
            { elementId: 'dot', elementProperty: 'color', override: LED_ON_COLOR },
            { elementId: 'line2bg', elementProperty: 'color', override: LINE2BG_ACTIVE_COLOR },
          ],
        },
      ],
    }
  }

  presets.func = {
    type: 'layered',
    name: 'FUNC (command page change)',
    elements: [
      { id: 'bg', type: 'box', x: 0, y: 0, width: 100, height: 100, color: 0 },
      {
        id: 'main',
        type: 'text',
        x: 0,
        y: 10,
        width: 100,
        height: 100,
        text: 'FUNC',
        fontsize: 23,
        fontsizeAllowShrink: true,
        color: KEY_TEXT_COLOR,
        halign: 'center',
        valign: 'top',
      },
      {
        id: 'indicator',
        type: 'text',
        x: 0,
        y: 72,
        width: 100,
        height: 26,
        text: '$(hog-osc:h12_line2)',
        fontsize: 90,
        fontsizeAllowShrink: true,
        color: KEY_TEXT_COLOR,
        halign: 'center',
        valign: 'center',
      },
    ],
    steps: [
      {
        down: [{ actionId: 'press_hardware_button', options: { button: 'func' } }],
        up: [{ actionId: 'release_hardware_button', options: { button: 'func' } }],
      },
    ],
    feedbacks: [],
  }

  function simpleKeyPreset(label: string, button: string): CompanionLayeredButtonPresetDefinition<HogInstanceTypes> {
    return {
      type: 'layered',
      name: label,
      elements: [
        { id: 'bg', type: 'box', x: 0, y: 0, width: 100, height: 100, color: 0 },
        {
          id: 'main',
          type: 'text',
          x: 0,
          y: 10,
          width: 100,
          height: 100,
          text: label.toUpperCase(),
          fontsize: 23,
          fontsizeAllowShrink: true,
          color: KEY_TEXT_COLOR,
          halign: 'center',
          valign: 'top',
        },
      ],
      steps: [
        {
          down: [{ actionId: 'press_hardware_button', options: { button } }],
          up: [{ actionId: 'release_hardware_button', options: { button } }],
        },
      ],
      feedbacks: [],
    }
  }

  // Pig: the flying-pig glyph used on the console's own Pig key, not text.
  presets.pig = {
    type: 'layered',
    name: 'Pig',
    elements: [
      { id: 'bg', type: 'box', x: 0, y: 0, width: 100, height: 100, color: 0 },
      {
        id: 'img',
        type: 'image',
        x: 7,
        y: 7,
        width: 85,
        height: 85,
        base64Image: PIG_ICON_BASE64,
        halign: 'center',
        valign: 'top',
        fillMode: 'fit',
      },
    ],
    steps: [
      {
        down: [{ actionId: 'press_hardware_button', options: { button: 'pig' } }],
        up: [{ actionId: 'release_hardware_button', options: { button: 'pig' } }],
      },
    ],
    feedbacks: [],
  }

  presets.release = simpleKeyPreset('Release', 'release')

  // Active-state colors below are copied from the confirmed, hand-tuned
  // buttons in this session's Companion config - not guessed.
  const namedButtonsWithLed: {
    id: 'blind' | 'clear' | 'highlight'
    label: string
    activeBg: number
    activeText?: number
  }[] = [
    { id: 'blind', label: 'Blind', activeBg: combineRgb(0, 0, 255), activeText: combineRgb(255, 255, 255) },
    { id: 'clear', label: 'Clear', activeBg: combineRgb(255, 0, 0), activeText: combineRgb(255, 255, 255) },
    { id: 'highlight', label: 'Highlight', activeBg: combineRgb(255, 255, 255) },
  ]

  for (const button of namedButtonsWithLed) {
    const preset = simpleKeyPreset(button.label, button.id)
    const styleOverrides = [{ elementId: 'bg', elementProperty: 'color', override: button.activeBg }]
    if (button.activeText !== undefined) {
      styleOverrides.push({ elementId: 'main', elementProperty: 'color', override: button.activeText })
    }
    preset.feedbacks = [
      {
        feedbackId: 'named_button_led',
        options: { button: button.id },
        styleOverrides,
      },
    ]
    presets[button.id] = preset
  }

  return presets
}

export function getPresetStructure(): CompanionPresetSection<HogInstanceTypes>[] {
  return [
    {
      id: 'command_keys',
      name: 'Command Keys',
      definitions: [...Array.from({ length: 12 }, (_, i) => `command_key_${i + 1}`), 'func'],
    },
    {
      id: 'hardware_buttons',
      name: 'Hardware Buttons',
      definitions: ['pig', 'release', 'blind', 'clear', 'highlight'],
    },
  ]
}
