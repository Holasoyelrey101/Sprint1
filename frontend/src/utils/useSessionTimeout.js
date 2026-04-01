import { useEffect, useRef } from 'react'

const SESSION_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos

export function useSessionTimeout(user, onSessionExpired) {
  const timeoutRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  const resetTimeout = () => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Actualizar último tiempo de actividad
    lastActivityRef.current = Date.now()

    // Establecer nuevo timeout
    timeoutRef.current = setTimeout(() => {
      if (onSessionExpired) {
        onSessionExpired()
      }
    }, SESSION_TIMEOUT_MS)
  }

  useEffect(() => {
    if (!user) {
      // Usuario no autenticado, limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      return
    }

    // Iniciar timeout al autenticarse
    resetTimeout()

    // Eventos de actividad del usuario
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetTimeout()
    }

    // Agregar listeners para detectar actividad
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [user, onSessionExpired])
}
