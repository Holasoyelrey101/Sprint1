function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function exportTelemetryToExcel(rows) {
  if (!rows || rows.length === 0) return false

  const first = rows[0]
  const isSupabase = Object.prototype.hasOwnProperty.call(first, 'humedad_aire') || Object.prototype.hasOwnProperty.call(first, 'humedad_suelo')

  if (isSupabase) {
    const header = ['ID', 'Fecha', 'Temperatura', 'Humedad aire', 'Humedad suelo']
    const tableRows = rows
      .map((row) => `
        <tr>
          <td>${escapeHtml(row.id ?? '')}</td>
          <td>${escapeHtml(row.created_at ? new Date(row.created_at).toLocaleString() : '')}</td>
          <td>${escapeHtml(row.temperatura ?? '')}</td>
          <td>${escapeHtml(row.humedad_aire ?? '')}</td>
          <td>${escapeHtml(row.humedad_suelo ?? '')}</td>
        </tr>`)
      .join('')

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #cfd8d3; padding: 8px; text-align: left; }
            th { background: #eaf4ef; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>`

    downloadFile(html, 'telemetria_lecturas.xls', 'application/vnd.ms-excel;charset=utf-8;')
    return true
  }

  // Legacy format
  const header = ['DevEUI', 'Humedad', 'Temperatura', 'pH', 'Voltaje', 'Sensor ID', 'Origen', 'Fecha']
  const tableRows = rows
    .map((row) => `
      <tr>
        <td>${escapeHtml(row.deveui)}</td>
        <td>${escapeHtml(row.humedad)}</td>
        <td>${escapeHtml(row.temperatura)}</td>
        <td>${escapeHtml(row.ph)}</td>
        <td>${escapeHtml(row.voltaje)}</td>
        <td>${escapeHtml(row.sensorId)}</td>
        <td>${escapeHtml(row.simulated ? 'Simulado' : 'Backend')}</td>
        <td>${escapeHtml(row.createdAtLabel)}</td>
      </tr>`)
    .join('')

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #cfd8d3; padding: 8px; text-align: left; }
          th { background: #eaf4ef; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>`

  downloadFile(html, 'telemetria.xls', 'application/vnd.ms-excel;charset=utf-8;')
  return true
}

export function exportTelemetryToPdf(rows) {
  if (!rows || rows.length === 0) return false

  const first = rows[0]
  const isSupabase = Object.prototype.hasOwnProperty.call(first, 'humedad_aire') || Object.prototype.hasOwnProperty.call(first, 'humedad_suelo')

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return false

  if (isSupabase) {
    const lines = rows
      .map((row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.id ?? '')}</td>
          <td>${escapeHtml(row.created_at ? new Date(row.created_at).toLocaleString() : '')}</td>
          <td>${escapeHtml(row.temperatura ?? '')}</td>
          <td>${escapeHtml(row.humedad_aire ?? '')}</td>
          <td>${escapeHtml(row.humedad_suelo ?? '')}</td>
        </tr>`)
      .join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de lecturas</title>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #20312b; }
            h1 { margin-bottom: 8px; }
            p { color: #5b6a64; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d5e0da; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #edf7f1; }
          </style>
        </head>
        <body>
          <h1>Reporte de lecturas</h1>
          <p>Exportado desde el dashboard de monitoreo.</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Fecha</th>
                <th>Temperatura</th>
                <th>Humedad aire</th>
                <th>Humedad suelo</th>
              </tr>
            </thead>
            <tbody>${lines}</tbody>
          </table>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    return true
  }

  const lines = rows
    .map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.deveui)}</td>
        <td>${escapeHtml(row.humedad)}</td>
        <td>${escapeHtml(row.temperatura)}</td>
        <td>${escapeHtml(row.ph)}</td>
        <td>${escapeHtml(row.voltaje)}</td>
        <td>${escapeHtml(row.sensorId)}</td>
        <td>${escapeHtml(row.simulated ? 'Simulado' : 'Backend')}</td>
        <td>${escapeHtml(row.createdAtLabel)}</td>
      </tr>`)
    .join('')

  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de telemetría</title>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #20312b; }
          h1 { margin-bottom: 8px; }
          p { color: #5b6a64; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d5e0da; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #edf7f1; }
        </style>
      </head>
      <body>
        <h1>Reporte de telemetría</h1>
        <p>Exportado desde el dashboard de monitoreo.</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>DevEUI</th>
              <th>Humedad</th>
              <th>Temperatura</th>
              <th>pH</th>
              <th>Voltaje</th>
              <th>Sensor ID</th>
              <th>Origen</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>${lines}</tbody>
        </table>
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  return true
}
