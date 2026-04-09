// Types
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed'
export type Priority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type RoadmapStatus = 'planned' | 'in-progress' | 'completed'

export interface Project {
  id: string
  name: string
  description: string
  image: string
  status: ProjectStatus
  priority: Priority
  startDate: string
  dueDate: string
  progress: number
  tags: string[]
}

export interface RoadmapItem {
  id: string
  projectId: string
  title: string
  description: string
  status: RoadmapStatus
  position: number
  startDate?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export type SubtaskResult = 'pending' | 'pass' | 'fail'

export interface Subtask {
  id: string
  title: string
  completed: boolean
  result?: SubtaskResult
  resultNote?: string
}

export interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
}

export interface Task {
  id: string
  title: string
  description: string
  projectId: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  tags: string[]
  roadmapItemId?: string
  subtasks?: Subtask[]
  comments?: Comment[]
}

export interface Note {
  id: string
  projectId: string
  taskId?: string
  content: string
  timestamp: string
}

export type ResourceType =
  | 'code'
  | 'document'
  | 'spreadsheet'
  | 'dataset'
  | 'link'
  | 'image'
  | 'other'

export type ResourceStatus = 'draft' | 'ready' | 'applied' | 'archived'
export type ResourceLinkTargetType = 'project' | 'resource'

export interface ResourceLink {
  id: string
  sourceResourceId: string
  targetType: ResourceLinkTargetType
  targetId: string
  targetName: string
  label?: string
  createdAt: string
}

export interface ResourceBacklink {
  id: string
  sourceResourceId: string
  sourceResourceTitle: string
  sourceProjectId?: string
  sourceProjectName?: string
  label?: string
  createdAt: string
}

export type ResourceGraphEdgeKind =
  | 'primary-project'
  | 'explicit-project'
  | 'explicit-resource'

export interface ResourceGraphEdge {
  id: string
  sourceType: ResourceLinkTargetType
  sourceId: string
  targetType: ResourceLinkTargetType
  targetId: string
  kind: ResourceGraphEdgeKind
  label?: string
}

export interface Resource {
  id: string
  projectId?: string
  taskId?: string
  title: string
  content: string
  description: string
  type: ResourceType
  language: string
  format: string
  sourceUrl: string
  status: ResourceStatus
  tags: string[]
  timestamp: string
  links?: ResourceLink[]
  backlinks?: ResourceBacklink[]
  unresolvedLinks?: string[]
}

export interface Activity {
  id: string
  type:
    | 'task_created'
    | 'task_completed'
    | 'project_updated'
    | 'note_added'
    | 'status_changed'
  description: string
  timestamp: string
  projectId?: string
  taskId?: string
}

// Mock Data
export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Rediseño del sitio web',
    description: 'Renovación completa del sitio web de la empresa con diseño moderno y mejor UX',
    image: '/images/proj-website-redesign.jpg',
    status: 'active',
    priority: 'high',
    startDate: '2026-03-01',
    dueDate: '2026-04-30',
    progress: 65,
    tags: ['diseño', 'frontend', 'prioridad'],
  },
  {
    id: 'proj-2',
    name: 'Desarrollo de app móvil',
    description: 'Construir una aplicación móvil multiplataforma para interacción con clientes',
    image: '/images/proj-mobile-app.jpg',
    status: 'active',
    priority: 'high',
    startDate: '2026-02-15',
    dueDate: '2026-06-15',
    progress: 40,
    tags: ['móvil', 'react-native', 'api'],
  },
  {
    id: 'proj-3',
    name: 'Integración de APIs',
    description: 'Integrar APIs de pago y analítica de terceros',
    image: '/images/proj-api-integration.jpg',
    status: 'planning',
    priority: 'medium',
    startDate: '2026-04-01',
    dueDate: '2026-05-15',
    progress: 10,
    tags: ['backend', 'api', 'integración'],
  },
  {
    id: 'proj-4',
    name: 'Actualización de documentación',
    description: 'Actualizar documentación técnica y crear guías de usuario',
    image: '/images/proj-documentation.jpg',
    status: 'on-hold',
    priority: 'low',
    startDate: '2026-03-15',
    dueDate: '2026-04-15',
    progress: 25,
    tags: ['documentación', 'redacción'],
  },
  {
    id: 'proj-5',
    name: 'Auditoría de seguridad',
    description: 'Revisión integral de seguridad y evaluación de vulnerabilidades',
    image: '/images/proj-security-audit.jpg',
    status: 'completed',
    priority: 'high',
    startDate: '2026-01-10',
    dueDate: '2026-02-28',
    progress: 100,
    tags: ['seguridad', 'auditoría', 'cumplimiento'],
  },
  {
    id: 'proj-6',
    name: 'Optimización de rendimiento',
    description: 'Mejorar el rendimiento de la aplicación y reducir tiempos de carga',
    image: '/images/proj-performance.jpg',
    status: 'active',
    priority: 'medium',
    startDate: '2026-03-20',
    dueDate: '2026-04-20',
    progress: 55,
    tags: ['rendimiento', 'optimización', 'backend'],
  },
]

export const tasks: Task[] = [
  // Tareas: rediseño del sitio web
  {
    id: 'task-1',
    title: 'Diseñar mockup de inicio',
    description: 'Crear mockup de alta fidelidad para la nueva página principal',
    projectId: 'proj-1',
    status: 'done',
    priority: 'high',
    dueDate: '2026-03-15',
    tags: ['diseño', 'ui'],
    roadmapItemId: 'roadmap-1',
  },
  {
    id: 'task-2',
    title: 'Implementar componente de navegación',
    description: 'Construir navegación responsiva con menú móvil',
    projectId: 'proj-1',
    status: 'done',
    priority: 'high',
    dueDate: '2026-03-20',
    tags: ['frontend', 'componente'],
    roadmapItemId: 'roadmap-2',
  },
  {
    id: 'task-3',
    title: 'Crear sección de pie de página',
    description: 'Diseñar e implementar footer con enlaces y registro a newsletter',
    projectId: 'proj-1',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-04-05',
    tags: ['frontend', 'componente'],
    roadmapItemId: 'roadmap-2',
    subtasks: [
      { id: 'st-1', title: 'Agregar estructura HTML base', completed: true, result: 'fail', resultNote: 'El snippet está mal formateado y requiere revisión' },
      { id: 'st-2', title: 'Estilizar footer con Tailwind CSS', completed: false, result: 'pending' },
      { id: 'st-3', title: 'Agregar formulario de newsletter', completed: false, result: 'pending' },
      { id: 'st-4', title: 'Agregar enlaces de redes sociales', completed: false, result: 'pending' },
    ],
    comments: [
      { id: 'cmt-1', author: 'Tú', content: 'Comencé con el footer. La estructura HTML debe seguir el sistema de diseño.', timestamp: '2026-04-03T10:00:00Z' },
      { id: 'cmt-2', author: 'Tú', content: 'El snippet falló validación. Hay que corregir el problema de elementos anidados.', timestamp: '2026-04-04T09:30:00Z' },
    ],
  },
  {
    id: 'task-4',
    title: 'Configurar formulario de contacto',
    description: 'Construir formulario de contacto con validación e integración de correo',
    projectId: 'proj-1',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-10',
    tags: ['frontend', 'formularios'],
    roadmapItemId: 'roadmap-3',
  },
  {
    id: 'task-5',
    title: 'Optimizar imágenes',
    description: 'Comprimir y optimizar todas las imágenes del sitio',
    projectId: 'proj-1',
    status: 'todo',
    priority: 'low',
    dueDate: '2026-04-15',
    tags: ['optimización', 'assets'],
  },
  // Tareas: app móvil
  {
    id: 'task-6',
    title: 'Configurar proyecto React Native',
    description: 'Inicializar proyecto con configuración correcta',
    projectId: 'proj-2',
    status: 'done',
    priority: 'high',
    dueDate: '2026-02-20',
    tags: ['configuración', 'móvil'],
    roadmapItemId: 'roadmap-4',
  },
  {
    id: 'task-7',
    title: 'Diseñar navegación de la app',
    description: 'Crear estructura de navegación y barra de pestañas',
    projectId: 'proj-2',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-03-25',
    tags: ['navegación', 'móvil'],
    roadmapItemId: 'roadmap-4',
  },
  {
    id: 'task-8',
    title: 'Implementar autenticación',
    description: 'Construir pantallas de inicio y registro',
    projectId: 'proj-2',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-04-01',
    tags: ['auth', 'seguridad'],
    roadmapItemId: 'roadmap-5',
    subtasks: [
      { id: 'st-5', title: 'Crear UI de inicio de sesión', completed: true, result: 'pass' },
      { id: 'st-6', title: 'Crear UI de registro', completed: true, result: 'pass' },
      { id: 'st-7', title: 'Implementar manejo de token JWT', completed: false, result: 'pending' },
      { id: 'st-8', title: 'Agregar autenticación biométrica', completed: false, result: 'pending' },
      { id: 'st-9', title: 'Probar deep linking para OAuth', completed: true, result: 'fail', resultNote: 'Deep linking en Android no funciona correctamente' },
    ],
    comments: [
      { id: 'cmt-3', author: 'Tú', content: 'El flujo en iOS está completo y probado. Continúo con Android.', timestamp: '2026-04-01T14:00:00Z' },
      { id: 'cmt-4', author: 'Tú', content: 'Problema de deep linking en Android: hay que revisar el manifest.', timestamp: '2026-04-02T11:20:00Z' },
    ],
  },
  {
    id: 'task-9',
    title: 'Construir pantalla principal',
    description: 'Crear dashboard principal con métricas y acciones rápidas',
    projectId: 'proj-2',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-15',
    tags: ['ui', 'dashboard'],
    roadmapItemId: 'roadmap-5',
  },
  {
    id: 'task-10',
    title: 'Configurar notificaciones push',
    description: 'Configurar servicio de notificaciones push',
    projectId: 'proj-2',
    status: 'blocked',
    priority: 'medium',
    dueDate: '2026-04-20',
    tags: ['notificaciones', 'backend'],
    roadmapItemId: 'roadmap-5',
  },
  // Tareas: integración de APIs
  {
    id: 'task-11',
    title: 'Investigar APIs de pago',
    description: 'Evaluar integraciones de Stripe, PayPal y Square',
    projectId: 'proj-3',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-04-05',
    tags: ['investigación', 'pagos'],
    roadmapItemId: 'roadmap-6',
  },
  {
    id: 'task-12',
    title: 'Crear documentación de API',
    description: 'Documentar endpoints y uso de la API',
    projectId: 'proj-3',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-20',
    tags: ['documentación', 'api'],
    roadmapItemId: 'roadmap-7',
  },
  // Tareas: documentación
  {
    id: 'task-13',
    title: 'Actualizar guía de inicio',
    description: 'Renovar la documentación de primeros pasos',
    projectId: 'proj-4',
    status: 'todo',
    priority: 'low',
    dueDate: '2026-04-10',
    tags: ['documentación'],
    roadmapItemId: 'roadmap-8',
  },
  // Tareas: rendimiento
  {
    id: 'task-14',
    title: 'Analizar rendimiento actual',
    description: 'Ejecutar Lighthouse e identificar cuellos de botella',
    projectId: 'proj-6',
    status: 'done',
    priority: 'high',
    dueDate: '2026-03-25',
    tags: ['análisis', 'rendimiento'],
    roadmapItemId: 'roadmap-9',
  },
  {
    id: 'task-15',
    title: 'Implementar code splitting',
    description: 'Agregar imports dinámicos y lazy loading',
    projectId: 'proj-6',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-04-05',
    tags: ['optimización', 'frontend'],
    roadmapItemId: 'roadmap-10',
    subtasks: [
      { id: 'st-10', title: 'Configurar bundling para code splitting', completed: true, result: 'pass' },
      { id: 'st-11', title: 'Agregar lazy loading por ruta', completed: true, result: 'pass' },
      { id: 'st-12', title: 'Probar compatibilidad SSR', completed: false, result: 'pending' },
    ],
    comments: [
      { id: 'cmt-5', author: 'Tú', content: 'El splitting por ruta funciona. El tamaño de bundle bajó 40%.', timestamp: '2026-04-01T11:00:00Z' },
    ],
  },
  {
    id: 'task-16',
    title: 'Configurar caché CDN',
    description: 'Configurar CDN para assets estáticos',
    projectId: 'proj-6',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-12',
    tags: ['infraestructura', 'caché'],
    roadmapItemId: 'roadmap-10',
  },
  {
    id: 'task-17',
    title: 'Optimización de consultas DB',
    description: 'Optimizar consultas lentas de base de datos',
    projectId: 'proj-6',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-04-10',
    tags: ['base-datos', 'backend'],
    roadmapItemId: 'roadmap-11',
  },
  // Tareas adicionales
  {
    id: 'task-18',
    title: 'Revisión de feedback de usuarios',
    description: 'Analizar feedback reciente y priorizar incidencias',
    projectId: 'proj-1',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-04-08',
    tags: ['investigación', 'ux'],
    roadmapItemId: 'roadmap-1',
  },
  {
    id: 'task-19',
    title: 'Configurar pruebas A/B',
    description: 'Configurar pruebas A/B para nuevas funcionalidades',
    projectId: 'proj-2',
    status: 'todo',
    priority: 'low',
    dueDate: '2026-05-01',
    tags: ['testing', 'analítica'],
    roadmapItemId: 'roadmap-5',
  },
  {
    id: 'task-20',
    title: 'Renovación de certificado SSL',
    description: 'Renovar certificados SSL por vencer',
    projectId: 'proj-5',
    status: 'done',
    priority: 'high',
    dueDate: '2026-02-15',
    tags: ['seguridad', 'infraestructura'],
    roadmapItemId: 'roadmap-12',
  },
]

export const activities: Activity[] = [
  {
    id: 'act-1',
    type: 'task_completed',
    description: 'Se completó "Diseñar mockup de inicio" en Rediseño del sitio web',
    timestamp: '2026-04-04T09:30:00Z',
    projectId: 'proj-1',
    taskId: 'task-1',
  },
  {
    id: 'act-2',
    type: 'status_changed',
    description: 'Avance de Rediseño del sitio web actualizado a 65%',
    timestamp: '2026-04-04T08:15:00Z',
    projectId: 'proj-1',
  },
  {
    id: 'act-3',
    type: 'task_created',
    description: 'Se creó la tarea "Revisión de feedback de usuarios"',
    timestamp: '2026-04-03T14:45:00Z',
    projectId: 'proj-1',
    taskId: 'task-18',
  },
  {
    id: 'act-4',
    type: 'project_updated',
    description: 'Optimización de rendimiento cambió a estado activo',
    timestamp: '2026-04-03T10:00:00Z',
    projectId: 'proj-6',
  },
  {
    id: 'act-5',
    type: 'task_completed',
    description: 'Se completó la tarea "Analizar rendimiento actual"',
    timestamp: '2026-04-02T16:30:00Z',
    projectId: 'proj-6',
    taskId: 'task-14',
  },
  {
    id: 'act-6',
    type: 'note_added',
    description: 'Se agregó una nota en Desarrollo de app móvil',
    timestamp: '2026-04-02T11:20:00Z',
    projectId: 'proj-2',
  },
  {
    id: 'act-7',
    type: 'task_created',
    description: 'Se creó la tarea "Optimización de consultas DB"',
    timestamp: '2026-04-01T09:00:00Z',
    projectId: 'proj-6',
    taskId: 'task-17',
  },
  {
    id: 'act-8',
    type: 'status_changed',
    description: 'Actualización de documentación cambió a en pausa',
    timestamp: '2026-03-31T15:00:00Z',
    projectId: 'proj-4',
  },
]

export const notes: Note[] = [
  {
    id: 'note-1',
    projectId: 'proj-1',
    taskId: 'task-1',
    content: 'El cliente pidió un enfoque más minimalista. Priorizar espacios y tipografía.',
    timestamp: '2026-04-01T10:00:00Z',
  },
  {
    id: 'note-2',
    projectId: 'proj-1',
    content: 'Coordinar con marketing la actualización de lineamientos de marca antes del próximo sprint.',
    timestamp: '2026-03-28T14:30:00Z',
  },
  {
    id: 'note-3',
    projectId: 'proj-1',
    taskId: 'task-4',
    content: 'El formulario de contacto debe integrarse con Mailchimp para newsletter. Confirmar API key con backend.',
    timestamp: '2026-04-02T09:00:00Z',
  },
  {
    id: 'note-4',
    projectId: 'proj-2',
    taskId: 'task-8',
    content: 'El build de iOS funciona. Android necesita configuración extra para deep linking en autenticación.',
    timestamp: '2026-04-02T11:20:00Z',
  },
  {
    id: 'note-5',
    projectId: 'proj-2',
    content: 'Se acordó usar React Navigation v6. No migrar a Expo Router.',
    timestamp: '2026-03-30T15:45:00Z',
  },
  {
    id: 'note-6',
    projectId: 'proj-3',
    taskId: 'task-11',
    content: 'La API de Stripe parece la mejor opción. Agendar demo la próxima semana. PayPal tiene mayores comisiones.',
    timestamp: '2026-04-03T09:15:00Z',
  },
  {
    id: 'note-7',
    projectId: 'proj-6',
    taskId: 'task-14',
    content: 'Puntaje inicial de Lighthouse: 68. Objetivo: 90+. Problemas principales: imágenes pesadas y JS bloqueante.',
    timestamp: '2026-03-25T16:00:00Z',
  },
  {
    id: 'note-8',
    projectId: 'proj-6',
    taskId: 'task-15',
    content: 'Code splitting por rutas implementado. Falta validar que lazy loading no rompa SSR.',
    timestamp: '2026-04-01T11:00:00Z',
  },
]

export const resources: Resource[] = [
  {
    id: 'res-1',
    projectId: 'proj-1',
    taskId: 'task-3',
    title: 'Footer base en HTML',
    description: 'Estructura HTML utilizada para el footer del rediseño. Referencia a [[Integración de APIs]] y #html.',
    type: 'code',
    language: 'html',
    format: 'html',
    content:
      '<footer class="border-t py-6"><div class="mx-auto max-w-6xl px-4">...</div></footer>\n<!-- Compartido con [[Especificación de integración]] y #ui -->',
    sourceUrl: '',
    status: 'applied',
    tags: ['html', 'footer', 'ui'],
    timestamp: '2026-04-04T08:00:00Z',
  },
  {
    id: 'res-2',
    projectId: 'proj-3',
    title: 'Especificación de integración',
    description: 'Resumen de requisitos para la integración de pagos y analítica. Depende de [[Rediseño del sitio web]] y #api.',
    type: 'document',
    language: '',
    format: 'pdf',
    content: 'Checklist de integracion para [[Footer base en HTML]] y despliegue de #pagos.',
    sourceUrl: 'https://example.com/especificacion-integracion.pdf',
    status: 'ready',
    tags: ['pdf', 'requisitos', 'pagos'],
    timestamp: '2026-04-03T18:30:00Z',
  },
  {
    id: 'res-3',
    projectId: 'proj-6',
    title: 'Muestra de métricas',
    description: 'Exportación de métricas base para comparar optimizaciones. Cruza datos con [[Integración de APIs]] y #csv.',
    type: 'dataset',
    language: '',
    format: 'csv',
    content:
      'pagina,tiempo_carga,lcp,cls\ninicio,2.8,2.1,0.08\nproyecto,3.4,2.9,0.12',
    sourceUrl: '',
    status: 'draft',
    tags: ['csv', 'metricas', 'rendimiento'],
    timestamp: '2026-04-02T12:15:00Z',
  },
  {
    id: 'res-4',
    projectId: 'proj-2',
    title: 'AppSheet flujo de captura',
    description: 'Automatización del formulario móvil con #appsheet enlazada a [[Integración de APIs]].',
    type: 'code',
    language: 'appsheet',
    format: 'appsheet',
    content: 'LINKTOROW([_THISROW], "Detalle")\n/* conecta con [[Especificación de integración]] */',
    sourceUrl: '',
    status: 'draft',
    tags: ['appsheet', 'movil'],
    timestamp: '2026-04-05T00:10:00Z',
  },
]

export const resourceLinks: ResourceLink[] = [
  {
    id: 'res-link-1',
    sourceResourceId: 'res-1',
    targetType: 'project',
    targetId: 'proj-3',
    targetName: 'Integración de APIs',
    label: 'Integración de APIs',
    createdAt: '2026-04-04T08:00:00Z',
  },
  {
    id: 'res-link-2',
    sourceResourceId: 'res-1',
    targetType: 'resource',
    targetId: 'res-2',
    targetName: 'Especificación de integración',
    label: 'Especificación de integración',
    createdAt: '2026-04-04T08:00:00Z',
  },
  {
    id: 'res-link-3',
    sourceResourceId: 'res-3',
    targetType: 'project',
    targetId: 'proj-3',
    targetName: 'Integración de APIs',
    label: 'Integración de APIs',
    createdAt: '2026-04-02T12:15:00Z',
  },
  {
    id: 'res-link-4',
    sourceResourceId: 'res-4',
    targetType: 'resource',
    targetId: 'res-2',
    targetName: 'Especificación de integración',
    label: 'Especificación de integración',
    createdAt: '2026-04-05T00:10:00Z',
  },
]

export const roadmapItems: RoadmapItem[] = [
  {
    id: 'roadmap-1',
    projectId: 'proj-1',
    title: 'Descubrimiento y feedback',
    description: 'Recopilar hallazgos y confirmar dirección visual antes de cerrar sprint.',
    status: 'in-progress',
    position: 1,
    startDate: '2026-03-28',
    dueDate: '2026-04-08',
    createdAt: '2026-03-28T09:00:00Z',
    updatedAt: '2026-04-03T14:45:00Z',
  },
  {
    id: 'roadmap-2',
    projectId: 'proj-1',
    title: 'Construcción de layout base',
    description: 'Navegación, footer y estructura principal del sitio.',
    status: 'in-progress',
    position: 2,
    startDate: '2026-03-10',
    dueDate: '2026-04-05',
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-04-04T08:00:00Z',
  },
  {
    id: 'roadmap-3',
    projectId: 'proj-1',
    title: 'Captura y conversión',
    description: 'Formularios y puntos de contacto que convierten visitas en leads.',
    status: 'planned',
    position: 3,
    startDate: '2026-04-06',
    dueDate: '2026-04-15',
    createdAt: '2026-03-28T09:00:00Z',
    updatedAt: '2026-03-28T09:00:00Z',
  },
  {
    id: 'roadmap-4',
    projectId: 'proj-2',
    title: 'Fundación móvil',
    description: 'Base técnica y navegación principal de la aplicación.',
    status: 'in-progress',
    position: 1,
    startDate: '2026-02-15',
    dueDate: '2026-03-25',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-03-25T10:00:00Z',
  },
  {
    id: 'roadmap-5',
    projectId: 'proj-2',
    title: 'Experiencia de acceso y dashboard',
    description: 'Autenticación, home principal y notificaciones.',
    status: 'in-progress',
    position: 2,
    startDate: '2026-03-25',
    dueDate: '2026-05-01',
    createdAt: '2026-03-25T09:00:00Z',
    updatedAt: '2026-04-02T11:20:00Z',
  },
  {
    id: 'roadmap-6',
    projectId: 'proj-3',
    title: 'Evaluación de proveedores',
    description: 'Comparar integraciones de pago y validar alcance.',
    status: 'in-progress',
    position: 1,
    startDate: '2026-04-01',
    dueDate: '2026-04-08',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-03T09:15:00Z',
  },
  {
    id: 'roadmap-7',
    projectId: 'proj-3',
    title: 'Documentación y adopción',
    description: 'Definir contratos, documentación y siguiente fase de implementación.',
    status: 'planned',
    position: 2,
    startDate: '2026-04-08',
    dueDate: '2026-04-22',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'roadmap-8',
    projectId: 'proj-4',
    title: 'Actualización base',
    description: 'Renovar contenido principal y la guía de inicio.',
    status: 'planned',
    position: 1,
    startDate: '2026-04-01',
    dueDate: '2026-04-15',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'roadmap-9',
    projectId: 'proj-6',
    title: 'Diagnóstico',
    description: 'Medir estado actual y priorizar cuellos de botella.',
    status: 'completed',
    position: 1,
    startDate: '2026-03-20',
    dueDate: '2026-03-28',
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-03-25T16:00:00Z',
  },
  {
    id: 'roadmap-10',
    projectId: 'proj-6',
    title: 'Entrega frontend',
    description: 'Reducir bundle, cargar menos JavaScript y optimizar assets.',
    status: 'in-progress',
    position: 2,
    startDate: '2026-03-28',
    dueDate: '2026-04-12',
    createdAt: '2026-03-28T09:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
  },
  {
    id: 'roadmap-11',
    projectId: 'proj-6',
    title: 'Optimización backend',
    description: 'Resolver consultas lentas y puntos críticos de datos.',
    status: 'planned',
    position: 3,
    startDate: '2026-04-08',
    dueDate: '2026-04-15',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'roadmap-12',
    projectId: 'proj-5',
    title: 'Mitigación inmediata',
    description: 'Escaneo, certificados y cierre de vulnerabilidades urgentes.',
    status: 'completed',
    position: 1,
    startDate: '2026-01-10',
    dueDate: '2026-02-15',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
  },
]

// Helper functions
export function getProjects(): Project[] {
  return projects
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}

export function getTasksByProjectId(projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId)
}

export function getTasks(): Task[] {
  return tasks
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id)
}

export function getRoadmapItemsByProjectId(projectId: string): RoadmapItem[] {
  return roadmapItems
    .filter((item) => item.projectId === projectId)
    .sort((left, right) => left.position - right.position)
}

export function getActivities(limit?: number): Activity[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  return limit ? sorted.slice(0, limit) : sorted
}

export function getNotesByProjectId(projectId: string): Note[] {
  return notes.filter((n) => n.projectId === projectId)
}

export function getResources(): Resource[] {
  return [...resources].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export function getResourcesByProjectId(projectId: string): Resource[] {
  return getResources().filter((resource) => resource.projectId === projectId)
}

export function getRecentResources(limit = 5): Resource[] {
  return getResources().slice(0, limit)
}

export function getResourceLinks(): ResourceLink[] {
  return [...resourceLinks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

// Stats helpers
export function getProjectStats() {
  const active = projects.filter((p) => p.status === 'active').length
  const completed = projects.filter((p) => p.status === 'completed').length
  const total = projects.length
  
  const today = new Date()
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && new Date(t.dueDate) < today
  ).length
  
  const dueThisWeek = tasks.filter(
    (t) =>
      t.status !== 'done' &&
      new Date(t.dueDate) >= today &&
      new Date(t.dueDate) <= weekFromNow
  ).length
  
  return {
    activeProjects: active,
    completedProjects: completed,
    totalProjects: total,
    overdueTasks,
    dueThisWeek,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'done').length,
  }
}

export function getTaskStats() {
  return {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }
}

// Status and priority color helpers
export const statusColors: Record<ProjectStatus, string> = {
  planning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'on-hold': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  completed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export const taskStatusColors: Record<TaskStatus, string> = {
  todo: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  'in-progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  blocked: 'bg-red-500/10 text-red-500 border-red-500/20',
  done: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

export const priorityColors: Record<Priority, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export const statusLabels: Record<ProjectStatus, string> = {
  planning: 'Planeación',
  active: 'Activo',
  'on-hold': 'En pausa',
  completed: 'Completado',
}

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'Por hacer',
  'in-progress': 'En progreso',
  blocked: 'Bloqueada',
  done: 'Hecha',
}

export const roadmapStatusColors: Record<RoadmapStatus, string> = {
  planned: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  'in-progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

export const roadmapStatusLabels: Record<RoadmapStatus, string> = {
  planned: 'Planeada',
  'in-progress': 'En progreso',
  completed: 'Completada',
}

export const priorityLabels: Record<Priority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}
