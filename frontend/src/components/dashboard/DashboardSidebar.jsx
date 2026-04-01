import './dashboard.css'

const ICON_MAP = {
  overview:  'fa-chart-line',
  telemetry: 'fa-database',
  alerts:    'fa-bell',
  sensors:   'fa-microchip',
  users:     'fa-users',
  tracking:  'fa-tasks',
}

export function DashboardSidebar({ sections, activeSection, onSectionChange, onLogout, theme, onToggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar-eyebrow">Panel principal</span>
        <h2>
          <i className="fa-solid fa-leaf"></i>
          Panel Agricola
        </h2>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
            type="button"
            onClick={() => onSectionChange(section.id)}
          >
            <i className={`fa-solid ${ICON_MAP[section.id] || 'fa-circle'}`}></i>
            {section.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-actions">
        <button className="secondary-btn secondary-btn--theme" type="button" onClick={onToggleTheme}>
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          {theme === 'dark' ? 'Modo dia' : 'Modo noche'}
        </button>

        <button className="secondary-btn" type="button" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket"></i>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
