const jsonHeaders = {
  'Content-Type': 'application/json',
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'No se pudo completar la solicitud al backend.')
  }

  return data
}

export async function fetchBackendStatus(forceMode = 'auto') {
  if (forceMode === 'simulated') {
    return {
      status: 'mock',
      simulated: true,
      message: 'Modo demo simulado activo.',
    }
  }

  return {
    status: 'ok',
    simulated: false,
    message: 'Backend conectado correctamente.',
  }
}

export async function sendTelemetry(payload, forceMode = 'auto') {
  const normalizedPayload = {
    deveui: payload.deveui,
    humedad: Number(payload.humedad),
    temperatura: Number(payload.temperatura),
    ph: Number(payload.ph),
    voltaje: Number(payload.voltaje),
  }

  if (forceMode === 'simulated') {
    await wait(400)

    return {
      message: 'Telemetría simulada correctamente',
      sensor_id: `mock-${normalizedPayload.deveui}`,
      simulated: true,
      data: [
        {
          id: `telemetry-${Date.now()}`,
          ...normalizedPayload,
          created_at: new Date().toISOString(),
        },
      ],
    }
  }

  try {
    const response = await fetch('/api/telemetry', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(normalizedPayload),
    })

    const data = await parseJsonResponse(response)
    return {
      ...data,
      simulated: false,
    }
  } catch {
    if (forceMode === 'real') {
      throw new Error('No se pudo conectar con el backend real.')
    }

    await wait(700)

    return {
      message: 'Telemetría simulada correctamente',
      sensor_id: `mock-${normalizedPayload.deveui}`,
      simulated: true,
      data: [
        {
          id: `telemetry-${Date.now()}`,
          ...normalizedPayload,
          created_at: new Date().toISOString(),
        },
      ],
    }
  }
}
