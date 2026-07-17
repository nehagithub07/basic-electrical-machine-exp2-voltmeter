
import Voltmeter from './Voltmeter.jsx'
import PowerSupply from './PowerSupply.jsx'

const EquipmentPanel = ({
  connectedTerminalIds = [],
  highlightedTerminalIds = [],
  onTogglePower,
  powerOn,
  readings,
  setVoltage,
  voltage,
}) => (
  <section className="equipment-panel" id="equipment-panel">
    <PowerSupply
      connectedTerminalIds={connectedTerminalIds}
      highlightedTerminalIds={highlightedTerminalIds}
      onTogglePower={onTogglePower}
      powerOn={powerOn}
      setVoltage={setVoltage}
      voltage={voltage}
    />

    <div className="voltmeter-bank" id="voltmeter-bank" aria-label="V1, V2, and V3 voltmeters">
      <Voltmeter connectedTerminalIds={connectedTerminalIds} highlightedTerminalIds={highlightedTerminalIds} label="V1" value={readings.V1} />
      <Voltmeter connectedTerminalIds={connectedTerminalIds} highlightedTerminalIds={highlightedTerminalIds} label="V2" value={readings.V2} />
      <Voltmeter connectedTerminalIds={connectedTerminalIds} highlightedTerminalIds={highlightedTerminalIds} label="V3" value={readings.V3} />
    </div>
  </section>
)

export default EquipmentPanel
