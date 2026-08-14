import { useMemo, useState } from 'react'

const CURRENT_FIELDS = [
  { currentKey: 'i1', resistanceKey: 'r1', voltageKey: 'v1', index: '1' },
  { currentKey: 'i2', resistanceKey: 'r2', voltageKey: 'v2', index: '2' },
  { currentKey: 'i3', resistanceKey: 'r3', voltageKey: 'v3', index: '3' },
]

const emptyInputs = () => ({ i1: '', i2: '', i3: '', r1: '', r2: '', r3: '' })

const isClose = (value, expected) => (
  Number.isFinite(value) &&
  Math.abs(value - expected) <= Math.max(0.000001, Math.abs(expected) * 0.02)
)

// Maximum 3 decimal places.
// Whole numbers display without decimal point.
// Examples: 5 -> "5", 5.1 -> "5.1", 5.1234 -> "5.123"
const formatNumber = (value, decimalPlaces = 3) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '—'
  }

  return String(Number(Number(value).toFixed(decimalPlaces)))
}

const formatVoltage = (value) => formatNumber(value, 3)

const formatSum = (a, b) => {
  if (
    a === null ||
    b === null ||
    !Number.isFinite(Number(a)) ||
    !Number.isFinite(Number(b))
  ) {
    return '—'
  }

  return formatNumber(Number(a) + Number(b), 3)
}

const preventWheelValueChange = (event) => event.currentTarget.blur()

const CalculationPanel = ({
  observations = [],
  onVerificationAttempt,
  onVerificationChange,
  requiredReadings = 3,
}) => {
  const [selectedId, setSelectedId] = useState('')
  const [inputs, setInputs] = useState(emptyInputs)
  const [verification, setVerification] = useState(null)

  const isEnabled = observations.length >= requiredReadings
  const recordedResistances = isEnabled ? observations[0] : null

  const selectedReading = useMemo(
    () =>
      isEnabled
        ? observations.find((row) => String(row.id) === selectedId) ?? null
        : null,
    [isEnabled, observations, selectedId],
  )

  const inputsLocked =
    !isEnabled || !selectedReading || verification?.passed === true

  const calculatedVoltages = useMemo(
    () =>
      Object.fromEntries(
        CURRENT_FIELDS.map((field) => {
          const currentMilliamperes = Number(inputs[field.currentKey])
          const resistanceKiloOhms = Number(inputs[field.resistanceKey])

          const currentAmperes = currentMilliamperes / 1000
          const resistanceOhms = resistanceKiloOhms * 1000

          return [
            field.voltageKey,
            inputs[field.currentKey] !== '' &&
            inputs[field.resistanceKey] !== '' &&
            Number.isFinite(currentMilliamperes) &&
            Number.isFinite(resistanceKiloOhms)
              ? currentAmperes * resistanceOhms
              : null,
          ]
        }),
      ),
    [inputs],
  )

  const resetVerification = () => {
    setVerification(null)
    onVerificationChange?.(false, null)
  }

  const selectReading = (event) => {
    const nextSelectedId = event.target.value

    setSelectedId(nextSelectedId)
    setInputs(emptyInputs())
    resetVerification()
  }

  const updateInput = (key, value) => {
    // Allow maximum 3 digits after decimal point.
    if (!/^\d*\.?\d{0,3}$/.test(value)) return

    if (value === '') {
      setInputs((current) => ({
        ...current,
        [key]: '',
      }))

      resetVerification()
      return
    }

    const num = Number(value)

    if (!Number.isFinite(num)) return

    if (key.startsWith('i') && (num < 0 || num > 100)) return
    if (key.startsWith('r') && (num < 1 || num > 5)) return

    setInputs((current) => ({
      ...current,
      [key]: value,
    }))

    resetVerification()
  }

  const verifyKvl = () => {
    if (!selectedReading) {
      setVerification({
        passed: false,
        message: 'Select a reading before verification.',
      })

      onVerificationChange?.(false, null)
      return
    }

    const missingValueCount = CURRENT_FIELDS.flatMap(
      ({ currentKey, resistanceKey }) => [currentKey, resistanceKey],
    ).filter(
      (key) =>
        inputs[key] === '' || !Number.isFinite(Number(inputs[key])),
    ).length

    if (missingValueCount > 0) {
      const multipleValuesMissing = missingValueCount > 1

      const message = multipleValuesMissing
        ? 'Please enter all the values, then click the “Verify” button to verify KVL.'
        : 'Please enter the required value, then click the “Verify” button to verify KVL.'

      setVerification({
        passed: false,
        message,
      })

      onVerificationChange?.(false, null)

      onVerificationAttempt?.(
        multipleValuesMissing
          ? 'multiple-values-missing'
          : 'one-value-missing',
      )

      return
    }

    const inputResults = Object.fromEntries(
      CURRENT_FIELDS.flatMap(({ currentKey, resistanceKey }) => [
        [
          currentKey,
          isClose(
            Number(inputs[currentKey]),
            Number(selectedReading[currentKey]) * 1000,
          ),
        ],
        [
          resistanceKey,
          isClose(
            Number(inputs[resistanceKey]),
            Number(selectedReading[resistanceKey]),
          ),
        ],
      ]),
    )

    const { v1, v2, v3 } = calculatedVoltages

    const loopOnePassed = isClose(v1 + v2, selectedReading.voltage)
    const loopTwoPassed = isClose(v1 + v3, selectedReading.voltage)
    const parallelDropPassed = isClose(v2, v3)

    const inputsPassed = Object.values(inputResults).every(Boolean)

    const passed =
      inputsPassed &&
      loopOnePassed &&
      loopTwoPassed &&
      parallelDropPassed

    setVerification({
      inputResults,
      loopOnePassed,
      loopTwoPassed,
      parallelDropPassed,
      passed,
      message: passed
        ? 'Calculations are correct. Kirchhoff’s Voltage Law (KVL) has been verified successfully. Now, click on the Generate Report button.'
        : 'Incorrect calculations. Kirchhoff’s Voltage Law (KVL) is not verified. Please review your calculations and try again.',
    })

    onVerificationChange?.(
      passed,
      passed
        ? {
            calculatedVoltages: { v1, v2, v3 },
            readingId: selectedReading.id,
            readingNumber:
              observations.findIndex(
                (row) => row.id === selectedReading.id,
              ) + 1,
            sourceVoltage: selectedReading.voltage,
          }
        : null,
    )

    onVerificationAttempt?.(passed ? 'correct' : 'incorrect')
  }

  return (
    <section
      className={`calculation-panel${
        isEnabled ? '' : ' calculation-panel--disabled'
      }`}
      id="calculation-panel"
      aria-labelledby="calculation-title"
      aria-disabled={!isEnabled}
    >
      <div className="calculation-panel__heading">
        <div>
          <span className="calculation-panel__eyebrow">
            KIRCHHOFF'S VOLTAGE LAW
          </span>

          <h2 id="calculation-title">
            THEORETICAL VERIFICATION
          </h2>

          <p className="calculation-panel__subtitle">
            {isEnabled
              ? 'Choose any recorded reading and enter each current/resistance value.'
              : `Record all ${requiredReadings} readings to unlock this section (${observations.length}/${requiredReadings}).`}
          </p>
        </div>
      </div>

      <div className="calculation-panel__setup">
        <section className="calculation-panel__setup-card calculation-panel__reading-card">
          <label htmlFor="calculation-reading-select">
            <span>Verification for: </span>

            <select
              id="calculation-reading-select"
              value={selectedId}
              onChange={selectReading}
              disabled={!isEnabled}
            >
              <option value="">
                Choose a recorded reading…
              </option>

              {observations.slice(0, 5).map((row, index) => (
                <option
                  value={String(row.id)}
                  key={row.id}
                >
                  Reading {index + 1} · Vs = {formatNumber(row.voltage, 3)} V
                </option>
              ))}
            </select>
          </label>

          {selectedReading ? (
            <strong>
              Vs = {formatNumber(selectedReading.voltage, 3)} V
            </strong>
          ) : null}
        </section>

        <section className="calculation-panel__setup-card calculation-panel__resistance-card">
          <h3>Resistance Values</h3>

          <div className="calculation-panel__resistance-inputs">
            {CURRENT_FIELDS.map(
              ({ resistanceKey, index }) => (
                <label
                  htmlFor={`recorded-${resistanceKey}`}
                  key={resistanceKey}
                >
                  <span>
                    R<sub>{index}</sub>:
                  </span>

                  <input
                    aria-label={`Recorded R${index} resistance`}
                    id={`recorded-${resistanceKey}`}
                    onWheel={preventWheelValueChange}
                    readOnly
                    type="number"
                    value={
                      recordedResistances
                        ? formatNumber(
                            recordedResistances[resistanceKey],
                            3,
                          )
                        : ''
                    }
                  />

                  <i>kΩ</i>
                </label>
              ),
            )}
          </div>
        </section>
      </div>

      <div className="calculation-panel__content calculation-panel__content--verification">
        <div className="calculation-panel__voltage-sections">
          {CURRENT_FIELDS.map(
            ({
              currentKey,
              resistanceKey,
              voltageKey,
              index,
            }) => {
              const currentResult =
                verification?.inputResults?.[currentKey]

              const resistanceResult =
                verification?.inputResults?.[resistanceKey]

              const calculatedVoltage =
                calculatedVoltages[voltageKey]

              return (
                <article
                  className={`calculation-panel__voltage-card calculation-panel__voltage-card--v${index}`}
                  key={currentKey}
                >
                  <div className="calculation-panel__large-formula">
                    <span className="calculation-panel__formula-symbol">
                      V<sub>{index}</sub> ={' '}
                      <span className="calculation-panel__current-symbol">
                        I<sub>{index}</sub>
                      </span>
                    </span>

                    <label
                      className={
                        currentResult === true
                          ? 'is-correct'
                          : currentResult === false
                            ? 'is-incorrect'
                            : ''
                      }
                      htmlFor={`formula-${currentKey}`}
                    >
                      <span className="sr-only">
                        Enter I{index}
                      </span>

                      <input
                        id={`formula-${currentKey}`}
                        disabled={inputsLocked}
                        inputMode="decimal"
                        onChange={(event) =>
                          updateInput(
                            currentKey,
                            event.target.value,
                          )
                        }
                        onWheel={preventWheelValueChange}
                        placeholder="Enter Value"
                        step="0.001"
                        type="number"
                        min="0"
                        max="100"
                        value={inputs[currentKey]}
                      />

                      <i>mA</i>
                    </label>

                    <span className="calculation-panel__formula-operator">
                      × R<sub>{index}</sub>
                    </span>

                    <label
                      className={
                        resistanceResult === true
                          ? 'is-correct'
                          : resistanceResult === false
                            ? 'is-incorrect'
                            : ''
                      }
                      htmlFor={`formula-${resistanceKey}`}
                    >
                      <span className="sr-only">
                        Enter R{index}
                      </span>

                      <input
                        id={`formula-${resistanceKey}`}
                        disabled={inputsLocked}
                        inputMode="decimal"
                        onChange={(event) =>
                          updateInput(
                            resistanceKey,
                            event.target.value,
                          )
                        }
                        onWheel={preventWheelValueChange}
                        placeholder="Enter Value"
                        step="0.001"
                        type="number"
                        min="1"
                        max="5"
                        value={inputs[resistanceKey]}
                      />

                      <i>kΩ</i>
                    </label>

                    <span className="calculation-panel__formula-operator">
                      =
                    </span>

                    <output>
                      {calculatedVoltage === null
                        ? 'Calculated Value'
                        : formatVoltage(calculatedVoltage)}
                    </output>

                    <strong>V</strong>
                  </div>
                </article>
              )
            },
          )}
        </div>

        <div
          className={`calculation-panel__result${
            verification?.passed
              ? ' is-verified'
              : verification
                ? ' is-invalid'
                : ''
          }`}
        >
          <div className="calculation-panel__result-header">
            <span
              className="calculation-panel__result-icon"
              aria-hidden="true"
            >
              ✓
            </span>

            <div>
              <span className="calculation-panel__verification-badge">
                FINAL CHECK
              </span>

              <h3>KVL Verification</h3>

              <p className="calculation-panel__result-intro">
                Calculated voltage values are inserted automatically.
              </p>
            </div>
          </div>

          <div className="calculation-panel__voltage-summary">
            <div className="calculation-panel__voltage-summary-item calculation-panel__voltage-summary-item--source">
              <span>
                V<sub>s</sub>
              </span>

              <strong>
                {selectedReading
                  ? formatNumber(
                      selectedReading.voltage,
                      3,
                    )
                  : '—'}
              </strong>

              <i>V</i>
            </div>

            {CURRENT_FIELDS.map(
              ({ voltageKey, index }) => (
                <div
                  className={`calculation-panel__voltage-summary-item calculation-panel__voltage-summary-item--v${index}`}
                  key={voltageKey}
                >
                  <span>
                    V<sub>{index}</sub>
                  </span>

                  <strong>
                    {formatVoltage(
                      calculatedVoltages[voltageKey],
                    )}
                  </strong>

                  <i>V</i>
                </div>
              ),
            )}
          </div>

          <div
            className="calculation-panel__kvl-equations"
            aria-label="Calculated KVL equations"
          >
            <div>
              <span>
                V<sub>s</sub> = V<sub>1</sub> + V<sub>2</sub>
              </span>

              <b className="calculation-panel__kvl-arrow">
                =&gt;
              </b>

              <strong>
                {selectedReading
                  ? formatNumber(
                      selectedReading.voltage,
                      3,
                    )
                  : '—'}
                {' = '}
                {formatVoltage(calculatedVoltages.v1)}
                {' + '}
                {formatVoltage(calculatedVoltages.v2)}
                {' = '}
                {formatSum(
                  calculatedVoltages.v1,
                  calculatedVoltages.v2,
                )}{' '}
                (V)
              </strong>
            </div>

            <div>
              <span>
                V<sub>s</sub> = V<sub>1</sub> + V<sub>3</sub>
              </span>

              <b className="calculation-panel__kvl-arrow">
                =&gt;
              </b>

              <strong>
                {selectedReading
                  ? formatNumber(
                      selectedReading.voltage,
                      3,
                    )
                  : '—'}
                {' = '}
                {formatVoltage(calculatedVoltages.v1)}
                {' + '}
                {formatVoltage(calculatedVoltages.v3)}
                {' = '}
                {formatSum(
                  calculatedVoltages.v1,
                  calculatedVoltages.v3,
                )}{' '}
                (V)
              </strong>
            </div>
          </div>

          <button
            id="calculation-verify-button"
            type="button"
            onClick={verifyKvl}
            disabled={
              !isEnabled || verification?.passed === true
            }
          >
            Verify
          </button>

          {verification ? (
            <p
              className={
                verification.passed
                  ? 'is-success'
                  : 'is-error'
              }
              role="status"
            >
              {verification.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default CalculationPanel