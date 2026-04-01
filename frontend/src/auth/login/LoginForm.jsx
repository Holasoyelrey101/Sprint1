import './LoginForm.css'

export function LoginForm({ loginData, onChange, onSubmit, isSubmitting, error }) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <div>
        <label htmlFor="login-email">Correo</label>
        <input
          id="login-email"
          type="email"
          placeholder="admin@cultivos.cl"
          value={loginData.email}
          onChange={(e) => onChange((prev) => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="login-password">Contraseña</label>
        <input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={loginData.password}
          onChange={(e) => onChange((prev) => ({ ...prev, password: e.target.value }))}
        />
      </div>

      <button className="login-form__button" type="submit">
        {isSubmitting ? 'Ingresando...' : 'Entrar al panel'}
      </button>

      {error ? <p className="register-form__helper register-form__helper--error">{error}</p> : null}
    </form>
  )
}