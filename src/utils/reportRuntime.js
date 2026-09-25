(() => {
  const pdfLibrarySrc = document.currentScript.dataset.pdfLibrary
  const sheet = document.getElementById('report-document')
  const printButton = document.querySelector('.print-btn')
  const downloadButton = document.querySelector('.download-btn')
  const exportStatus = document.querySelector('.report-export-status')
  const pageMarginMm = 8
  const pixelsPerMm = 96 / 25.4
  let pdfLibraryPromise

  const fitReport = () => {
    const width = sheet.offsetWidth
    const height = sheet.offsetHeight + 1
    const screenScale = Math.min(1, (document.documentElement.clientWidth - 28) / width)
    const printScale = Math.min(
      (210 - 2 * pageMarginMm) * pixelsPerMm / width,
      ((297 - 2 * pageMarginMm) * pixelsPerMm - 1) / height,
    )
    const style = document.documentElement.style

    style.setProperty('--screen-scale', screenScale)
    style.setProperty('--screen-width', `${width * screenScale}px`)
    style.setProperty('--screen-height', `${height * screenScale}px`)
    style.setProperty('--print-scale', printScale)
    style.setProperty('--print-width', `${width * printScale}px`)
    style.setProperty('--print-height', `${height * printScale}px`)
  }

  const assetsReady = Promise.all([
    document.fonts.ready,
    ...Array.from(sheet.querySelectorAll('img'), (image) => image.decode()),
  ])

  const ensurePdfLibrary = () => {
    if (window.html2pdf) return Promise.resolve()
    if (pdfLibraryPromise) return pdfLibraryPromise

    pdfLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = pdfLibrarySrc
      script.onload = resolve
      script.onerror = () => {
        script.remove()
        pdfLibraryPromise = null
        reject(new Error('Unable to load the PDF library.'))
      }
      document.head.appendChild(script)
    })
    return pdfLibraryPromise
  }

  const setBusy = (busy) => {
    printButton.disabled = busy
    downloadButton.disabled = busy
    downloadButton.textContent = busy ? 'PREPARING PDF…' : 'DOWNLOAD REPORT'
  }

  printButton.addEventListener('click', async () => {
    try {
      await assetsReady
      fitReport()
      window.print()
    } catch {
      exportStatus.textContent = 'The report images could not be loaded. Please reopen the report and try again.'
    }
  })

  downloadButton.addEventListener('click', async () => {
    if (downloadButton.disabled) return
    setBusy(true)
    exportStatus.textContent = ''
    let renderWorker

    try {
      await Promise.all([assetsReady, ensurePdfLibrary()])
      // Capture the original sheet at its screen layout width, without changing
      // the visible preview or reflowing it to the PDF library's page width.
      renderWorker = window.html2pdf().set({
        pagebreak: { mode: [] },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 1024,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDocument) => {
            const clonedSheet = clonedDocument.querySelector('.html2pdf__container .report-page')
            clonedSheet.style.transform = 'none'
          },
        },
      }).from(sheet).toContainer()

      await renderWorker.get('container', (container) => {
        container.style.width = `${sheet.offsetWidth}px`
        container.querySelector('.report-page').style.transform = 'none'
      })
      const canvas = await renderWorker.toCanvas().get('canvas')
      const pdfWorker = window.html2pdf().set({
        margin: pageMarginMm,
        filename: 'KVL Simulation Report.pdf',
        image: { type: 'png' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: [] },
        enableLinks: false,
      })
      const pageSize = await pdfWorker.get('pageSize')
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      // Match the library's integer page height to prevent a blank second page.
      pageCanvas.height = Math.floor(pageCanvas.width * pageSize.inner.ratio)
      const scale = Math.min(1, (pageCanvas.height - 2) / canvas.height)
      const context = pageCanvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      context.drawImage(canvas, 0, 0, canvas.width * scale, canvas.height * scale)
      await pdfWorker.from(pageCanvas, 'canvas').save()
    } catch {
      exportStatus.textContent = 'Unable to download the report. Please try again or use PRINT and choose Save as PDF.'
    } finally {
      if (renderWorker) {
        await renderWorker.get('overlay', (overlay) => overlay?.remove()).catch(() => {})
      }
      setBusy(false)
    }
  })

  window.addEventListener('resize', fitReport)
  window.addEventListener('beforeprint', fitReport)
  new ResizeObserver(fitReport).observe(sheet)
  fitReport()
  assetsReady.then(fitReport).catch(() => {
    exportStatus.textContent = 'The report images could not be loaded. Please reopen the report and try again.'
  })
})()
