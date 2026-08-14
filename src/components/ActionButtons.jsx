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
    text: 'Make connections by dragging nodes from the apparatus to the circuit.',
    substeps: [
      'Connect the power supply to the circuit (1-9, 2-10).',
      'Connect voltmeters (3-11, 4-12), (5-13, 6-14), and (7-15, 8-16), or connect any voltmeter to any resistance in the circuit.',
      'Click on a label to delete all connections for the corresponding node.',
    ],
  },
  {
    number: 2,
    text: <>Check your connections by clicking on the <strong>'CHECK'</strong> button.</>,
  },
  {
    number: 3,
    text: 'Set the values of resistances R1, R2, and R3 by adjusting the sliders on the left. These values will remain constant throughout the experiment.',
  },
  {
    number: 4,
    text: <>Click on the <strong>'Power'</strong> button to turn on the power supply.</>,
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
    text: 'Select an observation, calculate R, I₁, I₂, I₃, V₁, V₂, and V₃, then enter them in the calculation section.',
  },
  {
    number: 9,
    text: <>Click <strong>'VERIFY'</strong> and confirm V = V₁ + V₂ = V₁ + V₃.</>,
  },
  {
    number: 10,
    text: <>Click on the <strong>'PRINT'</strong> button to print the page.</>,
  },
  {
    number: 11,
    text: <>Click on the <strong>'RESET'</strong> button to refresh the page.</>,
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
