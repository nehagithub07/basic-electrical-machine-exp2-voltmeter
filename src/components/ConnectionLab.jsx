import { useEffect, useRef, useState } from 'react'

import CircuitDiagram from './CircuitDiagram.jsx'
import EquipmentPanel from './EquipmentPanel.jsx'

import {
  addAllEndpoints,
  autoConnectDefaultCircuit,
  DEFAULT_VOLTMETER_READING_KEYS,
  deleteConnectionsForTerminal,
  getVoltmeterReadingKeys,
  getConnectedTerminalIds,
  getConnectionStatus,
  getNextRequiredConnectionPair,
  isValidConnectionPair,
  lockJsPlumbCircuit,
  resolveJsPlumb,
  wireHoverPaintStyles,
  wirePaintStyles,
} from '../utils/jsPlumbWiring.js'

const getJsPlumbZoom = (scale) => (
  Number.isFinite(scale) && scale > 0 ? scale : 1
)

const areTerminalIdsEqual = (currentIds, nextIds) => (
  currentIds.length === nextIds.length
  && currentIds.every((terminalId, index) => terminalId === nextIds[index])
)

const getNextGuideHighlightTerminalIds = (instance, guideEndpointHighlightActive, isLocked) => {
  if (!guideEndpointHighlightActive || isLocked || !instance) {
    return []
  }

  return getNextRequiredConnectionPair(instance) ?? []
}

const ConnectionLab = ({
  autoConnectRequest,
  checkRequest,
  guideEndpointHighlightActive = false,
  onConnectionChange,
  onCheckConnections,
  powerOn,
  r1,
  r2,
  r3,
  readings,
  resetRequest,
  scale = 1,
  onTogglePower,
  setVoltage,
  voltage,
}) => {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)
  const onConnectionChangeRef = useRef(onConnectionChange)
  const onCheckConnectionsRef = useRef(onCheckConnections)
  const scaleRef = useRef(getJsPlumbZoom(scale))
  const suppressConnectionAlertsRef = useRef(false)

  const [isLocked, setIsLocked] = useState(false)
  const [voltmeterReadingKeys, setVoltmeterReadingKeys] = useState(DEFAULT_VOLTMETER_READING_KEYS)
  const [connectionRevision, setConnectionRevision] = useState(0)
  const [connectedTerminalIds, setConnectedTerminalIds] = useState([])
  const [guideHighlightedTerminalIds, setGuideHighlightedTerminalIds] = useState([])

  useEffect(() => {
    onCheckConnectionsRef.current = onCheckConnections
  }, [onCheckConnections])

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange
  }, [onConnectionChange])

  useEffect(() => {
    let cancelled = false

    const initJsPlumb = async () => {
      const jsPlumbModule = await import('jsplumb')
      const jsPlumb = resolveJsPlumb(jsPlumbModule)

      if (cancelled || !containerRef.current || !jsPlumb?.getInstance) {
        return
      }

      instanceRef.current?.reset()

      containerRef.current.classList.remove('connection-lab--locked')
      setIsLocked(false)
      setVoltmeterReadingKeys(DEFAULT_VOLTMETER_READING_KEYS)
      setConnectedTerminalIds([])
      setGuideHighlightedTerminalIds([])

      const instance = jsPlumb.getInstance({
        Container: containerRef.current,
        ConnectionsDetachable: true,
        ReattachConnections: true,
        Connector: ['Bezier', { curviness: 52 }],
        PaintStyle: {
          ...wirePaintStyles.positive,
        },
        HoverPaintStyle: {
          ...wireHoverPaintStyles.positive,
        },
        Endpoint: ['Dot', { radius: 5 }],
      })

      instanceRef.current = instance
      instance.setZoom?.(scaleRef.current)

      instance.registerConnectionTypes({
        positive: {
          paintStyle: {
            ...wirePaintStyles.positive,
          },
          hoverPaintStyle: {
            ...wireHoverPaintStyles.positive,
          },
        },
        negative: {
          paintStyle: {
            ...wirePaintStyles.negative,
          },
          hoverPaintStyle: {
            ...wireHoverPaintStyles.negative,
          },
        },
      })

      instance.setSuspendDrawing(true)

      addAllEndpoints(instance)
      setConnectionRevision((current) => current + 1)

      instance.bind?.('connection', (info) => {
        const connection = info?.connection ?? info
        const sourceId = connection?.sourceId || connection?.source?.id
        const targetId = connection?.targetId || connection?.target?.id
        const latestConnectionIsInvalid = Boolean(
          sourceId && targetId && !isValidConnectionPair(sourceId, targetId),
        )
        const latestConnectionIsWrong = latestConnectionIsInvalid
        const nextRequiredConnection = getNextRequiredConnectionPair(instance)

        if (suppressConnectionAlertsRef.current) {
          setConnectionRevision((current) => current + 1)
          return
        }

        onConnectionChangeRef.current?.({
          ...getConnectionStatus(instance),
          latestConnection: {
            sourceId,
            targetId,
          },
          latestConnectionIsWrong,
          nextRequiredConnection,
        })
        setConnectionRevision((current) => current + 1)
      })

      instance.bind?.('connectionDetached', () => {
        setConnectionRevision((current) => current + 1)
      })

      instance.setSuspendDrawing(false, true)

      window.setTimeout(() => {
        instance.repaintEverything()
      }, 100)
    }

    initJsPlumb()

    const handleResize = () => {
      window.setTimeout(() => {
        instanceRef.current?.repaintEverything()
      }, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)

      instanceRef.current?.reset()
      instanceRef.current = null
    }
  }, [resetRequest])

  useEffect(() => {
    const nextConnectedTerminalIds = instanceRef.current
      ? getConnectedTerminalIds(instanceRef.current)
      : []
    const nextIds = getNextGuideHighlightTerminalIds(
      instanceRef.current,
      guideEndpointHighlightActive,
      isLocked,
    )

    setConnectedTerminalIds((currentIds) => (
      areTerminalIdsEqual(currentIds, nextConnectedTerminalIds) ? currentIds : nextConnectedTerminalIds
    ))
    setGuideHighlightedTerminalIds((currentIds) => (
      areTerminalIdsEqual(currentIds, nextIds) ? currentIds : nextIds
    ))
  }, [connectionRevision, guideEndpointHighlightActive, isLocked])

  useEffect(() => {
    const instance = instanceRef.current
    const zoom = getJsPlumbZoom(scale)

    scaleRef.current = zoom

    if (!instance?.setZoom) {
      return
    }

    instance.setZoom(zoom, true)

    window.setTimeout(() => {
      instance.repaintEverything?.()
    }, 0)
  }, [scale])

  useEffect(() => {
    if (autoConnectRequest === 0 || !instanceRef.current || isLocked) {
      return
    }

    suppressConnectionAlertsRef.current = true

    try {
      autoConnectDefaultCircuit(instanceRef.current)
      setVoltmeterReadingKeys(getVoltmeterReadingKeys(instanceRef.current))
      lockJsPlumbCircuit(instanceRef.current, containerRef.current)
      setIsLocked(true)
    } finally {
      suppressConnectionAlertsRef.current = false
    }

    window.setTimeout(() => {
      instanceRef.current?.repaintEverything()
    }, 80)
    setConnectionRevision((current) => current + 1)
  }, [autoConnectRequest, isLocked])

  useEffect(() => {
    if (checkRequest === 0 || !instanceRef.current) {
      return
    }

    const result = getConnectionStatus(instanceRef.current)

    if (result.isCorrect) {
      setVoltmeterReadingKeys(getVoltmeterReadingKeys(instanceRef.current))
      lockJsPlumbCircuit(instanceRef.current, containerRef.current)
      setIsLocked(true)
    }

    onCheckConnectionsRef.current?.({
      ...result,
      nextRequiredConnection: getNextRequiredConnectionPair(instanceRef.current),
    })
  }, [checkRequest])

  const handleLabelClick = (event) => {
    const label = event.target.closest('.terminal-number-label')

    if (!label || !containerRef.current?.contains(label)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (isLocked) {
      return
    }

    const terminalId = label.dataset.terminalId

    if (!terminalId || !instanceRef.current) {
      return
    }

    deleteConnectionsForTerminal(instanceRef.current, terminalId)
    setConnectionRevision((current) => current + 1)
    onConnectionChangeRef.current?.({
      ...getConnectionStatus(instanceRef.current),
      latestConnection: null,
      latestConnectionIsWrong: false,
      nextRequiredConnection: getNextRequiredConnectionPair(instanceRef.current),
    })
    instanceRef.current.repaintEverything?.()
  }

  const voltmeterReadings = {
    V1: readings[voltmeterReadingKeys.V1] ?? 0,
    V2: readings[voltmeterReadingKeys.V2] ?? 0,
    V3: readings[voltmeterReadingKeys.V3] ?? 0,
  }

  return (
    <div className="connection-lab" onClick={handleLabelClick} ref={containerRef}>
      <EquipmentPanel
        connectedTerminalIds={connectedTerminalIds}
        highlightedTerminalIds={guideHighlightedTerminalIds}
        onTogglePower={onTogglePower}
        powerOn={powerOn}
        readings={voltmeterReadings}
        setVoltage={setVoltage}
        voltage={voltage}
      />

      <CircuitDiagram
        connectedTerminalIds={connectedTerminalIds}
        highlightedTerminalIds={guideHighlightedTerminalIds}
        r1={r1}
        r2={r2}
        r3={r3}
      />
    </div>
  )
}

export default ConnectionLab
