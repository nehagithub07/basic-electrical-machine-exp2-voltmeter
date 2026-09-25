import { useEffect, useRef, useState } from 'react'
import SectionCard from './SectionCard.jsx'
import {
  AddIcon,
  AiGuide,
  AutoConnectIcon,
  ButtonIcon,
  CheckIcon,
  CloseIcon,
  PlotIcon,
  PrintIcon,
  ResetIcon,
} from './Icons.jsx'

const buttons = [
  {
    id: 'instructions-button',
    label: 'INSTRUCTIONS',
    tone: 'action-button--gold',
    Icon: ButtonIcon,
    opensInstructions: true,
  },
  {
    id: 'ai-guide-button',
    label: 'AI GUIDE',
    tone: 'action-button--cyan',
    Icon: AiGuide,
    handlerName: 'onAiGuide',
  },
  {
    id: 'check-button',
    label: 'CHECK',
    tone: 'action-button--green',
    Icon: CheckIcon,
    handlerName: 'onCheck',
  },
  {
    id: 'auto-connect-button',
    label: 'AUTO CONNECT',
    tone: 'action-button--teal',
    Icon: AutoConnectIcon,
    handlerName: 'onAutoConnect',
  },
  {
    id: 'add-reading-button',
    label: 'ADD',
    tone: 'action-button--blue',
    Icon: AddIcon,
    handlerName: 'onAdd',
  },
  {
    id: 'verify-button',
    label: 'CALCULATE',
    tone: 'action-button--orange',
    Icon: PlotIcon,
    handlerName: 'onVerify',
  },
  {
    id: 'print-button',
    label: 'PRINT',
    tone: 'action-button--purple',
    Icon: PrintIcon,
    handlerName: 'onPrint',
  },
  {
    id: 'reset-button',
    label: 'RESET',
    tone: 'action-button--red',
    Icon: ResetIcon,
    handlerName: 'onReset',
  },
]

const instructionSteps = [
  {
    number: 1,
    text: 'Make connections as per the instructions given below by dragging and dropping wires from the apparatus terminals to the circuit, or use Autoconnect to make the connections automatically.',
    substeps: [
      'Connect the power supply to the circuit (1-9, 2-10).',
      'Connect voltmeters (3-11, 4-12), (5-13, 6-14), and (7-15, 8-16), or connect any voltmeter to any resistance in the circuit.',
      'Click on a label to delete all connections for the corresponding node.',
    ],
  },
  {
    number: 2,
    text: <>Check the manual connections by clicking the <strong>'CHECK'</strong> button. Autoconnect will automatically verify the connections.</>,
  },
  {
    number: 3,
    text: 'Set the values of resistances R1, R2, and R3 by adjusting the sliders on the left. These values will remain constant throughout the experiment.',
  },
  {
    number: 4,
    text: <>Click on the <strong>'Power'</strong> button to turn <strong>ON</strong> the power supply.</>,
  },
  {
    number: 5,
    text: 'Now, vary the voltage value by moving the voltage slider to the right. The readings on the voltmeters will change accordingly.',
  },
  {
    number: 6,
    text: <>Click on the <strong>'ADD'</strong> button to add the readings to the observation table.</>,
  },
  {
    number: 7,
    text: 'Repeat the reading process until at least three observations have been recorded. You may record up to five readings.',
  },
  {
    number: 8,
    text: 'Click CALCULATE to display the recorded resistance values. Select an observation, calculate the currents using the equations, and enter the current and resistance values in the verification section.',
  },
  {
    number: 9,
    text: <>In the Theoretical Verification section, select a reading to verify, enter the required calculated values, and click the <strong>'Verify'</strong> button to verify the reading. Confirm V = V₁ + V₂ = V₁ + V₃.</>,
  },
  {
    number: 10,
    text: <>Click the <strong>'Generate Report'</strong> button to generate the simulation report after completing at least one successful verification.</>,
  },
  {
    number: 11,
    text: <>Click on the <strong>'PRINT'</strong> button to print the simulation or simulation report.</>,
  },
  {
    number: 12,
    text: <>Click on the <strong>'RESET'</strong> button to refresh the simulation.</>,
  },
]

const ActionButtons = ({
  activeInstructionStep = 1,
  activeButtons = {},
  disabledButtons = {},
  onAdd,
  onAiGuide,
  onCheck,
  onVerify,
  onPrint,
  onReset,
  onAutoConnect,
}) => {
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const activeInstructionRef = useRef(null)
  const handlers = {
    onAdd,
    onCheck,
    onVerify,
    onPrint,
    onReset,
    onAutoConnect,
    onAiGuide,
  }

  useEffect(() => {
    if (!instructionsOpen || !activeInstructionRef.current) {
      return
    }

    activeInstructionRef.current.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [activeInstructionStep, instructionsOpen])

  return (
    <SectionCard className="action-buttons-card" icon="buttons" id="action-buttons-panel" title="ACTION BUTTONS">
      <div className="action-buttons__grid">
        {buttons.map(({ id, label, tone, Icon, handlerName, opensInstructions }) => {
          const handler = handlers[handlerName]
          const isActive = !opensInstructions && Boolean(activeButtons[handlerName])
          const isDisabled = !opensInstructions && (!handler || disabledButtons[handlerName])
          const buttonProps = opensInstructions
            ? {
                'aria-controls': 'experiment-instructions-panel',
                'aria-expanded': instructionsOpen,
                onClick: () => setInstructionsOpen((current) => !current),
              }
            : {
                'aria-pressed': handlerName === 'onAiGuide' ? isActive : undefined,
                onClick: handler,
                title: handlerName === 'onAiGuide' && isActive ? 'Click to stop narration' : undefined,
              }

          return (
            <button
              id={id}
              key={label}
              type="button"
              className={`action-button ${tone} ${isActive ? 'action-button--active' : ''}`}
              disabled={isDisabled}
              {...buttonProps}
            >
              <Icon />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {instructionsOpen ? (
        <div
          className="action-instructions-panel"
          id="experiment-instructions-panel"
          role="region"
          aria-labelledby="experiment-instructions-title"
        >
          <div className="action-instructions-panel__header">
            <h3 id="experiment-instructions-title">Instructions</h3>
            <button
              type="button"
              className="action-instructions-panel__close"
              aria-label="Close instructions"
              onClick={() => setInstructionsOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="action-instructions-panel__body">
            <p className="action-instructions-panel__guide">
              <strong>AI Guide: The AI guide will assist you in performing the simulation accurately at each step.</strong>
            </p>
            <ol className="action-instructions-panel__steps">
              {instructionSteps.map((step) => {
                const isActive = step.number === activeInstructionStep

                return (
                  <li
                    aria-current={isActive ? 'step' : undefined}
                    className={`action-instructions-panel__step ${isActive ? 'action-instructions-panel__step--active' : ''}`}
                    key={step.number}
                    ref={isActive ? activeInstructionRef : null}
                  >
                    <strong>STEP {step.number}:</strong> {step.text}
                    {step.substeps ? (
                      <ol className="action-instructions-panel__substeps" type="a">
                        {step.substeps.map((substep) => (
                          <li key={substep}>{substep}</li>
                        ))}
                      </ol>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

export default ActionButtons
