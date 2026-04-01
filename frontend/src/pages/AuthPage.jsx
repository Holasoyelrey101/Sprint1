import { useMemo, useState } from 'react'
import { AuthTabs } from '../components/auth/AuthTabs'
import { LoginForm } from '../auth/login/LoginForm'
import { RegisterForm } from '../auth/register/RegisterForm'
import { loginUser, registerUser } from '../services/authApi'
import './auth-page.css'

const initialRegister = {
  name: '',
  email: '',
  role: 'Agrónomo',
  password: '',
  confirmPassword: '',
}

export function AuthPage({ mode, onModeChange, onAccess }) {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState(initialRegister)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  const registerValid = useMemo(
    () =>
      registerData.name &&
      registerData.email &&
      registerData.password &&
      registerData.confirmPassword &&
      registerData.password === registerData.confirmPassword,
    [registerData],
  )

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    setIsSubmitting(true)
    setAuthError('')

    try {
      const result = await loginUser(loginData)
      onAccess(result)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()
    if (!registerValid) return

    setIsSubmitting(true)
    setAuthError('')

    try {
      const result = await registerUser(registerData)
      onAccess(result)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-layout">
        <aside className="auth-showcase">
          <span className="eyebrow">Plataforma de monitoreo</span>
          <h1>Gestión inteligente de embalses y telemetría agrícola</h1>
          <p>
            Interfaz base para centralizar sensores, alertas y operación del sistema en un solo lugar.
          </p>

          <div className="auth-showcase__grid">
            <article>
              <strong>Telemetría</strong>
              <span>Recepción de muestras y validación de sensores.</span>
            </article>
            <article>
              <strong>Dashboard</strong>
              <span>Resumen visual con estado real o simulado.</span>
            </article>
            <article>
              <strong>Escalable</strong>
              <span>Lista para conectar más endpoints cuando existan.</span>
            </article>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card__header">
            <span className="eyebrow">Acceso</span>
            <h2>{mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta base'}</h2>
            <p>
              {mode === 'login'
                ? 'Ingresa para revisar el panel y probar la integración disponible.'
                : 'Registra un usuario demo para entrar al sistema y navegar la interfaz.'}
            </p>
          </div>

          <AuthTabs mode={mode} onModeChange={onModeChange} />

          <div className="auth-form-panel">
            {mode === 'login' ? (
              <LoginForm
                loginData={loginData}
                onChange={setLoginData}
                onSubmit={handleLoginSubmit}
                isSubmitting={isSubmitting}
                error={authError}
              />
            ) : (
              <RegisterForm
                registerData={registerData}
                registerValid={registerValid}
                onChange={setRegisterData}
                onSubmit={handleRegisterSubmit}
                isSubmitting={isSubmitting}
                error={authError}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}