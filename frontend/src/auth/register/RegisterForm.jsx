import './RegisterForm.css'

export function RegisterForm({ registerData, registerValid, onChange, onSubmit, isSubmitting, error }) {
  return (
    <form className="register-form" onSubmit={onSubmit}>
      <div>
        <label htmlFor="register-name">Nombre</label>
        <input
          id="register-name"
          type="text"
          placeholder="María González"
          value={registerData.name}
          onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="register-email">Correo</label>
        <input
          id="register-email"
          type="email"
          placeholder="maria@cultivos.cl"
          value={registerData.email}
          onChange={(e) => onChange((prev) => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="register-role">Rol</label>
        <select
          id="register-role"
          value={registerData.role}
          onChange={(e) => onChange((prev) => ({ ...prev, role: e.target.value }))}
        >
          <option>Agrónomo</option>
          <option>Administrador</option>
          <option>Inversionista</option>
        </select>
      </div>

      <div className="register-form__double-field">
        <div>
          <label htmlFor="register-password">Contraseña</label>
          <input
            id="register-password"
            type="password"
            placeholder="Crea una clave"
            value={registerData.password}
            onChange={(e) => onChange((prev) => ({ ...prev, password: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="register-confirm">Confirmar</label>
          <input
            id="register-confirm"
            type="password"
            placeholder="Repite la clave"
            value={registerData.confirmPassword}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
          />
        </div>
      </div>

      {registerData.confirmPassword && !registerValid ? (
        <p className="register-form__helper register-form__helper--error">
          Las contraseñas deben coincidir.
        </p>
      ) : (
        <p className="register-form__helper">
          Crea una cuenta base para ingresar al sistema.
        </p>
      )}

      <button className="register-form__button" type="submit" disabled={!registerValid || isSubmitting}>
        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      {error ? <p className="register-form__helper register-form__helper--error">{error}</p> : null}
    </form>
  )
}