import './auth.css'

export function AuthTabs({ mode, onModeChange }) {
  return (
    <div className="tabs" role="tablist" aria-label="Cambiar formulario de acceso">
      <button
        className={mode === 'login' ? 'active' : ''}
        onClick={() => onModeChange('login')}
        type="button"
      >
        Iniciar sesión
      </button>
      <button
        className={mode === 'register' ? 'active' : ''}
        onClick={() => onModeChange('register')}
        type="button"
      >
        Registrarse
      </button>
    </div>
  )
}