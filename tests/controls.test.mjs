import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let CalculationPanel
let ReportControls
let ResistanceSlider

before(async () => {
  server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' })
  CalculationPanel = (await server.ssrLoadModule('/src/components/CalculationPanel.jsx')).default
  ReportControls = (await server.ssrLoadModule('/src/components/ReportControls.jsx')).default
  ResistanceSlider = (await server.ssrLoadModule('/src/components/ResistanceSlider.jsx')).default
})
after(async () => { await server?.close() })

const observations = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1, voltage: index + 2, r1: 1, r2: 2.5, r3: 5,
}))
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))
const tagWithId = (markup, tag, id) => markup.match(new RegExp(`<${tag}[^>]*id="${id}"[^>]*>`))?.[0]

test('even five readings keep values hidden and the dropdown disabled until Calculate', () => {
  const markup = render(CalculationPanel, { observations })
  assert.match(tagWithId(markup, 'select', 'calculation-reading-select'), /disabled=""/)
  assert.doesNotMatch(markup, /Reading 1 · Vs/)
  for (const key of ['r1', 'r2', 'r3']) {
    assert.match(tagWithId(markup, 'input', `recorded-${key}`), /value=""/)
    assert.match(tagWithId(markup, 'input', `formula-${key}`), /disabled=""/)
  }
})

test('Calculate enables selection and displays the recorded resistance values', () => {
  const markup = render(CalculationPanel, { calculationStarted: true, observations })
  assert.doesNotMatch(tagWithId(markup, 'select', 'calculation-reading-select'), /disabled/)
  for (const [key, value] of [['r1', 1], ['r2', 2.5], ['r3', 5]]) {
    assert.match(tagWithId(markup, 'input', `recorded-${key}`), new RegExp(`value="${value}"`))
    assert.match(tagWithId(markup, 'input', `formula-${key}`), /step="0.1"/)
  }
  assert.match(tagWithId(markup, 'input', 'formula-i1'), /step="0.001"/)
})

test('Calculate cannot unlock verification with insufficient readings', () => {
  const markup = render(CalculationPanel, { calculationStarted: true, observations: observations.slice(0, 2) })
  assert.match(tagWithId(markup, 'select', 'calculation-reading-select'), /disabled=""/)
})

test('report stays disabled until readings and verification are complete', () => {
  for (const [readingCount, graphGenerated, disabled] of [[0, false, true], [5, false, true], [2, true, true], [3, true, false]]) {
    const markup = render(ReportControls, { readingCount, graphGenerated, minReadings: 3 })
    assert.equal(tagWithId(markup, 'button', 'generate-report-button').includes('disabled'), disabled)
  }
})

test('each resistance slider accepts 1 with increments of one decimal place', () => {
  for (const label of ['R1', 'R2', 'R3']) {
    const markup = render(ResistanceSlider, { label, value: 1 })
    const input = tagWithId(markup, 'input', `${label}-slider`)
    assert.match(input, /min="1"/)
    assert.match(input, /max="5"/)
    assert.match(input, /step="0.1"/)
    assert.match(input, /value="1"/)
  }
})
