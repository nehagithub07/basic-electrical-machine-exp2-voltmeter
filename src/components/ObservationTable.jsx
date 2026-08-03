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
            <th>Voltage</th>
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
                <td>{row ? row.voltage.toFixed(1) : ''}</td>
                <td>{row ? row.v1.toFixed(3) : ''}</td>
                <td>{row ? row.v2.toFixed(3) : ''}</td>
                <td>{row ? row.v3.toFixed(3) : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </SectionCard>
)

export default ObservationTable
