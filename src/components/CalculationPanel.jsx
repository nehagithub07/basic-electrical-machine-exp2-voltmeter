import { useMemo, useState } from 'react'

const CURRENT_FIELDS = [
  { currentKey: 'i1', resistanceKey: 'r1', voltageKey: 'v1', index: '1' },
  { currentKey: 'i2', resistanceKey: 'r2', voltageKey: 'v2', index: '2' },
  { currentKey: 'i3', resistanceKey: 'r3', voltageKey: 'v3', index: '3' },
]

const emptyInputs = () => ({ i1: '', i2: '', i3: '', r1: '', r2: '', r3: '' })
const isClose = (value, expected) => (
  Number.isFinite(value) && Math.abs(value - expected) <= Math.max(0.02, Math.abs(expected) * 0.02)
)

const CalculationPanel = ({ observations = [], onVerificationChange }) => {
  const [selectedId, setSelectedId] = useState('')
  const [inputs, setInputs] = useState(emptyInputs)
  const [verification, setVerification] = useState(null)
  const selectedReading = useMemo(
    () => observations.find((row) => String(row.id) === selectedId) ?? null,
    [observations, selectedId],
  )
  const calculatedVoltages = useMemo(() => Object.fromEntries(CURRENT_FIELDS.map((field) => {
    const current = Number(inputs[field.currentKey])
    const resistance = Number(inputs[field.resistanceKey])

    return [field.voltageKey, inputs[field.currentKey] !== '' && inputs[field.resistanceKey] !== '' && Number.isFinite(current) && Number.isFinite(resistance)
      ? current * resistance
      : null]
  })), [inputs])

  const resetVerification = () => {
    setVerification(null)
    onVerificationChange(false)
  }

  const selectReading = (event) => {
    const nextSelectedId = event.target.value
    const nextReading = observations.find((row) => String(row.id) === nextSelectedId)

    setSelectedId(nextSelectedId)
    setInputs(nextReading ? {
      ...emptyInputs(),
      r1: String(nextReading.r1),
      r2: String(nextReading.r2),
      r3: String(nextReading.r3),
    } : emptyInputs())
    resetVerification()
  }

  const updateInput = (key, value) => {
    setInputs((current) => ({ ...current, [key]: value }))
    resetVerification()
  }

  const verifyKvl = () => {
    if (!selectedReading) {
      setVerification({ passed: false, message: 'Select a reading before verification.' })
      onVerificationChange(false)
      return
    }

    const allValuesEntered = CURRENT_FIELDS.every(({ currentKey, resistanceKey }) => (
      inputs[currentKey] !== '' && Number.isFinite(Number(inputs[currentKey]))
      && inputs[resistanceKey] !== '' && Number.isFinite(Number(inputs[resistanceKey]))
    ))

    if (!allValuesEntered) {
      setVerification({ passed: false, message: 'Enter all current and resistance values before verification.' })
      onVerificationChange(false)
      return
    }

    const inputResults = Object.fromEntries(CURRENT_FIELDS.flatMap(({ currentKey, resistanceKey }) => ([
      [currentKey, isClose(Number(inputs[currentKey]), Number(selectedReading[currentKey]))],
      [resistanceKey, isClose(Number(inputs[resistanceKey]), Number(selectedReading[resistanceKey]))],
    ])))
    const { v1, v2, v3 } = calculatedVoltages
    const loopOnePassed = isClose(v1 + v2, selectedReading.voltage)
    const loopTwoPassed = isClose(v1 + v3, selectedReading.voltage)
    const parallelDropPassed = isClose(v2, v3)
    const inputsPassed = Object.values(inputResults).every(Boolean)
    const passed = inputsPassed && loopOnePassed && loopTwoPassed && parallelDropPassed

    setVerification({
      inputResults,
      loopOnePassed,
      loopTwoPassed,
      parallelDropPassed,
      passed,
      message: passed
        ? 'The entered current and resistance values are correct, and KVL is verified.'
        : 'Verification failed. Check the entered current and resistance values.',
    })
    onVerificationChange(passed)
  }

  return (
    <section className="calculation-panel" id="calculation-panel" aria-labelledby="calculation-title">
      <div className="calculation-panel__heading">
        <div>
          <h2 id="calculation-title">THEORETICAL VERIFICATION</h2>
          
        </div>
      </div>

      <div className="calculation-panel__setup">
        <section className="calculation-panel__setup-card calculation-panel__resistance-card">
          <h3>Resistance Values</h3>
          <div className="calculation-panel__resistance-inputs">
            {CURRENT_FIELDS.map(({ resistanceKey, index }) => {
              const result = verification?.inputResults?.[resistanceKey]

              return (
                <label className={result === true ? 'is-correct' : result === false ? 'is-incorrect' : ''} htmlFor={`calculated-${resistanceKey}`} key={resistanceKey}>
                  <span>R<sub>{index}</sub>:</span>
                  <input
                    id={`calculated-${resistanceKey}`}
                    disabled={!selectedReading}
                    inputMode="decimal"
                    onChange={(event) => updateInput(resistanceKey, event.target.value)}
                    step="any"
                    type="number"
                    value={inputs[resistanceKey]}
                  />
                  <i>kΩ</i>
                </label>
              )
            })}
          </div>
        </section>

        <section className="calculation-panel__setup-card calculation-panel__reading-card">
          <h3>Verification for Select Reading:</h3>
          <label htmlFor="calculation-reading-select">
         
            <select id="calculation-reading-select" value={selectedId} onChange={selectReading} disabled={!observations.length}>
              <option value="">Select Reading</option>
              {observations.slice(0, 5).map((row, index) => (
                <option value={String(row.id)} key={row.id}>Reading {index + 1} — {row.voltage.toFixed(1)} V</option>
              ))}
            </select>
          </label>
          {selectedReading ? <strong>Vs = {selectedReading.voltage.toFixed(2)} V</strong> : null}
        </section>
      </div>
 

      <div className="calculation-panel__content calculation-panel__content--verification">
        <div className="calculation-panel__voltage-sections">
          {CURRENT_FIELDS.map(({ currentKey, resistanceKey, voltageKey, index }) => {
            const currentResult = verification?.inputResults?.[currentKey]
            const resistanceResult = verification?.inputResults?.[resistanceKey]
            const calculatedVoltage = calculatedVoltages[voltageKey]

            return (
              <article className={`calculation-panel__voltage-card calculation-panel__voltage-card--v${index}`} key={currentKey}>
                <div className="calculation-panel__large-formula">
                  <span className="calculation-panel__formula-symbol">
                    V<sub>{index}</sub> = <span className="calculation-panel__current-symbol">I<sub>{index}</sub></span>
                  </span>
                  <label className={currentResult === true ? 'is-correct' : currentResult === false ? 'is-incorrect' : ''} htmlFor={`formula-${currentKey}`}>
                    <span className="sr-only">Enter I{index}</span>
                    <input
                      id={`formula-${currentKey}`}
                      disabled={!selectedReading}
                      inputMode="decimal"
                      onChange={(event) => updateInput(currentKey, event.target.value)}
                      placeholder="Enter Value"
                      step="any"
                      type="number"
                      value={inputs[currentKey]}
                    />
                    <i>mA</i>
                  </label>
                  <span className="calculation-panel__formula-operator">× R<sub>{index}</sub></span>
                  <label className={resistanceResult === true ? 'is-correct' : resistanceResult === false ? 'is-incorrect' : ''} htmlFor={`formula-${resistanceKey}`}>
                    <span className="sr-only">Enter R{index}</span>
                    <input
                      id={`formula-${resistanceKey}`}
                      disabled={!selectedReading}
                      inputMode="decimal"
                      onChange={(event) => updateInput(resistanceKey, event.target.value)}
                      placeholder="Enter Value"
                      step="any"
                      type="number"
                      value={inputs[resistanceKey]}
                    />
                    <i>kΩ</i>
                  </label>
                  <span className="calculation-panel__formula-operator">=</span>
                  <output>{calculatedVoltage === null ? 'Calculated Value' : calculatedVoltage.toFixed(3)}</output>
                  <strong>V</strong>
                </div>
              </article>
            )
          })}
        </div>

        <div className="calculation-panel__result">
          <span className="calculation-panel__verification-badge">FINAL CHECK</span>
          <h3>KVL verification</h3>
          <p>Vs = V₁ + V₂ or V₃</p>
          <p className="calculation-panel__note">Note: V₂ = V₃</p>
          {selectedReading && calculatedVoltages.v1 !== null && calculatedVoltages.v2 !== null && calculatedVoltages.v3 !== null ? (
            <div className="calculation-panel__kvl-preview">
              <span>Vs: {selectedReading.voltage.toFixed(3)} V</span>
              <span>V₁ + V₂: {(calculatedVoltages.v1 + calculatedVoltages.v2).toFixed(3)} V</span>
              <span>V₁ + V₃: {(calculatedVoltages.v1 + calculatedVoltages.v3).toFixed(3)} V</span>
              <span>V₂ / V₃: {calculatedVoltages.v2.toFixed(3)} / {calculatedVoltages.v3.toFixed(3)} V</span>
            </div>
          ) : null}
          <button id="calculation-verify-button" type="button" onClick={verifyKvl} disabled={!selectedReading}>Verify KVL</button>
          {verification ? <p className={verification.passed ? 'is-success' : 'is-error'} role="status">{verification.message}</p> : null}
        </div>
      </div>
    </section>
  )
}

export default CalculationPanel
