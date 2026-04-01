export const summaryCards = [
  { label: 'Cultivos monitoreados', value: '--', detail: 'Sin registros cargados' },
  { label: 'Alertas activas', value: '--', detail: 'Sin reglas configuradas' },
  { label: 'Sensores en línea', value: '--', detail: 'Sin dispositivos enlazados' },
]

export const dashboardSections = [
  { id: 'overview', label: 'Resumen general' },
  { id: 'telemetry', label: 'Telemetría' },
  { id: 'alerts', label: 'Alertas' },
  { id: 'sensors', label: 'Sensores' },
  { id: 'users', label: 'Usuarios' },
  { id: 'tracking', label: 'Seguimiento' },
]

export const activityItems = [
  'Todavía no hay eventos recientes para mostrar.',
  'Las actividades aparecerán aquí cuando conectes el backend.',
  'Puedes usar esta base para integrar datos reales más adelante.',
]

export const upcomingTasks = [
  'Definir las métricas reales que mostrará el panel.',
  'Conectar autenticación y permisos por rol.',
  'Integrar consumo de API para datos productivos.',
]

export const quickActions = [
  {
    id: 'create-alert',
    title: 'Nueva alerta',
    description: 'Configura una plantilla vacía para futuras alertas.',
  },
  {
    id: 'add-sensor',
    title: 'Agregar sensor',
    description: 'Prepara el flujo para registrar nuevos dispositivos.',
  },
  {
    id: 'invite-user',
    title: 'Invitar usuario',
    description: 'Habilita el espacio para administrar accesos.',
  },
]

export const sectionContent = {
  overview: {
    title: 'Resumen general',
    description:
      'Vista principal del sistema con componentes activos y áreas preparadas para datos reales.',
    emptyTitle: 'Sin datos conectados todavía',
    emptyDescription:
      'Esta sección ya funciona como base visual. Cuando conectes el backend, aquí podrás mostrar métricas, gráficas y estados operativos.',
  },
  telemetry: {
    title: 'Registros de telemetría',
    description:
      'Centro de monitoreo para enviar, consultar y exportar datos de telemetría desde sensores.',
    emptyTitle: 'Sin telemetría configurada',
    emptyDescription:
      'Envía muestras de telemetría usando el formulario, visualiza gráficos en tiempo real y exporta los datos.',
  },
  alerts: {
    title: 'Centro de alertas',
    description:
      'Espacio preparado para listar alertas, criticidad, estados y acciones rápidas.',
    emptyTitle: 'No hay alertas configuradas',
    emptyDescription:
      'Puedes usar este módulo para crear una tabla, filtros y detalle de alertas cuando la lógica esté conectada.',
  },
  sensors: {
    title: 'Gestión de sensores',
    description:
      'Sección lista para mostrar sensores, conectividad, batería y última telemetría recibida.',
    emptyTitle: 'No hay sensores enlazados',
    emptyDescription:
      'Aquí puedes conectar luego cards, tablas o un mapa con dispositivos IoT y su estado.',
  },
  users: {
    title: 'Administración de usuarios',
    description:
      'Módulo base para roles, permisos y cuentas del sistema.',
    emptyTitle: 'No hay usuarios cargados',
    emptyDescription:
      'La interfaz ya está preparada para incorporar formularios, listado de usuarios y control de acceso.',
  },
  tracking: {
    title: 'Seguimiento del sistema',
    description:
      'Vista dedicada para revisar actividad reciente y próximos pasos del proyecto.',
    emptyTitle: 'Sin eventos recientes',
    emptyDescription:
      'Aquí se agruparán los hitos, alertas históricas y tareas pendientes del sistema.',
  },
}