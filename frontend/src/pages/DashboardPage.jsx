import { useEffect, useMemo, useState } from 'react'
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { SummaryCards } from '../components/dashboard/SummaryCards'
import {
  activityItems,
  dashboardSections,
  quickActions,
  sectionContent,
  upcomingTasks,
} from '../data/dashboardData'
import { fetchBackendStatus, sendTelemetry } from '../services/backendApi'
import { fetchSupabaseTelemetry, isSupabaseConfigured } from '../services/supabaseApi'
import { exportTelemetryToExcel, exportTelemetryToPdf } from '../utils/exportUtils'
import './dashboard-page.css'

function PanelCard({ title, subtitle, items }) {
  return (
    <article className="panel-card">
      <div className="panel-header">
        <div>
          <h3>
            <i className={`fa-solid ${title.includes('Actividad') ? 'fa-history' : 'fa-tasks'}`}></i>
            {title}
          </h3>
          <span>{subtitle}</span>
        </div>
      </div>

      <ul className="list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  )
}

function SectionBlock({ eyebrow, title, description, children, framed = true }) {
  return (
    <section className="section-block">
      <div className="section-lead">
        <span className="eyebrow">
          <i className="fa-solid fa-chevron-right"></i>
          {eyebrow}
        </span>
        <h2>
          <i className="fa-solid fa-chart-line"></i>
          {title}
        </h2>
        <p>{description}</p>
      </div>

      {framed ? <div className="section-stage">{children}</div> : <div className="section-flow">{children}</div>}
    </section>
  )
}

function OperationTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'overview', label: 'Vista' },
    { id: 'telemetry', label: 'Telemetría' },
    { id: 'exports', label: 'Exportación' },
    { id: 'status', label: 'Estado' },
  ]

  return (
    <div className="operation-tabs" role="tablist" aria-label="Panel de operación">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`operation-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function EmptyStateCard({ title, description }) {
  return (
    <article className="empty-state-card">
      <i className="fa-solid fa-hammer"></i>
      <span className="empty-state-badge">
        <i className="fa-solid fa-wrench"></i>
        En desarrollo
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

function QuickActions({ onAction }) {
  const iconMap = {
    'create-alert': 'fa-circle-exclamation',
    'add-sensor': 'fa-microchip',
    'invite-user': 'fa-user-plus',
  }

  return (
    <section className="quick-actions-panel">
      <div className="subsection-heading">
        <div>
          <span className="eyebrow">
            <i className="fa-solid fa-zap"></i>
            Accesos rápidos
          </span>
          <h3>Acciones frecuentes</h3>
        </div>
      </div>

      <div className="quick-actions-grid">
      {quickActions.map((action) => (
        <button
          key={action.id}
          className="quick-action-card"
          type="button"
          onClick={() => onAction(action.title)}
        >
          <i className={`fa-solid ${iconMap[action.id] || 'fa-star'}`}></i>
          <strong>{action.title}</strong>
          <span>{action.description}</span>
        </button>
      ))}
      </div>
    </section>
  )
}

function TelemetryForm({ telemetryData, onChange, onSubmit, isSubmitting, submitError, submitSuccess }) {
  return (
    <article className="telemetry-card">
      <div className="panel-header telemetry-card__header">
        <div>
          <h3>
            <i className="fa-solid fa-database"></i>
            Enviar telemetría
          </h3>
          <span>Integración activa con el endpoint POST /api/telemetry</span>
        </div>
      </div>

      <form className="telemetry-form" onSubmit={onSubmit}>
        <div>
          <label htmlFor="deveui">
            <i className="fa-solid fa-tag"></i>
            DevEUI
          </label>
          <input
            id="deveui"
            type="text"
            value={telemetryData.deveui}
            onChange={(event) => onChange('deveui', event.target.value)}
            placeholder="ABC123"
            required
          />
        </div>

        <div>
          <label htmlFor="humedad">
            <i className="fa-solid fa-droplet"></i>
            Humedad
          </label>
          <input
            id="humedad"
            type="number"
            step="0.1"
            value={telemetryData.humedad}
            onChange={(event) => onChange('humedad', event.target.value)}
            placeholder="38.5"
            required
          />
        </div>

        <div>
          <label htmlFor="temperatura">
            <i className="fa-solid fa-temperature-half"></i>
            Temperatura
          </label>
          <input
            id="temperatura"
            type="number"
            step="0.1"
            value={telemetryData.temperatura}
            onChange={(event) => onChange('temperatura', event.target.value)}
            placeholder="22.4"
            required
          />
        </div>

        <div>
          <label htmlFor="ph">
            <i className="fa-solid fa-flask"></i>
            pH
          </label>
          <input
            id="ph"
            type="number"
            step="0.1"
            value={telemetryData.ph}
            onChange={(event) => onChange('ph', event.target.value)}
            placeholder="6.8"
            required
          />
        </div>

        <div>
          <label htmlFor="voltaje">
            <i className="fa-solid fa-bolt"></i>
            Voltaje
          </label>
          <input
            id="voltaje"
            type="number"
            step="0.01"
            value={telemetryData.voltaje}
            onChange={(event) => onChange('voltaje', event.target.value)}
            placeholder="3.71"
            required
          />
        </div>

        <button className="primary-dashboard-btn telemetry-submit" type="submit" disabled={isSubmitting}>
          <i className={`fa-solid ${isSubmitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
          {isSubmitting ? 'Enviando...' : 'Enviar muestra'}
        </button>
      </form>

      {submitError ? <p className="feedback-message feedback-message--error"><i className="fa-solid fa-circle-exclamation"></i> {submitError}</p> : null}
      {submitSuccess ? <p className="feedback-message feedback-message--success"><i className="fa-solid fa-circle-check"></i> {submitSuccess}</p> : null}
    </article>
  )
}

function TelemetryChart({ telemetryHistory, telemetryData, connectionMode }) {
  const [metric, setMetric] = useState('humedad')

  const metricConfig = {
    humedad: { label: 'Humedad', color: '#2e8b62', unit: '%' },
    temperatura: { label: 'Temperatura', color: '#ef7d32', unit: '°C' },
    ph: { label: 'pH', color: '#6f56d9', unit: '' },
    voltaje: { label: 'Voltaje', color: '#2f6fed', unit: 'V' },
  }

  const chartPoints = useMemo(() => {
    if (telemetryHistory.length > 0) {
      return telemetryHistory
        .slice(0, 6)
        .reverse()
        .map((entry, index) => ({
          label: `M${index + 1}`,
          value: Number(entry[metric]),
          source: entry.simulated ? 'Simulado' : 'Real',
        }))
    }

    return [
      {
        label: 'Preview',
        value: Number(telemetryData[metric] || 0),
        source: connectionMode === 'simulated' ? 'Simulado' : 'Formulario',
      },
    ]
  }, [telemetryHistory, telemetryData, metric, connectionMode])

  const maxValue = Math.max(...chartPoints.map((point) => point.value), 1)
  const svgWidth = 520
  const svgHeight = 220
  const padding = 24
  const stepX = chartPoints.length > 1 ? (svgWidth - padding * 2) / (chartPoints.length - 1) : 0

  const pointsAttribute = chartPoints
    .map((point, index) => {
      const x = padding + stepX * index
      const y = svgHeight - padding - (point.value / maxValue) * (svgHeight - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <article className="telemetry-chart-card">
      <div className="panel-header telemetry-chart-card__header">
        <div>
          <h3>Gráfico dinámico de telemetría</h3>
          <span>
            Cambia al enviar muestras. Funciona tanto en modo real como en modo simulado.
          </span>
        </div>
      </div>

      <div className="chart-metric-tabs">
        {Object.entries(metricConfig).map(([key, config]) => (
          <button
            key={key}
            type="button"
            className={`chart-metric-tab ${metric === key ? 'active' : ''}`}
            onClick={() => setMetric(key)}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="telemetry-chart-shell">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="telemetry-chart" role="img">
          <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} className="telemetry-chart__axis" />
          <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} className="telemetry-chart__axis" />

          <polyline
            fill="none"
            stroke={metricConfig[metric].color}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pointsAttribute}
          />

          {chartPoints.map((point, index) => {
            const x = padding + stepX * index
            const y = svgHeight - padding - (point.value / maxValue) * (svgHeight - padding * 2)

            return (
              <g key={`${point.label}-${index}`}>
                <circle cx={x} cy={y} r="5" fill={metricConfig[metric].color} />
                <text x={x} y={svgHeight - 8} textAnchor="middle" className="telemetry-chart__label">
                  {point.label}
                </text>
              </g>
            )
          })}
        </svg>

        <div className="telemetry-chart__summary">
          <strong>
            Métrica actual: {metricConfig[metric].label}
          </strong>
          <p>
            Valor más alto mostrado: {maxValue}
            {metricConfig[metric].unit}
          </p>
          <ul className="telemetry-chart__legend">
            {chartPoints.map((point, index) => (
              <li key={`${point.source}-${index}`}>
                <span>{point.label}</span>
                <strong>
                  {point.value}
                  {metricConfig[metric].unit}
                </strong>
                <small>{point.source}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

function SupabaseDataCard({ supabaseTelemetry, isLoading, loadError, isConfigured, onReload }) {
  return (
    <article className="supabase-card">
      <div className="panel-header supabase-card__header">
        <div>
          <h3>Lectura real desde Supabase</h3>
          <span>Consulta directa a la tabla de telemetría para demostrar conexión real con base de datos.</span>
        </div>

        <button type="button" className="secondary-dashboard-btn" onClick={onReload}>
          Recargar datos
        </button>
      </div>

      {!isConfigured ? (
        <p className="supabase-card__helper">
          Esta demo funciona sin base de datos conectada. Cuando configures Supabase, aquí verás datos reales.
        </p>
      ) : null}

      {isLoading ? <p className="supabase-card__helper">Consultando Supabase...</p> : null}
      {loadError ? <p className="feedback-message feedback-message--error">{loadError}</p> : null}

      {isConfigured && !isLoading && !loadError ? (
        supabaseTelemetry.length > 0 ? (
          <div className="supabase-table-wrapper">
            <table className="supabase-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Humedad</th>
                  <th>Temperatura</th>
                  <th>pH</th>
                  <th>Voltaje</th>
                </tr>
              </thead>
              <tbody>
                {supabaseTelemetry.slice(0, 6).map((row, index) => (
                  <tr key={row.id ?? index}>
                    <td>{row.id ?? '--'}</td>
                    <td>{row.humedad ?? '--'}</td>
                    <td>{row.temperatura ?? '--'}</td>
                    <td>{row.ph ?? '--'}</td>
                    <td>{row.voltaje ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="supabase-card__helper">
            La conexión está lista, pero no se encontraron registros visibles en la tabla `telemetria`.
          </p>
        )
      ) : null}
    </article>
  )
}

function ExportActions({ hasData, onExportPdf, onExportExcel, exportMessage }) {
  return (
    <article className="export-card">
      <div className="panel-header export-card__header">
        <div>
          <h3>
            <i className="fa-solid fa-download"></i>
            Exportar datos
          </h3>
          <span>Genera un respaldo rápido de las muestras enviadas desde esta demo.</span>
        </div>
      </div>

      <div className="export-actions">
        <button type="button" className="secondary-dashboard-btn" onClick={onExportPdf} disabled={!hasData}>
          <i className="fa-solid fa-file-pdf"></i>
          Generar PDF
        </button>
        <button type="button" className="secondary-dashboard-btn" onClick={onExportExcel} disabled={!hasData}>
          <i className="fa-solid fa-file-excel"></i>
          Generar Excel
        </button>
      </div>

      <p className="export-card__helper">
        <i className="fa-solid fa-circle-info"></i>
        {' '}
        {hasData
          ? 'Puedes exportar el historial acumulado de muestras enviadas en esta sesión.'
          : 'Primero envía al menos una muestra para habilitar la exportación.'}
      </p>

      {exportMessage ? <p className="feedback-message feedback-message--success"><i className="fa-solid fa-circle-check"></i> {exportMessage}</p> : null}
    </article>
  )
}

function ConnectionModeSelector({ connectionMode, onModeChange, onRefresh, isRefreshing }) {
  return (
    <article className="connection-mode-card">
      <div className="panel-header connection-mode-card__header">
        <div>
          <h3>Modo de conexión</h3>
          <span>Para demo, usa Simulado. Real y Automático están disponibles si conectas backend.</span>
        </div>
      </div>

      <div className="connection-mode-actions">
        <button
          type="button"
          className={`mode-chip ${connectionMode === 'auto' ? 'active' : ''}`}
          onClick={() => onModeChange('auto')}
          disabled={isRefreshing}
        >
          Automático
        </button>
        <button
          type="button"
          className={`mode-chip ${connectionMode === 'real' ? 'active' : ''}`}
          onClick={() => onModeChange('real')}
          disabled={isRefreshing}
        >
          Real
        </button>
        <button
          type="button"
          className={`mode-chip ${connectionMode === 'simulated' ? 'active' : ''}`}
          onClick={() => onModeChange('simulated')}
          disabled={isRefreshing}
        >
          Simulado
        </button>

        <button type="button" className="secondary-dashboard-btn" onClick={onRefresh} disabled={isRefreshing}>
          <i className={`fa-solid ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`}></i>
          {isRefreshing ? 'Actualizando...' : 'Actualizar estado'}
        </button>
      </div>
    </article>
  )
}

function TelemetryLoadingState() {
  return (
    <article className="telemetry-loading-state">
      <div className="telemetry-loading-state__inner">
        <i className="fa-solid fa-circle-notch fa-spin"></i>
        <h3>Estamos cargando datos, espere...</h3>
        <p>Actualizando estado de servicios y sincronizando información del módulo.</p>
      </div>
    </article>
  )
}

function SummarySnapshot({ currentSectionLabel, latestTelemetry, telemetryHistory, backendStatus, connectionMode }) {
  const backendLabel = backendStatus.loading
    ? 'Verificando'
    : backendStatus.available
      ? 'Online'
      : backendStatus.simulated
        ? 'Simulado'
        : 'Offline'

  return (
    <section className="summary-snapshot-grid">
      <article className="summary-info-card summary-info-card--compact">
        <h3>Resumen del dashboard</h3>
        <p>
          Vista rápida con el módulo actual, estado del backend y actividad reciente, sin mezclar
          herramientas operativas dentro del resumen.
        </p>

        <div className="summary-info-grid">
          <article>
            <span>Módulo activo</span>
            <strong>{currentSectionLabel}</strong>
          </article>
          <article>
            <span>Muestras registradas</span>
            <strong>{telemetryHistory.length}</strong>
          </article>
          <article>
            <span>Modo</span>
            <strong>{connectionMode === 'auto' ? 'Auto' : connectionMode === 'real' ? 'Real' : 'Simulado'}</strong>
          </article>
        </div>
      </article>

      <article className="summary-info-card summary-info-card--compact">
        <h3>Último estado</h3>
        <p>{backendStatus.message}</p>

        <ul className="summary-bullet-list">
          <li>
            Backend:{' '}
            <strong>{backendLabel}</strong>
          </li>
          <li>
            Modo conexión: <strong>{connectionMode === 'auto' ? 'Auto' : connectionMode === 'real' ? 'Real' : 'Simulado'}</strong>
          </li>
          <li>
            Última telemetría:{' '}
            <strong>{latestTelemetry ? latestTelemetry.createdAtLabel : 'Sin envíos todavía'}</strong>
          </li>
          <li>
            Sensor reciente: <strong>{latestTelemetry?.deveui ?? '--'}</strong>
          </li>
        </ul>
      </article>
    </section>
  )
}

function SectionContent({
  activeSection,
  onAction,
  telemetryData,
  onTelemetryChange,
  onTelemetrySubmit,
  isSubmitting,
  submitError,
  submitSuccess,
  latestTelemetry,
  telemetryHistory,
  onExportPdf,
  onExportExcel,
  exportMessage,
  connectionMode,
  supabaseTelemetry,
  supabaseLoading,
  supabaseError,
  supabaseConfigured,
  onReloadSupabase,
  onConnectionModeChange,
  onRefreshBackendStatus,
  isRefreshingStatus,
}) {
  // Sección de Telemetría
  if (activeSection === 'telemetry') {
    if (isRefreshingStatus) {
      return (
        <div className="telemetry-layout">
          <div className="telemetry-layout__left">
            <ConnectionModeSelector
              connectionMode={connectionMode}
              onModeChange={onConnectionModeChange}
              onRefresh={onRefreshBackendStatus}
              isRefreshing={isRefreshingStatus}
            />
          </div>

          <TelemetryLoadingState />
        </div>
      )
    }

    return (
      <div className="telemetry-layout">
        <div className="telemetry-layout__left">
          <ConnectionModeSelector
            connectionMode={connectionMode}
            onModeChange={onConnectionModeChange}
            onRefresh={onRefreshBackendStatus}
            isRefreshing={isRefreshingStatus}
          />

          <TelemetryForm
            telemetryData={telemetryData}
            onChange={onTelemetryChange}
            onSubmit={onTelemetrySubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
            submitSuccess={submitSuccess}
          />

          <ExportActions
            hasData={telemetryHistory.length > 0}
            onExportPdf={onExportPdf}
            onExportExcel={onExportExcel}
            exportMessage={exportMessage}
          />
        </div>

        <div className="telemetry-layout__right">
          <TelemetryChart
            telemetryHistory={telemetryHistory}
            telemetryData={telemetryData}
            connectionMode={connectionMode}
          />

          <SupabaseDataCard
            supabaseTelemetry={supabaseTelemetry}
            isLoading={supabaseLoading}
            loadError={supabaseError}
            isConfigured={supabaseConfigured}
            onReload={onReloadSupabase}
          />
        </div>
      </div>
    )
  }

  // Sección de Sensores
  if (activeSection === 'sensors') {
    const hasSensors = supabaseTelemetry.length > 0

    return (
      <div className="workspace-stack">
        {hasSensors ? (
          <>
            <TelemetryForm
              telemetryData={telemetryData}
              onChange={onTelemetryChange}
              onSubmit={onTelemetrySubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              submitSuccess={submitSuccess}
            />

            <TelemetryChart
              telemetryHistory={telemetryHistory}
              telemetryData={telemetryData}
              connectionMode={connectionMode}
            />

            <SupabaseDataCard
              supabaseTelemetry={supabaseTelemetry}
              isLoading={supabaseLoading}
              loadError={supabaseError}
              isConfigured={supabaseConfigured}
              onReload={onReloadSupabase}
            />
          </>
        ) : (
          <EmptyStateCard
            title="Estamos trabajando en esta sección"
            description="Los sensores aparecerán aquí cuando estén conectados y transmitan datos. Por ahora, puedes probar el formulario de telemetría."
          />
        )}
      </div>
    )
  }

  // Sección de Usuarios
  if (activeSection === 'users') {
    return (
      <EmptyStateCard
        title="Estamos trabajando en esta sección"
        description="La administración de usuarios será habilitada próximamente. Aquí podrás ver, agregar y gestionar todos los usuarios del sistema."
      />
    )
  }

  // Sección de Alertas
  if (activeSection === 'alerts') {
    return (
      <EmptyStateCard
        title="Estamos trabajando en esta sección"
        description="El centro de alertas estará disponible pronto. Podrás configurar reglas, visualizar alertas activas y gestionar notificaciones."
      />
    )
  }

  // Sección por defecto (overview)
  return (
    <div className="workspace-stack">
      <QuickActions onAction={onAction} />
      <TelemetryForm
        telemetryData={telemetryData}
        onChange={onTelemetryChange}
        onSubmit={onTelemetrySubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitSuccess={submitSuccess}
      />
      <TelemetryChart
        telemetryHistory={telemetryHistory}
        telemetryData={telemetryData}
        connectionMode={connectionMode}
      />
      <ExportActions
        hasData={telemetryHistory.length > 0}
        onExportPdf={onExportPdf}
        onExportExcel={onExportExcel}
        exportMessage={exportMessage}
      />
    </div>
  )
}

function PlaceholderWorkspace({
  activeSection,
  onAction,
  telemetryData,
  onTelemetryChange,
  onTelemetrySubmit,
  isSubmitting,
  submitError,
  submitSuccess,
  latestTelemetry,
  telemetryHistory,
  onExportPdf,
  onExportExcel,
  exportMessage,
  connectionMode,
  supabaseTelemetry,
  supabaseLoading,
  supabaseError,
  supabaseConfigured,
  onReloadSupabase,
  onConnectionModeChange,
  onRefreshBackendStatus,
  isRefreshingStatus,
}) {
  const currentSection = sectionContent[activeSection]

  return (
    <section className="workspace-card">
      <div className="workspace-header">
        <div>
          <span className="eyebrow">Módulo activo</span>
          <h2>{currentSection.title}</h2>
          <p>{currentSection.description}</p>
        </div>
      </div>

      <SectionContent
        activeSection={activeSection}
        onAction={onAction}
        telemetryData={telemetryData}
        onTelemetryChange={onTelemetryChange}
        onTelemetrySubmit={onTelemetrySubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitSuccess={submitSuccess}
        latestTelemetry={latestTelemetry}
        telemetryHistory={telemetryHistory}
        onExportPdf={onExportPdf}
        onExportExcel={onExportExcel}
        exportMessage={exportMessage}
        connectionMode={connectionMode}
        supabaseTelemetry={supabaseTelemetry}
        supabaseLoading={supabaseLoading}
        supabaseError={supabaseError}
        supabaseConfigured={supabaseConfigured}
        onReloadSupabase={onReloadSupabase}
        onConnectionModeChange={onConnectionModeChange}
        onRefreshBackendStatus={onRefreshBackendStatus}
        isRefreshingStatus={isRefreshingStatus}
      />
    </section>
  )
}

export function DashboardPage({ user, onLogout, theme, onToggleTheme }) {
  const [activeSection, setActiveSection] = useState('overview')
  const [backendStatus, setBackendStatus] = useState({
    loading: true,
    available: false,
    simulated: false,
    message: 'Verificando backend...',
  })
  const [telemetryData, setTelemetryData] = useState({
    deveui: 'ABC123',
    humedad: '38.5',
    temperatura: '22.4',
    ph: '6.8',
    voltaje: '3.71',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [latestTelemetry, setLatestTelemetry] = useState(null)
  const [telemetryHistory, setTelemetryHistory] = useState([])
  const [exportMessage, setExportMessage] = useState('')
  const [connectionMode, setConnectionMode] = useState('simulated')
  const [supabaseTelemetry, setSupabaseTelemetry] = useState([])
  const [supabaseLoading, setSupabaseLoading] = useState(false)
  const [supabaseError, setSupabaseError] = useState('')
  const [supabaseConfigured] = useState(isSupabaseConfigured())
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
  const [lastBackendCheckLabel, setLastBackendCheckLabel] = useState('')
  const [lastSupabaseSyncLabel, setLastSupabaseSyncLabel] = useState('')

  const nowLabel = () => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  const loadSupabaseTelemetry = async () => {
    if (!supabaseConfigured) return

    setSupabaseLoading(true)
    setSupabaseError('')

    try {
      const rows = await fetchSupabaseTelemetry()
      setSupabaseTelemetry(rows)
      setLastSupabaseSyncLabel(nowLabel())
    } catch (error) {
      setSupabaseError(error.message)
    } finally {
      setSupabaseLoading(false)
    }
  }

  const loadBackendStatus = async (selectedMode = connectionMode, isMounted = () => true) => {
    setBackendStatus((prev) => ({
      ...prev,
      loading: true,
      message: 'Verificando backend...',
    }))

    try {
      const response = await fetchBackendStatus(selectedMode)

      if (!isMounted()) return

      setLastBackendCheckLabel(nowLabel())

      setBackendStatus({
        loading: false,
        available: response?.status === 'ok',
        simulated: response?.simulated === true,
        message:
          response?.status === 'ok'
            ? selectedMode === 'real'
              ? 'Modo real seleccionado: backend conectado correctamente.'
              : 'Backend conectado correctamente.'
            : response?.message || 'Backend respondió con un estado inesperado.',
      })
    } catch {
      if (!isMounted()) return

      setLastBackendCheckLabel(nowLabel())

      setBackendStatus({
        loading: false,
        available: false,
        simulated: selectedMode !== 'real',
        message:
          selectedMode === 'real'
            ? 'Modo real seleccionado, pero no se pudo conectar con FastAPI.'
            : 'No se pudo conectar con el backend. Revisa que FastAPI esté ejecutándose.',
      })
    }
  }

  useEffect(() => {
    let mounted = true

    loadBackendStatus(connectionMode, () => mounted)
    loadSupabaseTelemetry()

    return () => {
      mounted = false
    }
  }, [])

  const currentSectionLabel = useMemo(
    () => dashboardSections.find((section) => section.id === activeSection)?.label ?? 'Resumen general',
    [activeSection],
  )

  const summaryCards = useMemo(
    () => [
      {
        label: 'Backend FastAPI',
        value: backendStatus.loading
          ? '...'
          : backendStatus.available
            ? 'Online'
            : backendStatus.simulated
              ? 'Simulado'
              : 'Offline',
        detail: backendStatus.message,
      },
      {
        label: 'Supabase',
        value: !supabaseConfigured
          ? 'No configurado'
          : supabaseLoading
            ? 'Sincronizando'
            : supabaseError
              ? 'Con error'
              : 'Conectado',
        detail: !supabaseConfigured
          ? 'Demo local activa sin base de datos.'
          : supabaseError
            ? supabaseError
            : `Registros cargados: ${supabaseTelemetry.length}`,
      },
      {
        label: 'Modo activo',
        value: connectionMode === 'auto' ? 'Auto' : connectionMode === 'real' ? 'Real' : 'Simulado',
        detail:
          connectionMode === 'auto'
            ? 'Intenta backend y cae a simulación si falla.'
            : connectionMode === 'real'
              ? 'Usa exclusivamente el backend FastAPI.'
              : 'Fuerza respuestas demo locales.',
      },
      {
        label: 'Monitoreo',
        value: `${telemetryHistory.length} muestras`,
        detail: latestTelemetry
          ? `Último envío: ${latestTelemetry.createdAtLabel}${latestTelemetry.simulated ? ' (simulado)' : ' (real)'}`
          : 'Aún no hay muestras enviadas en esta sesión.',
      },
      {
        label: 'Últimos chequeos',
        value: lastBackendCheckLabel || '--:--',
        detail: `API: ${lastBackendCheckLabel || 'pendiente'} · Supabase: ${lastSupabaseSyncLabel || 'pendiente'}`,
      },
    ],
    [
      backendStatus,
      connectionMode,
      latestTelemetry,
      telemetryHistory.length,
      supabaseConfigured,
      supabaseLoading,
      supabaseError,
      supabaseTelemetry.length,
      lastBackendCheckLabel,
      lastSupabaseSyncLabel,
    ],
  )

  const dynamicActivityItems = useMemo(() => {
    if (!latestTelemetry) return activityItems

    return [
      `Se envió una telemetría para el dispositivo ${latestTelemetry.deveui}.`,
      latestTelemetry.simulated
        ? `La respuesta fue simulada localmente con sensor_id ${latestTelemetry.sensorId}.`
        : `El backend respondió con sensor_id ${latestTelemetry.sensorId}.`,
      'La integración actual cubre los endpoints iniciales disponibles en el backend.',
    ]
  }, [latestTelemetry])

  const dynamicUpcomingTasks = useMemo(
    () => [
      'Agregar endpoints de lectura para listar sensores y telemetrías reales.',
      'Incorporar autenticación backend para reemplazar el login demo.',
      backendStatus.available
        ? 'Conectar nuevas métricas del dashboard usando datos persistidos.'
        : backendStatus.simulated
          ? 'Reemplazar la simulación por datos reales cuando el backend esté desplegado.'
          : 'Levantar el backend para validar el flujo completo desde la interfaz.',
    ],
    [backendStatus.available, backendStatus.simulated],
  )

  const handleAction = (label) => {
    console.log(`Acción ejecutada: ${label}`)
  }

  const handleTelemetryChange = (field, value) => {
    setTelemetryData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTelemetrySubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')

    try {
      const response = await sendTelemetry(telemetryData, connectionMode)
      const registered = response?.data?.[0] ?? null
      const createdAtLabel = new Date().toLocaleString('es-CL')

      const telemetryEntry = {
        ...telemetryData,
        sensorId: response?.sensor_id ?? '--',
        telemetryId: registered?.id ?? null,
        simulated: response?.simulated === true,
        createdAtLabel,
      }

      setLatestTelemetry(telemetryEntry)
      setTelemetryHistory((prev) => [telemetryEntry, ...prev])
      setExportMessage('')
      loadSupabaseTelemetry()
      setSubmitSuccess(response?.message || 'Telemetría enviada correctamente.')
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportPdf = () => {
    const exported = exportTelemetryToPdf(telemetryHistory)
    setExportMessage(
      exported
        ? 'Se abrió la vista de impresión para guardar el reporte en PDF.'
        : 'No se pudo generar el PDF. Verifica que existan datos y que el navegador permita ventanas emergentes.',
    )
  }

  const handleExportExcel = () => {
    const exported = exportTelemetryToExcel(telemetryHistory)
    setExportMessage(
      exported
        ? 'Se descargó un archivo Excel con el historial de telemetría.'
        : 'No hay datos suficientes para exportar a Excel.',
    )
  }

  const handleConnectionModeChange = (mode) => {
    setConnectionMode(mode)
    setExportMessage('')
    setSubmitError('')
    setSubmitSuccess('')
    loadBackendStatus(mode)
  }

  const handleRefreshBackendStatus = async () => {
    setIsRefreshingStatus(true)

    try {
      // Keep loader visible for a minimum time to avoid visual flicker in demos.
      await Promise.all([
        loadBackendStatus(connectionMode),
        loadSupabaseTelemetry(),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
    } finally {
      setIsRefreshingStatus(false)
    }
  }

  const isSummarySection = activeSection === 'overview'
  const isTrackingSection = activeSection === 'tracking'
  const isWorkspaceSection = !isSummarySection && !isTrackingSection

  return (
    <section className="dashboard-shell">
      <DashboardSidebar
        sections={dashboardSections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <div className="dashboard-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">
              <i className="fa-solid fa-hand"></i>
              Bienvenido
            </span>
            <h1>
              <i className="fa-solid fa-circle-user"></i>
              {user.name}
            </h1>
            <p>
              <i className="fa-solid fa-user-tag"></i>
              {user.role} · {user.email}
            </p>
          </div>

          <div className="status-pill">
            <i className="fa-solid fa-cube"></i>
            {currentSectionLabel}
          </div>
        </header>

        {isSummarySection ? (
          <SectionBlock
            eyebrow="Resumen"
            title="Estado general del sistema"
            description="Vista resumida del estado backend, modo activo y actividad principal del dashboard."
          >
            <div className="summary-panel">
              <div className="summary-panel__content">
                <SummaryCards cards={summaryCards} />
                <SummarySnapshot
                  currentSectionLabel={currentSectionLabel}
                  latestTelemetry={latestTelemetry}
                  telemetryHistory={telemetryHistory}
                  backendStatus={backendStatus}
                  connectionMode={connectionMode}
                />
              </div>
            </div>
          </SectionBlock>
        ) : null}

        {isWorkspaceSection ? (
          <PlaceholderWorkspace
            activeSection={activeSection}
            onAction={handleAction}
            telemetryData={telemetryData}
            onTelemetryChange={handleTelemetryChange}
            onTelemetrySubmit={handleTelemetrySubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
            submitSuccess={submitSuccess}
            latestTelemetry={latestTelemetry}
            telemetryHistory={telemetryHistory}
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
            exportMessage={exportMessage}
            connectionMode={connectionMode}
            supabaseTelemetry={supabaseTelemetry}
            supabaseLoading={supabaseLoading}
            supabaseError={supabaseError}
            supabaseConfigured={supabaseConfigured}
            onReloadSupabase={loadSupabaseTelemetry}
            onConnectionModeChange={handleConnectionModeChange}
            onRefreshBackendStatus={handleRefreshBackendStatus}
            isRefreshingStatus={isRefreshingStatus}
          />
        ) : null}

        {isTrackingSection ? (
          <SectionBlock
            eyebrow="Seguimiento"
            title="Actividad y próximos pasos"
            description="Esta vista concentra el historial reciente y las tareas sugeridas del sistema."
          >
            <section className="dashboard-grid">
              <PanelCard title="Actividad reciente" subtitle="Últimas 24 horas" items={dynamicActivityItems} />
              <PanelCard title="Tareas sugeridas" subtitle="Próximos pasos" items={dynamicUpcomingTasks} />
            </section>
          </SectionBlock>
        ) : null}
      </div>
    </section>
  )
}