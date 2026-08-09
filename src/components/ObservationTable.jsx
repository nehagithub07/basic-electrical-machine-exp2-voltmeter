import { memo } from 'react'
import SectionCard from './SectionCard.jsx'

const OBSERVATION_ROW_COUNT = 5
const emptyRows = Array.from({ length: OBSERVATION_ROW_COUNT })
const formatReading = (value, fractionDigits = 3) => String(Number(value.toFixed(fractionDigits)))

const ObservationTable = ({ observations }) => (
  <SectionCard className="observation-table-card" icon="table" id="observation-table-panel" title="OBSERVATION TABLE">
    <div className="observation-table-wrap">
      <table className="observation-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Source Voltage (V)</th>
            <th>
              V<sub>1</sub> (V)
            </th>
            <th>
              V<sub>2</sub> (V)
            </th>
            <th>
              V<sub>3</sub> (V)
            </th>
          </tr>
        </thead>
        <tbody>
          {emptyRows.map((_, index) => {
            const row = observations[index]

            return (
              <tr key={index}>
                <td>{row?.id ?? ''}</td>
                <td>{row ? formatReading(row.voltage, 1) : ''}</td>
                <td>{row ? formatReading(row.v1) : ''}</td>
                <td>{row ? formatReading(row.v2) : ''}</td>
                <td>{row ? formatReading(row.v3) : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </SectionCard>
)

export default memo(ObservationTable)
