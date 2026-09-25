import html2PdfBundleSrc from 'html2pdf.js/dist/html2pdf.bundle.min.js?url'
import reportRuntimeSrc from './reportRuntime.js?url'
import reportStyles from './reportStyles.css?inline'

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
  verifiedCalculations,
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
  const verifiedCalculationRows = verifiedCalculations.map((calculation) => {
    const verifiedValues = calculation.calculatedVoltages

    return `<tr>
      <td>Reading ${escapeHtml(calculation.readingNumber)}</td>
      <td>${formatNumber(calculation.sourceVoltage, 3)}</td>
      <td>${formatNumber(verifiedValues.v1, 3)}</td>
      <td>${formatNumber(verifiedValues.v2, 3)}</td>
      <td>${formatNumber(verifiedValues.v3, 3)}</td>
      <td><strong>KVL Verified</strong></td>
    </tr>`
  }).join('')
  const verifiedCalculationHtml = verifiedCalculationRows ? `
    <div class="results-card results-card--verification">
      <h3>Verified Readings</h3>
      <p>All readings successfully used for KVL verification are shown below.</p>
      <div class="table-shell">
        <table class="compact-table">
          <thead><tr><th>Verified Reading</th><th>V<sub>s</sub> (V)</th><th>Calculated V<sub>1</sub> (V)</th><th>Calculated V<sub>2</sub> (V)</th><th>Calculated V<sub>3</sub> (V)</th><th>Status</th></tr></thead>
          <tbody>${verifiedCalculationRows}</tbody>
        </table>
      </div>
      <p class="verification-note"><strong>Note:</strong> The reading has been verified after rounding off the values.</p>
    </div>` : ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kirchhoff Voltage Law Simulation Report</title>
  <base href="${escapeHtml(baseHref)}">
  <style>${reportStyles}</style>
</head>
<body id="report-root">
  <main class="report-viewport">
  <article class="report-page" id="report-document">
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
                  <th>Source Voltage (V)</th>
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
  </article>
  </main>

  <div class="report-actions" data-html2canvas-ignore="true">
    <button class="print-btn" type="button">PRINT</button>
    <button class="download-btn" type="button">DOWNLOAD REPORT</button>
  </div>

  <p class="report-export-status" role="alert"></p>
  <script src="${escapeHtml(reportRuntimeSrc)}" data-pdf-library="${escapeHtml(html2PdfSrc)}" defer></script>
</body>
</html>
  `
}

export const generateKclReport = ({ observations, resistances, sessionStart, verifiedCalculations = [] }) => {
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
    verifiedCalculations,
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
