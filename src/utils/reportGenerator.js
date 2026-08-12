import html2PdfBundleSrc from 'html2pdf.js/dist/html2pdf.bundle.min.js?url'

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const toNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

const formatNumber = (value, fractionDigits = 3) => String(Number(toNumber(value).toFixed(fractionDigits)))

const formatResistance = (value) => formatNumber(value, 1)

const getSessionDurationText = (sessionStart, sessionEnd) => {
  const durationMs = Math.max(0, sessionEnd - sessionStart)
  const durationTotalSeconds = Math.floor(durationMs / 1000)
  const durationMinutes = Math.floor(durationTotalSeconds / 60)
  const durationSeconds = durationTotalSeconds % 60

  return `${durationMinutes} min ${String(durationSeconds).padStart(2, '0')} sec`
}

const createObservationRows = (observations) => (
  observations.map((row, index) => {
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${formatNumber(row.voltage, 1)}</td>
        <td>${formatNumber(row.v1 ?? row.i1 * row.r1)}</td>
        <td>${formatNumber(row.v2 ?? row.i2 * row.r2)}</td>
        <td>${formatNumber(row.v3 ?? row.i3 * row.r3)}</td>
      </tr>
    `
  }).join('')
)

const createReportHtml = ({
  baseHref,
  html2PdfSrc,
  iitLogoSrc,
  observations,
  resistances,
  sessionStart,
  verifiedCalculation,
  virtualLabsLogoSrc,
}) => {
  const reportDate = new Date()
  const sessionEnd = reportDate.getTime()
  const reportDateText = reportDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const startTimeText = new Date(sessionStart).toLocaleTimeString()
  const endTimeText = reportDate.toLocaleTimeString()
  const durationText = getSessionDurationText(sessionStart, sessionEnd)
  const firstObservation = observations[0] ?? {}
  const r1 = toNumber(resistances?.r1 ?? firstObservation.r1)
  const r2 = toNumber(resistances?.r2 ?? firstObservation.r2)
  const r3 = toNumber(resistances?.r3 ?? firstObservation.r3)
  const observationRows = createObservationRows(observations)
  const verifiedValues = verifiedCalculation?.calculatedVoltages
  const verifiedCalculationHtml = verifiedCalculation && verifiedValues ? `
    <div class="results-card results-card--verification">
      <h3>Verified Reading and Calculated Values</h3>
      <p>Reading <strong>${escapeHtml(verifiedCalculation.readingNumber)}</strong>, with user-selected supply voltage
        <strong>${formatNumber(verifiedCalculation.sourceVoltage, 1)} V</strong>, was used for KVL verification.</p>
      <div class="table-shell">
        <table class="compact-table">
          <thead><tr><th>Verified Reading</th><th>V<sub>s</sub> (V)</th><th>Calculated V<sub>1</sub> (V)</th><th>Calculated V<sub>2</sub> (V)</th><th>Calculated V<sub>3</sub> (V)</th><th>Status</th></tr></thead>
          <tbody><tr>
            <td>Reading ${escapeHtml(verifiedCalculation.readingNumber)}</td>
            <td>${formatNumber(verifiedCalculation.sourceVoltage, 3)}</td>
            <td>${formatNumber(verifiedValues.v1, 3)}</td>
            <td>${formatNumber(verifiedValues.v2, 3)}</td>
            <td>${formatNumber(verifiedValues.v3, 3)}</td>
            <td><strong>KVL Verified</strong></td>
          </tr></tbody>
        </table>
      </div>
    </div>` : ''

  const css = `
body {
  font-family: 'Inter', 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, #eef4fb 0%, #f7f9fc 100%);
  color: #1f2d3d;
  margin: 0;
  padding: 18px 14px 30px;
  font-size: 14px;
  line-height: 1.42;
  overflow-wrap: break-word;
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
.report-page {
  width: min(100%, 960px);
  margin: 0 auto 18px;
  padding: 22px 26px;
  background-color: #ffffff;
  border-radius: 16px;
  border: 1px solid #d3ddea;
  box-shadow: 0 12px 28px rgba(23, 50, 77, 0.1);
  break-inside: avoid-page;
  page-break-inside: avoid;
  overflow: visible;
  background-clip: padding-box;
}
.report-page:last-of-type {
  margin-bottom: 0;
}
.report-page--results {
  break-before: page;
  page-break-before: always;
}
h1,
h2,
h3 {
  color: #1f2d3d;
  margin-top: 0;
  font-weight: 700;
}
h1 {
  font-size: 28px;
  margin: 0;
  padding: 0;
  line-height: 1.15;
}
h2 {
  font-size: 20px;
  margin-bottom: 12px;
  color: #243b53;
}
h3 {
  font-size: 15px;
  margin-bottom: 7px;
  color: #2d4b68;
}
p {
  margin: 0 0 8px;
}
li {
  margin-bottom: 4px;
  text-align: justify;
}
.section {
  background: linear-gradient(180deg, #f9fbfe 0%, #f4f7fb 100%);
  padding: 16px 18px;
  margin-bottom: 14px;
  border-radius: 12px;
  border: none;
  box-shadow: none;
  break-inside: auto;
  page-break-inside: auto;
  background-clip: padding-box;
}
.section:last-child {
  margin-bottom: 0;
}
.section > h2:first-child {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e1e9f3;
}
.label {
  font-weight: 600;
  color: #1f2d3d;
}
ul {
  padding-left: 20px;
  margin: 7px 0 0;
}
.two-column-list {
  column-count: 2;
  column-gap: 32px;
  list-style-position: inside;
  margin-top: 10px;
}
.report-overview-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.report-stamp {
  margin: 0;
  padding: 7px 11px;
  border-radius: 999px;
  background: #ffffff;
  border: none;
  color: #50657c;
  font-size: 13px;
  font-weight: 600;
}
.report-experiment-label {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
  color: #60778f;
  font-weight: 700;
}
.report-experiment-title {
  margin: 0 0 14px;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 700;
  color: #16324b;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.info-card {
  background: #fff;
  border: none;
  border-radius: 9px;
  padding: 10px 12px;
  box-shadow: none;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 4px;
}
.table-shell {
  display: block;
  width: 100%;
  align-self: stretch;
  overflow-x: auto;
  overflow-y: visible;
  border: none;
  border-radius: 12px;
  max-width: 100%;
  background: #ffffff;
  box-shadow: none;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0;
  box-shadow: none;
  background-color: white;
  table-layout: auto;
}
th,
td {
  border: 1px solid #d9e2ec;
  padding: 9px 10px;
  text-align: center;
  font-size: 13px;
  vertical-align: middle;
  overflow-wrap: anywhere;
  word-break: break-word;
}
th {
  background: linear-gradient(135deg, #2f7bfa 0%, #1f62d0 100%);
  border-color: #c6d7ec;
  border-bottom-color: #b4cae5;
  color: white;
  font-weight: 700;
  letter-spacing: 0;
}
thead {
  display: table-header-group;
}
tbody {
  display: table-row-group;
}
tr {
  break-inside: avoid-page;
  page-break-inside: avoid;
}
tr:nth-child(even) {
  background-color: #f8fbff;
}
.results-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.results-card {
  background: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 14px;
  box-shadow: none;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 9px;
  overflow: visible;
  background-clip: padding-box;
}
.results-card h3 {
  margin: 0;
  text-align: left;
  padding-bottom: 0;
  border-bottom: none;
}
.results-card--table {
  break-inside: auto;
  page-break-inside: auto;
}
.results-card--graph {
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.compact-table {
  margin-top: 0;
}
.compact-table th,
.compact-table td {
  padding: 8px 10px;
  font-size: 13px;
}
.graph {
  text-align: center;
  margin-top: 0;
}
.report-graph-card {
  padding: 14px;
}
.report-graph-card #report-graph {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  width: 100%;
  min-height: 340px;
  padding: 8px 0 0;
  background: linear-gradient(180deg, #f8fbfe 0%, #eef5fb 100%);
  border: none;
  border-radius: 12px;
  overflow: visible;
  background-clip: padding-box;
  box-shadow: none;
}
.report-graph-card #report-graph > * {
  max-width: 100%;
}
.report-graph-card #report-graph em {
  color: #5e738c;
  font-style: normal;
  font-weight: 600;
}
.report-graph__image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}
.report-graph__svg {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}
.report-graph__plot-bg {
  fill: #fffdf8;
  stroke: rgba(112, 82, 55, 0.28);
  stroke-width: 1;
}
.report-graph__band:nth-of-type(odd) {
  fill: rgba(51, 124, 102, 0.035);
}
.report-graph__band:nth-of-type(even) {
  fill: rgba(210, 78, 58, 0.025);
}
.report-graph__axis {
  fill: none;
  stroke: #563927;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.4;
}
.report-graph__svg marker path {
  fill: #563927;
}
.report-graph__grid {
  stroke: rgba(117, 88, 62, 0.2);
  stroke-width: 0.8;
}
.report-graph__grid--horizontal {
  stroke-dasharray: 4 8;
}
.report-graph__tick {
  stroke: rgba(74, 43, 31, 0.38);
  stroke-linecap: round;
  stroke-width: 1;
}
.report-graph__tick-label {
  fill: #6a4b34;
  font-size: 13px;
  font-weight: 700;
}
.report-graph__tick-label--y {
  font-size: 12px;
}
.report-graph__axis-title {
  fill: #38271c;
  font-size: 15px;
  font-weight: 800;
}
.report-graph__line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}
.report-graph__line--i1,
.report-graph__point--i1 {
  stroke: #c83f35;
}
.report-graph__line--i2,
.report-graph__point--i2 {
  stroke: #1579a8;
}
.report-graph__line--i3,
.report-graph__point--i3 {
  stroke: #3f8f43;
}
.report-graph__point {
  fill: #ffffff;
  stroke-width: 1.6;
}
.report-graph__series-label {
  dominant-baseline: middle;
  font-size: 13px;
  font-weight: 800;
  paint-order: stroke;
  stroke: #fffdf8;
  stroke-linejoin: round;
  stroke-width: 5px;
}
.report-graph__series-label--i1 {
  fill: #c83f35;
}
.report-graph__series-label--i2 {
  fill: #1579a8;
}
.report-graph__series-label--i3 {
  fill: #3f8f43;
}
.report-graph__series-label-sub {
  baseline-shift: sub;
  font-size: 72%;
}
.header-row {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr) 108px;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.report-title-block {
  text-align: center;
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 3px solid #2f7bfa;
  min-width: 0;
}
.report-title-block h1 {
  font-size: 25px;
}
.report-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #5c6f84;
}
.badge {
  margin: 0;
  padding: 7px 12px;
  border-radius: 20px;
  background: #e8f1ff;
  color: #1f62d0;
  font-weight: 600;
  font-size: 12px;
}
.report-logo {
  height: auto;
  width: auto;
  max-width: 108px;
  max-height: 84px;
  object-fit: contain;
  flex-shrink: 0;
  justify-self: center;
}
.report-logo--virtual-labs {
  max-width: 190px;
  max-height: 86px;
  justify-self: start;
}
.report-logo--iit {
  max-width: 88px;
  max-height: 88px;
  justify-self: end;
}
.report-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  width: min(100%, 960px);
  margin: 20px auto 0;
}
.print-btn,
.download-btn {
  padding: 12px 24px;
  font-size: 15px;
  border: none;
  border-radius: 30px;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
}
.print-btn {
  background: linear-gradient(to right, #2f7bfa, #1f62d0);
}
.download-btn {
  background: linear-gradient(to right, #28a745, #1f8d38);
}
.print-btn:hover,
.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(31, 45, 61, 0.12);
}
.pdf-exporting .report-page {
  width: 186mm !important;
  height: 273mm !important;
  border-color: transparent !important;
  box-shadow: none !important;
  margin: 0 !important;
  padding: 0 !important;
  break-inside: auto !important;
  page-break-inside: auto !important;
}
.pdf-exporting .section,
.pdf-exporting .results-card,
.pdf-exporting .table-shell,
.pdf-exporting .report-graph-card #report-graph {
  overflow: visible !important;
}
.pdf-exporting .report-document {
  width: 186mm !important;
}
.pdf-exporting .report-page--results {
  height: 272mm !important;
  break-before: auto !important;
  page-break-before: auto !important;
}
.pdf-exporting .graphs-conclusion-section {
  display: block;
  break-before: auto !important;
  page-break-before: auto !important;
}
.pdf-exporting .report-graph-card,
.pdf-exporting .results-card--verification,
.pdf-exporting .results-card--conclusion,
.pdf-exporting thead,
.pdf-exporting tr {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}
@media (max-width: 768px) {
  body {
    padding: 20px 14px 30px;
  }
  .report-page {
    margin-bottom: 18px;
    padding: 20px 18px;
    border-radius: 16px;
  }
  .header-row {
    grid-template-columns: 1fr;
    gap: 14px;
    text-align: center;
  }
  .report-title-block {
    padding-bottom: 12px;
  }
  .report-logo,
  .report-logo--virtual-labs,
  .report-logo--iit {
    max-height: 72px;
    justify-self: center;
  }
  .two-column-list {
    column-count: 1;
    column-gap: 0;
  }
  .compact-table th,
  .compact-table td {
    padding: 9px 8px;
    font-size: 13px;
  }
  .report-actions {
    justify-content: center;
  }
  .report-graph-card #report-graph {
    min-height: 300px;
  }
}
@media print {
  @page {
    size: A4;
    margin: 12mm;
  }
  *,
  *::before,
  *::after {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
  .print-btn,
  .download-btn,
  .report-actions {
    display: none !important;
  }
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    overflow: visible;
    font-size: 13px;
    line-height: 1.38;
  }
  .report-document {
    width: 100%;
  }
  .report-page {
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    box-shadow: none;
    border-radius: 0;
    break-inside: auto;
    page-break-inside: auto;
  }
  .report-page--results {
    break-before: page;
    page-break-before: always;
  }
  .graphs-conclusion-section {
    display: block;
    break-before: auto;
    page-break-before: auto;
  }
  .section {
    margin-bottom: 8px;
    padding: 8px 12px;
  }
  .section > h2:first-child {
    margin-bottom: 6px;
    padding-bottom: 5px;
  }
  h2 {
    font-size: 18px;
  }
  h3 {
    margin-bottom: 5px;
    font-size: 14px;
  }
  p {
    margin-bottom: 6px;
  }
  .header-row {
    grid-template-columns: 140px minmax(0, 1fr) 72px;
    gap: 14px;
    margin-bottom: 8px;
  }
  .report-logo,
  .report-logo--virtual-labs,
  .report-logo--iit {
    max-height: 64px;
  }
  .report-logo--virtual-labs {
    max-width: 140px;
  }
  .report-logo--iit {
    max-width: 72px;
  }
  .report-title-block {
    padding-bottom: 6px;
  }
  .report-experiment-title {
    margin-bottom: 6px;
    font-size: 20px;
  }
  .report-overview-top {
    margin-bottom: 5px;
  }
  .info-grid {
    gap: 7px;
    margin-top: 5px;
  }
  .info-card {
    padding: 7px 9px;
  }
  .two-column-list {
    column-count: 2 !important;
    column-gap: 26px;
    margin-top: 7px;
  }
  li {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 2px;
  }
  .results-stack {
    gap: 8px;
  }
  .results-card {
    gap: 6px;
    padding: 10px;
  }
  .compact-table th,
  .compact-table td {
    padding: 5px 7px;
    font-size: 12px;
    line-height: 1.3;
  }
  .report-graph-card #report-graph {
    width: 100%;
    height: 320px;
    min-height: 0;
    overflow: hidden;
  }
  .report-graph__svg,
  .report-graph__image {
    display: block;
    width: 100%;
    height: 320px;
    object-fit: contain;
  }
  h1,
  h2,
  h3,
  .report-title-block,
  .header-row,
  .info-grid,
  .report-graph-card,
  .results-card--verification,
  .results-card--conclusion,
  .graph,
  thead,
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
  `

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kirchhoff Voltage Law Simulation Report</title>
  <base href="${escapeHtml(baseHref)}">
  <style>${css}</style>
</head>
<body id="report-root">
  <main class="report-document" id="report-document">
  <div class="report-page report-page--overview">
    <div class="header-row">
      <img src="${escapeHtml(virtualLabsLogoSrc)}" class="report-logo report-logo--virtual-labs" alt="Virtual Labs logo">
      <div class="report-title-block">
        <h1>Virtual Labs Simulation Report</h1>
       
      </div>
      <img src="${escapeHtml(iitLogoSrc)}" class="report-logo report-logo--iit" alt="Indian Institute of Technology Roorkee logo">
    </div>

    <div class="section report-overview">
      <div class="report-overview-top">
        <p class="badge">AI Enhanced Basic Electrical Science Lab</p>
        <p class="report-stamp">Generated on ${escapeHtml(reportDateText)}</p>
      </div>
      <p class="report-experiment-label">Experiment Title</p>
      <p class="report-experiment-title">To Verify Kirchhoff's VOLTAGE Law</p>
      <div class="info-grid">
        <div class="info-card"><span class="label">Start Time:</span>${escapeHtml(startTimeText)}</div>
        <div class="info-card"><span class="label">End Time:</span>${escapeHtml(endTimeText)}</div>
        <div class="info-card"><span class="label">Total Time Spent:</span>${escapeHtml(durationText)}</div>
      </div>
    </div>

    <div class="section">
      <h2>Summary</h2>
      <h3>Aim</h3>
      <p style="text-align: justify;">To verify Kirchhoff’s Voltage Law in a resistive DC circuit by observing that the sum of the voltage drops is equal to the applied source voltage.</p>
      <h3>Simulation Summary</h3>
      <p style="text-align: justify;">The guided walkthrough familiarised the user with the simulation's interface. The circuit was connected, and the connections were verified successfully. The resistance values were selected, and the DC supply voltage was varied to measure the voltage across each resistor at different supply voltage values. The voltmeter readings were recorded, and the measured voltages were used to verify Kirchhoff’s Voltage Law (KVL) by verifying that the algebraic sum of the voltage rises and voltage drops around the closed loop is zero.</p>

      <h3>Components and Key Parameters</h3>
      <ul class="two-column-list">
        <li>DC power supply: 1–15 V</li>
        <li>DC Voltmeter V<sub>1</sub> for the voltage drop across R<sub>1</sub>: 0 - 20 V</li>
        <li>DC Voltmeter V<sub>2</sub> for the voltage drop across R<sub>2</sub>: 0 - 20 V</li>
        <li>DC Voltmeter V<sub>3</sub> for the voltage drop across R<sub>3</sub>: 0 - 20 V</li>
        <li>R<sub>1</sub>: ${formatResistance(r1 * 1000)} &Omega;</li>
        <li>R<sub>2</sub>: ${formatResistance(r2 * 1000)} &Omega;</li>
        <li>R<sub>3</sub>: ${formatResistance(r3 * 1000)} &Omega;</li>
        <li>Connecting leads</li>
      </ul>

    </div>
  </div>

  <div class="report-page report-page--results">
    <div class="section results-section">
      <h2>Results</h2>
      <div class="results-stack">
        <div class="results-card results-card--table">
          <h3>Observation Table</h3>
          <div class="table-shell">
            <table class="compact-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Voltage (Power supply)</th>
                  <th>V<sub>1</sub> (V)</th>
                  <th>V<sub>2</sub> (V)</th>
                  <th>V<sub>3</sub> (V)</th>
                </tr>
              </thead>
              <tbody>${observationRows}</tbody>
            </table>
          </div>
        </div>

        ${verifiedCalculationHtml}

        <div class="graphs-conclusion-section">
          <div class="results-card results-card--conclusion">
            <h3>Conclusion</h3>
            <p style="text-align: justify;">For each recorded supply voltage value, the sum of the voltage drops across the resistors was found to be equal to the applied source voltage. Hence, Kirchhoff's Voltage Law (KVL) was successfully verified for the given resistive DC circuit.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  </main>

  <div class="report-actions" data-html2canvas-ignore="true">
    <button class="print-btn" type="button" onclick="window.print()">PRINT</button>
    <button class="download-btn" type="button" onclick="downloadReport()">DOWNLOAD REPORT</button>
  </div>

  <script>
    function ensureHtml2Pdf() {
      return new Promise(function(resolve, reject) {
        if (window.html2pdf) return resolve();
        var script = document.createElement('script');
        script.src = ${JSON.stringify(html2PdfSrc)};
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    function downloadReport() {
      ensureHtml2Pdf().then(function() {
        var element = document.getElementById('report-document') || document.body;
        document.body.classList.add('pdf-exporting');
        var opts = {
          margin: [12, 12, 12, 12],
          filename: 'kvl-simulation-report.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            scrollX: 0,
            scrollY: 0,
            onclone: function(clonedDoc) {
              clonedDoc.body.classList.add('pdf-exporting');
            }
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: {
            mode: ['legacy']
          }
        };
        return window.html2pdf().set(opts).from(element).save().finally(function() {
          document.body.classList.remove('pdf-exporting');
        });
      }).catch(function() {
        document.body.classList.remove('pdf-exporting');
        alert('Unable to download the report automatically. Please use your browser\\'s Save as PDF option.');
      });
    }
  </script>
</body>
</html>
  `
}

export const generateKclReport = ({ observations, resistances, sessionStart, verifiedCalculation }) => {
  const baseHref = new URL(import.meta.env.BASE_URL, window.location.origin).href
  const iitLogoSrc = new URL('../assets/IIT Logo.png', import.meta.url).href
  const virtualLabsLogoSrc = new URL('../assets/image.png', import.meta.url).href
  const reportHtml = createReportHtml({
    baseHref,
    html2PdfSrc: html2PdfBundleSrc,
    iitLogoSrc,
    observations,
    resistances,
    sessionStart,
    verifiedCalculation,
    virtualLabsLogoSrc,
  })
  const reportBlob = new Blob([reportHtml], { type: 'text/html' })
  const reportUrl = URL.createObjectURL(reportBlob)
  const reportWindow = window.open(reportUrl, '_blank')

  if (!reportWindow) {
    URL.revokeObjectURL(reportUrl)
    return false
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(reportUrl)
  }, 60000)
  reportWindow.focus()

  return true
}
