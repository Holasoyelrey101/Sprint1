const jsonHeaders = {
  'Content-Type': 'application/json',
}

// Backend URL: detecta si es producción (Railway) o desarrollo (localhost)
// En Railway, siempre usa la URL hardcodeada del backend production
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    console.log('Current hostname:', hostname)
    
    // Si estamos en cualquier dominio railway y el hostname tiene "frontend", apunta al backend
    if (hostname.includes('railway') && (hostname.includes('frontend') || hostname.includes('production'))) {
      console.log('Detectado Railway: usando backend-production-3697.up.railway.app')
      return 'https://backend-production-3697.up.railway.app'
    }
    
    // En desarrollo: localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('Detectado localhost: usando http://localhost:8000')
      return 'http://localhost:8000'
    }
  }
  
  // Default a localhost si no se puede determinar
  return 'http://localhost:8000'
}

const backendUrl = getBackendUrl()

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
    const response = await fetch(`${backendUrl}/api/telemetry`, {
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