export const watchAudioCue = (audio, cue, onCue) => {
  if (!cue?.target || !Number.isFinite(cue.audioTime)) return () => {}

  let triggered = false
  const checkPosition = () => {
    if (!triggered && !audio.paused && audio.currentTime >= cue.audioTime) {
      triggered = true
      onCue(cue.target)
    }
  }
  const events = ['playing', 'timeupdate', 'seeked']
  events.forEach((event) => audio.addEventListener(event, checkPosition))

  return () => events.forEach((event) => audio.removeEventListener(event, checkPosition))
}

export const getSpeechSegments = (text, cue) => {
  const cueIndex = cue?.target && cue?.phrase
    ? text.toLowerCase().indexOf(cue.phrase.toLowerCase())
    : -1

  if (cueIndex < 0) return [{ text }]

  return [
    { text: text.slice(0, cueIndex).trim() },
    { text: text.slice(cueIndex).trim(), highlightTarget: cue.target },
  ].filter((segment) => segment.text)
}
