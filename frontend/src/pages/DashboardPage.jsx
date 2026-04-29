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

// Polling interval used to refresh Supabase telemetry (ms).
const SUPABASE_POLL_INTERVAL_MS = 15000

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
          <label htmlFor="humedad_aire">
            <i className="fa-solid fa-droplet"></i>
            Humedad (aire)
          </label>
          <input
            id="humedad_aire"
            type="number"
            step="0.1"
            value={telemetryData.humedad_aire}
            onChange={(event) => onChange('humedad_aire', event.target.value)}
            placeholder="38.5"
            required
          />
        </div>

        <div>
          <label htmlFor="humedad_suelo">
            <i className="fa-solid fa-water"></i>
            Humedad (suelo)
          </label>
          <input
            id="humedad_suelo"
            type="number"
            step="0.1"
            value={telemetryData.humedad_suelo}
            onChange={(event) => onChange('humedad_suelo', event.target.value)}
            placeholder="30.0"
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

function TelemetryChart({ telemetryHistory, telemetryData, connectionMode, supabaseTelemetry, supabasePollIntervalMs = 0 }) {
  const [metric, setMetric] = useState('humedad_aire')

  const metricConfig = {
    humedad_aire: { label: 'Humedad aire', color: '#2e8b62', unit: '%' },
    humedad_suelo: { label: 'Humedad suelo', color: '#3a9ad9', unit: '%' },
    temperatura: { label: 'Temperatura', color: '#ef7d32', unit: '°C' },
  }

  const toNumber = (v) => {
    if (v == null) return 0
    const s = String(v).replace(',', '.')
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }

  const chartPoints = useMemo(() => {
    const useSupabase = supabaseTelemetry && supabaseTelemetry.length > 0

    if (useSupabase || telemetryHistory.length > 0) {
      const source = useSupabase ? supabaseTelemetry.slice(0, 50).reverse() : telemetryHistory.slice(0, 50).reverse()

      return source.map((entry, index) => {
        let raw
        let createdAtValue = null

        if (useSupabase) {
          raw = entry[metric]
          createdAtValue = entry.created_at || null
        } else {
          // fallback: local telemetry uses `humedad` for air humidity
          if (metric === 'humedad_aire') raw = entry.humedad ?? entry[metric]
          else raw = entry[metric]

          createdAtValue = entry.createdAtLabel || entry.createdAt || null
        }

        return {
          label: `M${index + 1}`,
          value: toNumber(raw),
          source: useSupabase ? 'Real' : entry.simulated ? 'Simulado' : 'Formulario',
          createdAt: createdAtValue,
        }
      })
    }

    // preview
    let previewRaw
    if (metric === 'humedad_aire') previewRaw = telemetryData.humedad_aire
    else if (metric === 'humedad_suelo') previewRaw = telemetryData.humedad_suelo
    else previewRaw = telemetryData[metric]

    return [
      {
        label: 'Preview',
        value: toNumber(previewRaw || 0),
        source: connectionMode === 'simulated' ? 'Simulado' : 'Formulario',
      },
    ]
  }, [telemetryHistory, telemetryData, metric, connectionMode, supabaseTelemetry])

  const svgWidth = 520
  const svgHeight = 220
  // Increase left padding so axis labels don't get clipped
  const padding = 44
  const stepX = chartPoints.length > 1 ? (svgWidth - padding * 2) / (chartPoints.length - 1) : 0

  const values = chartPoints.map((p) => p.value)
  let minValue = values.length > 0 ? Math.min(...values) : 0
  let maxValue = values.length > 0 ? Math.max(...values) : 1
  if (!Number.isFinite(minValue)) minValue = 0
  if (!Number.isFinite(maxValue)) maxValue = 1

  // Add a small visual padding around the min/max. If all values equal, expand by 10% or 1.
  const rawRange = maxValue - minValue
  if (rawRange === 0) {
    const pad = Math.abs(maxValue) * 0.1 || 1
    minValue = minValue - pad
    maxValue = maxValue + pad
  } else {
    const pad = rawRange * 0.1
    minValue = minValue - pad
    maxValue = maxValue + pad
  }

  const ticksCount = 5
  const valueRange = Math.max(maxValue - minValue, 1e-6)
  const tickStep = valueRange / (ticksCount - 1)

  const formatValue = (val) => {
    const unit = metricConfig[metric].unit || ''
    // Temperature & humidity: one decimal for clarity
    if (unit.includes('°')) return `${Number(val).toFixed(1)}${unit}`
    if (unit === '%') return `${Number(val).toFixed(1)}${unit}`
    return `${val}${unit}`
  }

  const formatDate = (d) => {
    if (!d) return ''
    const parsed = Date.parse(d)
    return Number.isFinite(parsed) ? new Date(d).toLocaleString() : String(d)
  }

  const pollSeconds = supabasePollIntervalMs && supabasePollIntervalMs > 0 ? Math.round(supabasePollIntervalMs / 1000) : null

  const pointsAttribute = chartPoints
    .map((point, index) => {
      const x = padding + stepX * index
      const y = svgHeight - padding - ((point.value - minValue) / valueRange) * (svgHeight - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <article className="telemetry-chart-card">
      <div className="panel-header telemetry-chart-card__header">
        <div>
          <h3>Gráfico dinámico de telemetría</h3>
          <span>
            El gráfico se actualiza al recibir nuevas muestras{pollSeconds ? ` (cada ${pollSeconds} segundos)` : ''}. Disponible en los modos Automático y Telemetría manual.
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

          {/* Y axis ticks and labels */}
          {Array.from({ length: ticksCount }).map((_, i) => {
            const tickValue = minValue + tickStep * i
            const y = svgHeight - padding - ((tickValue - minValue) / valueRange) * (svgHeight - padding * 2)
            return (
              <g key={`tick-${i}`}>
                <line x1={padding - 6} y1={y} x2={padding} y2={y} stroke="#cbd5e1" strokeWidth="1" />
                    <text x={padding - 12} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                      {formatValue(tickValue)}
                    </text>
              </g>
            )
          })}

          <polyline
            fill="none"
            stroke={metricConfig[metric].color}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pointsAttribute}
          />

          {(() => {
            const maxLabels = 12
            const labelInterval = chartPoints.length > maxLabels ? Math.ceil(chartPoints.length / maxLabels) : 1

            return chartPoints.map((point, index) => {
              const x = padding + stepX * index
              const y = svgHeight - padding - ((point.value - minValue) / valueRange) * (svgHeight - padding * 2)
              const displayLabel = index % labelInterval === 0 ? point.label : ''

              const formatDate = (d) => {
                if (!d) return ''
                const parsed = Date.parse(d)
                return Number.isFinite(parsed) ? new Date(d).toLocaleString() : String(d)
              }

              const tooltip = `${formatValue(point.value)}${point.createdAt ? ' • ' + formatDate(point.createdAt) : ''}`

              return (
                <g key={`${point.label}-${index}`}>
                  <circle cx={x} cy={y} r="5" fill={metricConfig[metric].color} />
                  <title>{tooltip}</title>
                  {displayLabel ? (
                    <text x={x} y={svgHeight - 8} textAnchor="middle" className="telemetry-chart__label">
                      {displayLabel}
                    </text>
                  ) : null}
                </g>
              )
            })
          })()}
        </svg>

        <div className="telemetry-chart__summary">
          <strong>
            Métrica actual: {metricConfig[metric].label}
          </strong>
          <p>
            Valor más alto mostrado: {formatValue(maxValue)}
          </p>
          <ul className="telemetry-chart__legend">
            {chartPoints.map((point, index) => (
              <li key={`${point.source}-${index}`}>
                <span>{point.label}</span>
                <strong>
                  {formatValue(point.value)}
                </strong>
                <small>
                  {point.source}
                  {point.createdAt ? ' · ' + formatDate(point.createdAt) : ''}
                </small>
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
                  <th>Fecha</th>
                  <th>Humedad aire</th>
                  <th>Humedad suelo</th>
                  <th>Temperatura</th>
                </tr>
              </thead>
              <tbody>
                {supabaseTelemetry.slice(0, 50).map((row, index) => (
                  <tr key={row.id ?? index}>
                    <td>{row.id ?? '--'}</td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleString() : '--'}</td>
                    <td>{row.humedad_aire ?? '--'}</td>
                    <td>{row.humedad_suelo ?? '--'}</td>
                    <td>{row.temperatura ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
            <p className="supabase-card__helper">
            La conexión está lista, pero no se encontraron registros visibles en la tabla `lectura_cultivos`.
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
          <span>Genera un respaldo rápido de las muestras disponibles en esta vista.</span>
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
        {exportMessage || (hasData ? 'Exporta los registros visibles (hasta 50 últimos).' : 'No hay registros para exportar.')}
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
          <span>Para demo, selecciona Automático. Modos disponibles: Automático y Telemetría manual.</span>
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
              className={`mode-chip ${connectionMode === 'manual' ? 'active' : ''}`}
              onClick={() => onModeChange('manual')}
              disabled={isRefreshing}
            >
              Telemetría manual
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
            <strong>
              {connectionMode === 'auto'
                ? 'Auto'
                : connectionMode === 'manual'
                  ? 'Telemetría manual'
                  : connectionMode === 'real'
                    ? 'Real'
                    : 'Simulado'}
            </strong>
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
            Modo conexión:{' '}
            <strong>
              {connectionMode === 'auto'
                ? 'Auto'
                : connectionMode === 'manual'
                  ? 'Telemetría manual'
                  : connectionMode === 'real'
                    ? 'Real'
                    : 'Simulado'}
            </strong>
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
  const exportHasData = connectionMode === 'auto' ? (supabaseTelemetry && supabaseTelemetry.length > 0) : telemetryHistory.length > 0
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

          {connectionMode === 'manual' ? (
            <TelemetryForm
              telemetryData={telemetryData}
              onChange={onTelemetryChange}
              onSubmit={onTelemetrySubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              submitSuccess={submitSuccess}
            />
          ) : null}

          <ExportActions
            hasData={exportHasData}
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
            supabaseTelemetry={supabaseTelemetry}
            supabasePollIntervalMs={SUPABASE_POLL_INTERVAL_MS}
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
            {connectionMode === 'manual' ? (
              <TelemetryForm
                telemetryData={telemetryData}
                onChange={onTelemetryChange}
                onSubmit={onTelemetrySubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                submitSuccess={submitSuccess}
              />
            ) : null}

            <TelemetryChart
              telemetryHistory={telemetryHistory}
              telemetryData={telemetryData}
              connectionMode={connectionMode}
              supabaseTelemetry={supabaseTelemetry}
              supabasePollIntervalMs={SUPABASE_POLL_INTERVAL_MS}
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
      {connectionMode === 'manual' ? (
        <TelemetryForm
          telemetryData={telemetryData}
          onChange={onTelemetryChange}
          onSubmit={onTelemetrySubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitSuccess={submitSuccess}
        />
      ) : null}
      <TelemetryChart
        telemetryHistory={telemetryHistory}
        telemetryData={telemetryData}
        connectionMode={connectionMode}
        supabaseTelemetry={supabaseTelemetry}
        supabasePollIntervalMs={SUPABASE_POLL_INTERVAL_MS}
      />
      <ExportActions
        hasData={exportHasData}
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
    temperatura: '22.4',
    humedad_aire: '38.5',
    humedad_suelo: '30.0',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [latestTelemetry, setLatestTelemetry] = useState(null)
  const [telemetryHistory, setTelemetryHistory] = useState([])
  const [exportMessage, setExportMessage] = useState('')
  const [connectionMode, setConnectionMode] = useState('auto')
  const [supabaseTelemetry, setSupabaseTelemetry] = useState([])
  const [supabaseLoading, setSupabaseLoading] = useState(false)
  const [supabaseError, setSupabaseError] = useState('')
  const [supabaseConfigured] = useState(isSupabaseConfigured())
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
  const [lastBackendCheckLabel, setLastBackendCheckLabel] = useState('')
  const [lastSupabaseSyncLabel, setLastSupabaseSyncLabel] = useState('')
  

  const nowLabel = () => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  const exportHasData = connectionMode === 'auto' ? (supabaseTelemetry && supabaseTelemetry.length > 0) : telemetryHistory.length > 0

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

  // Auto-refresh Supabase data via polling using SUPABASE_POLL_INTERVAL_MS.
  useEffect(() => {
    if (!supabaseConfigured) return

    const id = setInterval(() => {
      loadSupabaseTelemetry()
    }, SUPABASE_POLL_INTERVAL_MS)

    return () => clearInterval(id)
  }, [supabaseConfigured])

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
        value:
          connectionMode === 'auto'
            ? 'Auto'
            : connectionMode === 'manual'
              ? 'Telemetría manual'
              : connectionMode === 'real'
                ? 'Real'
                : 'Simulado',
        detail:
          connectionMode === 'auto'
            ? 'Intenta backend y cae a simulación si falla.'
            : connectionMode === 'manual'
              ? 'Permite enviar telemetría desde el formulario manual.'
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
      const payloadToSend = {
        deveui: telemetryData.deveui ?? 'ABC123',
        humedad: telemetryData.humedad ?? telemetryData.humedad_aire ?? null,
        temperatura: telemetryData.temperatura ?? null,
        ph: telemetryData.ph ?? null,
        voltaje: telemetryData.voltaje ?? null,
        humedad_aire: telemetryData.humedad_aire ?? null,
        humedad_suelo: telemetryData.humedad_suelo ?? null,
      }

      const response = await sendTelemetry(payloadToSend, connectionMode)
      const registered = response?.data?.[0] ?? null
      const createdAtLabel = new Date().toLocaleString('es-CL')

      const telemetryEntry = {
        // keep incoming shape (includes humedad_aire/humedad_suelo when provided)
        ...telemetryData,
        // ensure legacy `humedad` exists for older views/exports
        humedad: telemetryData.humedad ?? telemetryData.humedad_aire ?? telemetryData.humedad_suelo ?? null,
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
    const rowsToExport = connectionMode === 'auto' ? (supabaseTelemetry.slice(0, 50) || []) : telemetryHistory.slice(0, 50)
    const exported = exportTelemetryToPdf(rowsToExport)
    setExportMessage(
      exported
        ? 'Se abrió la vista de impresión para guardar el reporte en PDF.'
        : 'No se pudo generar el PDF. Verifica que existan datos y que el navegador permita ventanas emergentes.',
    )
  }

  const handleExportExcel = () => {
    const rowsToExport = connectionMode === 'auto' ? (supabaseTelemetry.slice(0, 50) || []) : telemetryHistory.slice(0, 50)
    const exported = exportTelemetryToExcel(rowsToExport)
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