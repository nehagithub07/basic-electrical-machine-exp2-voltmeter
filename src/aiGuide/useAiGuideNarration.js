import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import defaultAiGuideConfig from './aiGuideConfig.json'
import { isConfiguredAudioSource, loadAiGuideConfig } from './aiGuideConfigLoader.js'
import { addExclusiveAudioListener, dispatchExclusiveAudioStart } from '../utils/audioCoordinator.js'

const AI_GUIDE_AUDIO_SOURCE_ID = 'ai-guide'

const canUseSpeechSynthesis = () => (
  typeof window !== 'undefined'
  && typeof window.speechSynthesis !== 'undefined'
  && typeof window.SpeechSynthesisUtterance !== 'undefined'
)

const getSpeechLang = (locale) => {
  if (!locale) {
    return 'en-US'
  }

  return locale.includes('-') ? locale : `${locale}-US`
}

export const useAiGuideNarration = ({
  config = defaultAiGuideConfig,
  locale,
  onError,
  onFinish,
  onStart,
} = {}) => {
  const guideConfig = useMemo(
    () => loadAiGuideConfig(config, locale ?? config?.defaultLocale),
    [config, locale],
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeStepId, setActiveStepId] = useState(null)
  const isActiveRef = useRef(false)
  const currentPlaybackRef = useRef(null)
  const lastStepIdRef = useRef(null)
  const pendingStepIdsRef = useRef([])
  const progressRunIdRef = useRef(0)
  const runIdRef = useRef(0)

  const stopCurrentPlayback = useCallback(() => {
    const currentPlayback = currentPlaybackRef.current

    if (!currentPlayback) {
      return
    }

    currentPlaybackRef.current = null
    currentPlayback.stop()
  }, [])

  const stop = useCallback(({ resetProgress = false } = {}) => {
    isActiveRef.current = false
    runIdRef.current += 1
    stopCurrentPlayback()

    if (resetProgress) {
      progressRunIdRef.current += 1
      lastStepIdRef.current = null
      pendingStepIdsRef.current = []
    }

    setActiveStepId(null)
    setIsPlaying(false)
  }, [stopCurrentPlayback])

  const speakText = useCallback((text) => new Promise((resolve, reject) => {
    if (!canUseSpeechSynthesis()) {
      reject(new Error('Speech synthesis is not available in this browser.'))
      return
    }

    dispatchExclusiveAudioStart(AI_GUIDE_AUDIO_SOURCE_ID)
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    let settled = false

    const settle = (callback) => {
      if (settled) {
        return
      }

      settled = true
      utterance.onend = null
      utterance.onerror = null

      if (currentPlaybackRef.current?.utterance === utterance) {
        currentPlaybackRef.current = null
      }

      callback()
    }

    utterance.lang = getSpeechLang(guideConfig.locale)
    utterance.rate = 0.95
    utterance.pitch = 1

    utterance.onend = () => settle(resolve)
    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') {
        settle(resolve)
        return
      }

      settle(() => reject(new Error(`Speech synthesis failed: ${event.error}`)))
    }

    currentPlaybackRef.current = {
      stop: () => {
        settle(resolve)
        window.speechSynthesis.cancel()
      },
      utterance,
    }

    window.speechSynthesis.speak(utterance)
  }), [guideConfig.locale])

  const playAudio = useCallback((audioSource) => new Promise((resolve, reject) => {
    const audio = new Audio(audioSource)
    let settled = false

    const cleanup = () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }

    const settle = (callback) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()

      if (currentPlaybackRef.current?.audio === audio) {
        currentPlaybackRef.current = null
      }

      callback()
    }

    const handleEnded = () => settle(resolve)
    const handleError = () => settle(() => reject(new Error(`Unable to play AI Guide audio: ${audioSource}`)))

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    dispatchExclusiveAudioStart(AI_GUIDE_AUDIO_SOURCE_ID)

    currentPlaybackRef.current = {
      audio,
      stop: () => {
        audio.pause()
        audio.currentTime = 0
        settle(resolve)
      },
    }

    audio.play().catch((error) => {
      settle(() => reject(error))
    })
  }), [])

  const playStep = useCallback(async (step) => {
    if (isConfiguredAudioSource(step.audio)) {
      try {
        await playAudio(step.audio)
        return
      } catch (error) {
        if (!step.text) {
          throw error
        }
      }
    }

    await speakText(step.text)
  }, [playAudio, speakText])

  const playConfiguredStepById = useCallback(async (stepId) => {
    if (guideConfig.steps.length === 0) {
      onError?.(new Error('AI Guide has no configured steps.'))
      return
    }

    if (!isActiveRef.current) {
      return
    }

    const step = guideConfig.steps.find((entry) => entry.id === String(stepId))

    if (!step) {
      return
    }

    const runId = runIdRef.current + 1
    runIdRef.current = runId
    lastStepIdRef.current = step.id
    stopCurrentPlayback()
    setActiveStepId(step.id)

    try {
      await playStep(step)
      const completed = runIdRef.current === runId

      if (completed) {
        setActiveStepId(null)
      }

      return completed
    } catch (error) {
      if (runIdRef.current === runId) {
        setActiveStepId(null)
        onError?.(error)
      }

      return false
    }
  }, [guideConfig.steps, onError, playStep, stopCurrentPlayback])

  const playStepById = useCallback(async (stepId) => {
    if (!isActiveRef.current) {
      return false
    }

    const normalizedStepId = String(stepId)
    const stepExists = guideConfig.steps.some((entry) => entry.id === normalizedStepId)

    if (!stepExists) {
      return false
    }

    const progressRunId = progressRunIdRef.current + 1
    progressRunIdRef.current = progressRunId
    pendingStepIdsRef.current = [normalizedStepId]

    const completed = await playConfiguredStepById(normalizedStepId)

    if (completed && progressRunIdRef.current === progressRunId) {
      pendingStepIdsRef.current = []
    }

    return completed
  }, [guideConfig.steps, playConfiguredStepById])

  const playText = useCallback(async (text, { activeStepId: playbackStepId = null } = {}) => {
    if (!text || !isActiveRef.current) {
      return false
    }

    const resumeStepId = guideConfig.steps.some((entry) => entry.id === String(playbackStepId))
      ? String(playbackStepId)
      : null
    const progressRunId = resumeStepId ? progressRunIdRef.current + 1 : null

    if (resumeStepId) {
      progressRunIdRef.current = progressRunId
      lastStepIdRef.current = resumeStepId
      pendingStepIdsRef.current = [resumeStepId]
    }

    const runId = runIdRef.current + 1
    runIdRef.current = runId
    stopCurrentPlayback()
    setActiveStepId(playbackStepId)

    try {
      await speakText(text)
      const completed = runIdRef.current === runId

      if (completed) {
        setActiveStepId(null)

        if (progressRunIdRef.current === progressRunId) {
          pendingStepIdsRef.current = []
        }
      }

      return completed
    } catch (error) {
      if (runIdRef.current === runId) {
        setActiveStepId(null)
        onError?.(error)
      }

      return false
    }
  }, [guideConfig.steps, onError, speakText, stopCurrentPlayback])

  const playAudioSource = useCallback(async (
    audioSource,
    { activeStepId: playbackStepId = null, fallbackText = '' } = {},
  ) => {
    if (!isActiveRef.current) {
      return false
    }

    if (!isConfiguredAudioSource(audioSource)) {
      return fallbackText ? playText(fallbackText, { activeStepId: playbackStepId }) : false
    }

    const resumeStepId = guideConfig.steps.some((entry) => entry.id === String(playbackStepId))
      ? String(playbackStepId)
      : null
    const progressRunId = resumeStepId ? progressRunIdRef.current + 1 : null

    if (resumeStepId) {
      progressRunIdRef.current = progressRunId
      lastStepIdRef.current = resumeStepId
      pendingStepIdsRef.current = [resumeStepId]
    }

    const runId = runIdRef.current + 1
    runIdRef.current = runId
    stopCurrentPlayback()
    setActiveStepId(playbackStepId)

    try {
      await playAudio(audioSource)
      const completed = runIdRef.current === runId

      if (completed) {
        setActiveStepId(null)

        if (progressRunIdRef.current === progressRunId) {
          pendingStepIdsRef.current = []
        }
      }

      return completed
    } catch (error) {
      if (runIdRef.current === runId) {
        setActiveStepId(null)

        if (fallbackText) {
          return playText(fallbackText, { activeStepId: playbackStepId })
        }

        onError?.(error)
      }

      return false
    }
  }, [guideConfig.steps, onError, playAudio, playText, stopCurrentPlayback])

  const playStepsById = useCallback(async (stepIds) => {
    if (!Array.isArray(stepIds) || !isActiveRef.current) {
      return
    }

    const configuredStepIds = stepIds
      .map(String)
      .filter((stepId) => guideConfig.steps.some((entry) => entry.id === stepId))

    if (configuredStepIds.length === 0) {
      return
    }

    const progressRunId = progressRunIdRef.current + 1
    progressRunIdRef.current = progressRunId
    pendingStepIdsRef.current = [...configuredStepIds]

    for (const [index, stepId] of configuredStepIds.entries()) {
      if (!isActiveRef.current) {
        return
      }

      const completed = await playConfiguredStepById(stepId)

      if (!completed || progressRunIdRef.current !== progressRunId) {
        return
      }

      pendingStepIdsRef.current = configuredStepIds.slice(index + 1)
    }
  }, [guideConfig.steps, playConfiguredStepById])

  const start = useCallback(() => {
    stopCurrentPlayback()

    if (guideConfig.steps.length === 0) {
      isActiveRef.current = false
      setActiveStepId(null)
      setIsPlaying(false)
      onError?.(new Error('AI Guide has no configured steps.'))
      return
    }

    isActiveRef.current = true
    setIsPlaying(true)
    onStart?.(guideConfig)

    const configuredStepIds = new Set(guideConfig.steps.map((step) => step.id))
    const pendingStepIds = pendingStepIdsRef.current.filter((stepId) => configuredStepIds.has(stepId))
    const lastStepId = configuredStepIds.has(lastStepIdRef.current) ? lastStepIdRef.current : null
    const resumeStepIds = pendingStepIds.length > 0
      ? pendingStepIds
      : [lastStepId ?? guideConfig.steps[0].id]

    if (resumeStepIds.length > 1) {
      playStepsById(resumeStepIds)
      return
    }

    playStepById(resumeStepIds[0])
  }, [guideConfig, onError, onStart, playStepById, playStepsById, stopCurrentPlayback])

  const finish = useCallback(() => {
    isActiveRef.current = false
    runIdRef.current += 1
    progressRunIdRef.current += 1
    lastStepIdRef.current = null
    pendingStepIdsRef.current = []
    stopCurrentPlayback()
    setActiveStepId(null)
    setIsPlaying(false)
    onFinish?.(guideConfig)
  }, [guideConfig, onFinish, stopCurrentPlayback])

  useEffect(() => addExclusiveAudioListener(AI_GUIDE_AUDIO_SOURCE_ID, () => {
    runIdRef.current += 1
    stopCurrentPlayback()
    setActiveStepId(null)
  }), [stopCurrentPlayback])

  useEffect(() => stop, [stop])

  return {
    config: guideConfig,
    activeStepId,
    finish,
    isPlaying,
    playAudioSource,
    playStepById,
    playStepsById,
    playText,
    start,
    stop,
  }
}
