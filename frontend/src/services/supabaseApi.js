const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim()

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseKey)
}

async function parseResponse(response) {
  const data = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error(data?.message || 'No se pudo consultar Supabase.')
  }

  return data
}

export async function fetchSupabaseTelemetry() {
  if (!hasSupabaseConfig()) {
    return []
  }

  const query = new URLSearchParams({
    // columnas de la tabla `lectura_cultivos`
    select: 'id,created_at,temperatura,humedad_aire,humedad_suelo',
    order: 'created_at.desc',
    limit: '50',
  })

  // Consultar la tabla `lecturas_cultivo` en Supabase
  const response = await fetch(
    `${supabaseUrl}/rest/v1/lecturas_cultivo?${query.toString()}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
      },
    },
  )

  return parseResponse(response)
}

export function isSupabaseConfigured() {
  return hasSupabaseConfig()
}