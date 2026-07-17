import SectionCard from './SectionCard.jsx'

const OBSERVATION_ROW_COUNT = 10
const emptyRows = Array.from({ length: OBSERVATION_ROW_COUNT })

const ObservationTable = ({ observations }) => (
  <SectionCard className="h-[360px]" icon="table" id="observation-table-panel" title="OBSERVATION TABLE">
    <div className="observation-table-wrap">
      <table className="observation-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Voltage (V)</th>
            <th>
              I<sub>1</sub> (A)
            </th>
            <th>
              I<sub>2</sub> (A)
            </th>
            <th>
              I<sub>3</sub> (A)
            </th>
          </tr>
        </thead>
        <tbody>
          {emptyRows.map((_, index) => {
            const row = observations[index]

            return (
              <tr key={index}>
                <td>{row?.id ?? ''}</td>
                <td>{row ? row.voltage.toFixed(1) : ''}</td>
                <td>{row ? row.i1.toFixed(3) : ''}</td>
                <td>{row ? row.i2.toFixed(3) : ''}</td>
                <td>{row ? row.i3.toFixed(3) : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </SectionCard>
)

export default ObservationTable
