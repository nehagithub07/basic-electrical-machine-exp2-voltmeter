import { memo } from 'react'
import v1Img from '../assets/V1.png'
import v2Img from '../assets/V2.png'
import v3Img from '../assets/V3.png'
import needleImg from '../assets/needle.png'
import { getTerminalConnectedClass, getTerminalHighlightClass, getTerminalNumberHighlightClass } from '../utils/terminalHighlight.js'

// The meter artwork is a 0–20 V scale, so map calculated voltage to that full arc.
const METER_MAX_READING = 20
// The needle artwork points upward in its unrotated state. Rotate it 90 degrees
// counter-clockwise so a zero reading points at the dial's left-hand zero tick.
const DIAL_START_ANGLE = -90
const DIAL_SWEEP_ANGLE = 180

const voltmeterImages = {
  V1: v1Img,
  V2: v2Img,
  V3: v3Img,
}

const terminalNumbers = {
  V1: { positive: 3, negative: 4 },
  V2: { positive: 5, negative: 6 },
  V3: { positive: 7, negative: 8 },
}

const Voltmeter = ({ connectedTerminalIds = [], highlightedTerminalIds = [], label, value = 0 }) => {
  const terminals = terminalNumbers[label]
  const positiveTerminalId = `${terminals.positive}-endpoint`
  const negativeTerminalId = `${terminals.negative}-endpoint`
  const reading = Number.isFinite(value) ? value : 0
  const ratio = Math.min(Math.max(reading / METER_MAX_READING, 0), 1)
  const angle = DIAL_START_ANGLE + ratio * DIAL_SWEEP_ANGLE

  return (
    <article className={`voltmeter voltmeter--${label}`} id={`voltmeter-${label.toLowerCase()}`} aria-label={`${label} voltmeter`}>
      <img
        src={voltmeterImages[label]}
        alt={`${label} voltmeter`}
        className="voltmeter__image"
        decoding="async"
      />

      <span
        id={positiveTerminalId}
        className={`connection-terminal connection-terminal--meter connection-terminal--meter-plus connection-terminal--endpoint-${terminals.positive}${getTerminalConnectedClass(connectedTerminalIds, positiveTerminalId)}${getTerminalHighlightClass(highlightedTerminalIds, positiveTerminalId)}`}
        data-polarity="plus"
        aria-label={`${label} positive terminal ${terminals.positive}`}
        title={`${label} positive`}
      />
      <span
        className={`terminal-number-label terminal-number-label--meter-plus terminal-number-label--endpoint-${terminals.positive}${getTerminalNumberHighlightClass(highlightedTerminalIds, positiveTerminalId)}`}
        data-terminal-id={positiveTerminalId}
        title={`${label} positive`}
      >
        {terminals.positive}
      </span>

      <span
        id={negativeTerminalId}
        className={`connection-terminal connection-terminal--meter connection-terminal--meter-minus connection-terminal--endpoint-${terminals.negative}${getTerminalConnectedClass(connectedTerminalIds, negativeTerminalId)}${getTerminalHighlightClass(highlightedTerminalIds, negativeTerminalId)}`}
        data-polarity="minus"
        aria-label={`${label} negative terminal ${terminals.negative}`}
        title={`${label} negative`}
      />
      <span
        className={`terminal-number-label terminal-number-label--meter-minus terminal-number-label--endpoint-${terminals.negative}${getTerminalNumberHighlightClass(highlightedTerminalIds, negativeTerminalId)}`}
        data-terminal-id={negativeTerminalId}
        title={`${label} negative`}
      >
        {terminals.negative}
      </span>

      <div
        className="voltmeter__needle"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <img
          src={needleImg}
          alt="Needle"
          className="voltmeter__needle-image"
          decoding="async"
        />
      </div>
    </article>
  )
}

export default memo(Voltmeter)
