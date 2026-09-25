import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getSpeechSegments, watchAudioCue } from '../src/aiGuide/narrationCue.js'

const { steps: [intro] } = JSON.parse(readFileSync(new URL('../src/aiGuide/aiGuideConfig.json', import.meta.url), 'utf8'))

test('the walkthrough highlight waits for its phrase in the recorded audio', () => {
  const audio = new EventTarget()
  const highlights = []
  audio.paused = false
  audio.currentTime = 0
  const cleanup = watchAudioCue(audio, intro.highlightCue, (target) => highlights.push(target))
  audio.dispatchEvent(new Event('playing'))
  audio.currentTime = intro.highlightCue.audioTime - 0.1
  audio.dispatchEvent(new Event('timeupdate'))
  assert.deepEqual(highlights, [])

  audio.currentTime = intro.highlightCue.audioTime
  audio.dispatchEvent(new Event('timeupdate'))
  audio.dispatchEvent(new Event('timeupdate'))
  assert.deepEqual(highlights, ['#walkthrough-start-button'])
  cleanup()
})

test('stopping narration before its cue prevents a delayed highlight', () => {
  const audio = new EventTarget()
  const highlights = []
  audio.currentTime = 0
  audio.paused = false
  const cleanup = watchAudioCue(audio, intro.highlightCue, (target) => highlights.push(target))
  cleanup()
  audio.currentTime = 17
  audio.dispatchEvent(new Event('timeupdate'))
  assert.deepEqual(highlights, [])
})

test('speech synthesis highlights only when the final instruction starts', () => {
  const segments = getSpeechSegments(intro.text, intro.highlightCue)
  assert.equal(segments.length, 2)
  assert.equal(segments[0].highlightTarget, undefined)
  assert.equal(segments[1].text, 'To start, click on the start walkthrough.')
  assert.equal(segments[1].highlightTarget, '#walkthrough-start-button')
})

test('narration without a matching cue stays intact', () => {
  assert.deepEqual(getSpeechSegments('Check the connections.', intro.highlightCue), [{ text: 'Check the connections.' }])
})
