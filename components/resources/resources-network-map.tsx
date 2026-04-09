'use client'

import Link from 'next/link'
import { startTransition, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  ChevronRight,
  Code2,
  Crosshair,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe,
  GripHorizontal,
  HardDriveDownload,
  Layers3,
  Package,
  RotateCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResourceInspector as SharedResourceInspector } from '@/components/resources/resource-inspector'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  type Project,
  type Resource,
  type ResourceGraphEdge,
  type ResourceStatus,
  type ResourceType,
} from '@/lib/data'
import { formatDateTime } from '@/lib/date'
import { cn } from '@/lib/utils'

interface ResourcesNetworkMapProps {
  resources: Resource[]
  projects: Project[]
  edges: ResourceGraphEdge[]
}

interface Position {
  x: number
  y: number
}

interface DragState {
  id: string
  offsetX: number
  offsetY: number
}

interface ResourceBucket {
  key: string
  nodeId: string
  type: ResourceType
  resources: Resource[]
  technologies: string[]
}

interface ProjectCluster {
  nodeId: string
  project?: Project
  title: string
  description: string
  resources: Resource[]
  buckets: ResourceBucket[]
  isVirtual?: boolean
}

const resourceTypeLabels: Record<ResourceType, string> = {
  code: 'Codigo',
  document: 'Documento',
  spreadsheet: 'Hoja',
  dataset: 'Dataset',
  link: 'Enlace',
  image: 'Imagen',
  other: 'Otro',
}

const resourceStatusLabels: Record<ResourceStatus, string> = {
  draft: 'Borrador',
  ready: 'Listo',
  applied: 'Aplicado',
  archived: 'Archivado',
}

const resourceTypeIcons: Record<ResourceType, typeof Code2> = {
  code: Code2,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  dataset: HardDriveDownload,
  link: Globe,
  image: FileImage,
  other: Package,
}

const resourceTypeColors: Record<ResourceType, string> = {
  code: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100',
  document: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
  spreadsheet: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
  dataset: 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-100',
  link: 'border-sky-400/25 bg-sky-400/10 text-sky-100',
  image: 'border-pink-400/25 bg-pink-400/10 text-pink-100',
  other: 'border-zinc-400/25 bg-zinc-400/10 text-zinc-100',
}

const resourceStatusColors: Record<ResourceStatus, string> = {
  draft: 'border-zinc-400/20 bg-zinc-400/10 text-zinc-200',
  ready: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
  applied: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  archived: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
}

const techAccentColors: Record<string, string> = {
  html: 'border-orange-400/35 bg-orange-400/12 text-orange-100 shadow-[0_0_24px_rgba(251,146,60,0.18)]',
  appsheet: 'border-emerald-400/35 bg-emerald-400/12 text-emerald-100 shadow-[0_0_24px_rgba(74,222,128,0.18)]',
  r: 'border-sky-400/35 bg-sky-400/12 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.18)]',
  css: 'border-cyan-400/35 bg-cyan-400/12 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]',
  javascript: 'border-amber-400/35 bg-amber-400/12 text-amber-100 shadow-[0_0_24px_rgba(250,204,21,0.18)]',
  typescript: 'border-blue-400/35 bg-blue-400/12 text-blue-100 shadow-[0_0_24px_rgba(96,165,250,0.18)]',
  sql: 'border-violet-400/35 bg-violet-400/12 text-violet-100 shadow-[0_0_24px_rgba(167,139,250,0.18)]',
  pdf: 'border-rose-400/35 bg-rose-400/12 text-rose-100 shadow-[0_0_24px_rgba(251,113,133,0.18)]',
  csv: 'border-lime-400/35 bg-lime-400/12 text-lime-100 shadow-[0_0_24px_rgba(163,230,53,0.18)]',
}

const resourceTypeOrder: ResourceType[] = [
  'document',
  'spreadsheet',
  'dataset',
  'code',
  'link',
  'image',
  'other',
]

const PROJECT_NODE_WIDTH = 336
const PROJECT_START_X = 72
const PROJECT_GAP_Y = 92
const BUCKET_NODE_WIDTH = 248
const BUCKET_NODE_HEIGHT = 116
const BUCKET_START_OFFSET_X = 132
const BUCKET_GAP_Y = 26
const RESOURCE_NODE_WIDTH = 256
const RESOURCE_NODE_HEIGHT = 142
const RESOURCE_START_OFFSET_X = 96
const RESOURCE_GAP_X = 30
const RESOURCE_GAP_Y = 26
const RESOURCE_COLUMNS = 2
const MAX_VISIBLE_RESOURCE_NODES = 6

function estimateLineCount(text: string, charsPerLine: number) {
  if (!text.trim()) return 0
  return text
    .split('\n')
    .reduce((total, segment) => total + Math.max(1, Math.ceil(segment.trim().length / charsPerLine)), 0)
}

function getResourceTech(resource: Resource) {
  return resource.language || resource.format || null
}

function normalizeTechKey(value: string) {
  return value.trim().toLowerCase()
}

function getTechBadgeClass(tech: string, isHighlighted: boolean) {
  const accent = techAccentColors[normalizeTechKey(tech)] || 'border-white/12 bg-white/[0.06] text-zinc-200'
  return isHighlighted
    ? accent
    : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]'
}

function getProjectNodeHeight(cluster: ProjectCluster) {
  const titleLines = estimateLineCount(cluster.title, 18)
  const descriptionLines = estimateLineCount(cluster.description || '', 34)
  return Math.max(176, 112 + titleLines * 18 + descriptionLines * 12)
}

function buildResourceBuckets(resources: Resource[], clusterNodeId: string) {
  return resourceTypeOrder.flatMap((type) => {
    const bucketResources = resources.filter((resource) => resource.type === type)
    if (bucketResources.length === 0) return []

    const technologies = Array.from(
      new Set(
        bucketResources
          .map((resource) => getResourceTech(resource))
          .filter((value): value is string => Boolean(value))
      )
    )

    return [
      {
        key: `${clusterNodeId}:${type}`,
        nodeId: `${clusterNodeId}:bucket:${type}`,
        type,
        resources: bucketResources,
        technologies,
      },
    ]
  })
}

function buildClusters(projects: Project[], resources: Resource[], edges: ResourceGraphEdge[]): ProjectCluster[] {
  const resourcesByProjectId = resources.reduce<Record<string, Resource[]>>((acc, resource) => {
    const key = resource.projectId || '__unassigned__'
    acc[key] = [...(acc[key] ?? []), resource]
    return acc
  }, {})

  const connectedProjectIds = new Set(
    edges.flatMap((edge) => {
      const ids: string[] = []
      if (edge.sourceType === 'project') ids.push(edge.sourceId)
      if (edge.targetType === 'project') ids.push(edge.targetId)
      return ids
    })
  )

  const ordered: ProjectCluster[] = projects
    .filter((project) => (resourcesByProjectId[project.id] ?? []).length > 0 || connectedProjectIds.has(project.id))
    .map((project) => {
      const nodeId = `project:${project.id}`
      const projectResources = resourcesByProjectId[project.id] ?? []

      return {
        nodeId,
        project,
        title: project.name,
        description: project.description,
        resources: projectResources,
        buckets: buildResourceBuckets(projectResources, nodeId),
      }
    })

  const unknownProjectIds = Object.keys(resourcesByProjectId).filter(
    (key) => key !== '__unassigned__' && !projects.some((project) => project.id === key)
  )

  const orphanClusters: ProjectCluster[] = unknownProjectIds.map((projectId) => {
    const nodeId = `project:${projectId}`
    const projectResources = resourcesByProjectId[projectId]

    return {
      nodeId,
      project: undefined,
      title: 'Proyecto no disponible',
      description: 'Recursos asociados a un proyecto que no pudo resolverse en esta vista.',
      resources: projectResources,
      buckets: buildResourceBuckets(projectResources, nodeId),
      isVirtual: true,
    }
  })

  const unassignedCluster: ProjectCluster[] = resourcesByProjectId.__unassigned__
    ? [{
        nodeId: 'project:__unassigned__',
        project: undefined,
        title: 'Sin proyecto',
        description: 'Recursos capturados sin asociarlos a un proyecto concreto.',
        resources: resourcesByProjectId.__unassigned__,
        buckets: buildResourceBuckets(resourcesByProjectId.__unassigned__, 'project:__unassigned__'),
        isVirtual: true,
      }]
    : []

  return [...ordered, ...orphanClusters, ...unassignedCluster]
}

function createInitialProjectPositions(
  clusters: ProjectCluster[],
  projectHeights: Record<string, number>
) {
  const positions: Record<string, Position> = {}
  let currentY = 72

  for (const cluster of clusters) {
    positions[cluster.nodeId] = { x: PROJECT_START_X, y: currentY }
    currentY += (projectHeights[cluster.nodeId] ?? 176) + PROJECT_GAP_Y
  }

  return positions
}

function edgePath(startX: number, startY: number, endX: number, endY: number) {
  const controlOffset = Math.max(84, Math.abs(endX - startX) * 0.34)
  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY} ${
    endX - controlOffset
  } ${endY} ${endX} ${endY}`
}

function GraphHandle({
  onPointerDown,
}: {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      className="inline-flex cursor-grab items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-400 active:cursor-grabbing"
      aria-label="Mover proyecto"
    >
      <GripHorizontal className="size-3" />
      mover
    </button>
  )
}

function CanvasInspector({
  cluster,
  bucket,
  resource,
  onSelectBucket,
  onSelectResource,
}: {
  cluster: ProjectCluster | null
  bucket: ResourceBucket | null
  resource: Resource | null
  onSelectBucket: (bucketKey: string) => void
  onSelectResource: (resourceId: string, bucketKey: string) => void
}) {
  if (resource) {
    return (
      <SharedResourceInspector
        resource={resource}
        project={cluster?.project ?? null}
        projectHref={cluster?.project ? `/projects/${cluster.project.id}` : undefined}
      />
    )
  }

  if (bucket) {
    const Icon = resourceTypeIcons[bucket.type]

    return (
      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
            <Layers3 className="size-3.5" />
            Grupo activo
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('inline-flex size-11 items-center justify-center rounded-2xl border', resourceTypeColors[bucket.type])}>
              <Icon className="size-4.5" />
            </div>
            <div>
              <h3 className="text-xl font-medium tracking-tight text-white">
                {resourceTypeLabels[bucket.type]}
              </h3>
              <p className="text-sm text-zinc-400">
                {bucket.resources.length} recursos dentro de este proyecto.
              </p>
            </div>
          </div>
        </div>

        {bucket.technologies.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Tecnologias</p>
            <div className="flex flex-wrap gap-2">
              {bucket.technologies.map((technology) => (
                <Badge key={technology} variant="outline" className="border-white/10 text-zinc-200">
                  {technology}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Recursos del grupo</p>
          <div className="space-y-2">
            {bucket.resources.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/18 hover:bg-white/[0.06]"
                onClick={() => onSelectResource(item.id, bucket.key)}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-zinc-100">{item.title}</div>
                  <div className="text-xs text-zinc-400">{item.description || 'Sin descripcion adicional'}</div>
                </div>
                <ChevronRight className="mt-1 size-4 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>

        {cluster ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Proyecto</p>
            <div className="mt-2 font-medium text-zinc-100">{cluster.title}</div>
            <div className="mt-1">{cluster.description}</div>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
                onClick={() => onSelectBucket(bucket.key)}
                disabled
              >
                Grupo en foco
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  if (cluster) {
    return (
      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
            <FolderKanban className="size-3.5" />
            Proyecto enfocado
          </div>
          <div>
            <h3 className="text-xl font-medium tracking-tight text-white">{cluster.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{cluster.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/10 text-zinc-200">
              {cluster.resources.length} recursos
            </Badge>
            <Badge variant="outline" className="border-white/10 text-zinc-200">
              {cluster.buckets.length} grupos
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Grupos del proyecto</p>
          <div className="space-y-2">
            {cluster.buckets.map((item) => {
              const Icon = resourceTypeIcons[item.type]
              return (
                <button
                  key={item.key}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/18 hover:bg-white/[0.06]"
                  onClick={() => onSelectBucket(item.key)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('inline-flex size-10 items-center justify-center rounded-2xl border', resourceTypeColors[item.type])}>
                      <Icon className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-zinc-100">{resourceTypeLabels[item.type]}</div>
                      <div className="text-xs text-zinc-400">
                        {item.resources.length} recursos
                        {item.technologies.length ? ` · ${item.technologies.slice(0, 2).join(' · ')}` : ''}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-zinc-500" />
                </button>
              )
            })}
          </div>
        </div>

        {cluster.project ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/projects/${cluster.project.id}`}>Abrir proyecto</Link>
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-5">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
          <Layers3 className="size-3.5" />
          Navegacion
        </div>
        <h3 className="text-xl font-medium tracking-tight text-white">Mapa navegable</h3>
        <p className="text-sm leading-6 text-zinc-400">
          Empieza por un proyecto. El canvas abre sus grupos por tipo y solo revela recursos cuando realmente hacen falta.
        </p>
      </div>
      <ul className="space-y-2 text-sm text-zinc-400">
        <li>Click en un proyecto para expandir sus grupos.</li>
        <li>Click en un grupo para ver recursos de ese tipo.</li>
        <li>Click en un recurso para inspección completa y preview.</li>
      </ul>
    </div>
  )
}

export function ResourcesNetworkMap({ resources, projects, edges }: ResourcesNetworkMapProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const clusters = useMemo(() => buildClusters(projects, resources, edges), [edges, projects, resources])
  const projectHeights = useMemo(
    () => Object.fromEntries(clusters.map((cluster) => [cluster.nodeId, getProjectNodeHeight(cluster)])),
    [clusters]
  )
  const resourcesById = useMemo(
    () => new Map(resources.map((resource) => [resource.id, resource])),
    [resources]
  )
  const clustersById = useMemo(
    () => new Map(clusters.map((cluster) => [cluster.nodeId, cluster])),
    [clusters]
  )

  const [projectPositions, setProjectPositions] = useState<Record<string, Position>>(() =>
    createInitialProjectPositions(clusters, projectHeights)
  )
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [activeBucketKey, setActiveBucketKey] = useState<string | null>(null)
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredTech, setHoveredTech] = useState<string | null>(null)

  useEffect(() => {
    setProjectPositions(createInitialProjectPositions(clusters, projectHeights))
  }, [clusters, projectHeights])

  useEffect(() => {
    if (!expandedProjectId) return
    if (!clustersById.has(expandedProjectId)) {
      setExpandedProjectId(null)
      setActiveBucketKey(null)
      setActiveResourceId(null)
    }
  }, [clustersById, expandedProjectId])

  const expandedCluster = expandedProjectId ? clustersById.get(expandedProjectId) ?? null : null
  const activeBucket = useMemo(
    () => expandedCluster?.buckets.find((bucket) => bucket.key === activeBucketKey) ?? null,
    [activeBucketKey, expandedCluster]
  )
  const activeResource = activeResourceId ? resourcesById.get(activeResourceId) ?? null : null
  const activeClusterNodeId = expandedCluster?.nodeId ?? null

  const expandedLayout = useMemo(() => {
    if (!expandedCluster) {
      return {
        bucketPositions: {} as Record<string, Position>,
        resourcePositions: {} as Record<string, Position>,
        overflowPosition: null as Position | null,
        visibleResources: [] as Resource[],
      }
    }

    const projectPosition = projectPositions[expandedCluster.nodeId] ?? { x: PROJECT_START_X, y: 72 }
    const bucketPositions: Record<string, Position> = {}

    expandedCluster.buckets.forEach((bucket, index) => {
      bucketPositions[bucket.nodeId] = {
        x: projectPosition.x + PROJECT_NODE_WIDTH + BUCKET_START_OFFSET_X,
        y: projectPosition.y + index * (BUCKET_NODE_HEIGHT + BUCKET_GAP_Y),
      }
    })

    const resourcePositions: Record<string, Position> = {}
    let overflowPosition: Position | null = null
    const visibleResources = activeBucket ? activeBucket.resources.slice(0, MAX_VISIBLE_RESOURCE_NODES) : []

    if (activeBucket) {
      const bucketPosition = bucketPositions[activeBucket.nodeId]
      visibleResources.forEach((resource, index) => {
        const column = index % RESOURCE_COLUMNS
        const row = Math.floor(index / RESOURCE_COLUMNS)
        resourcePositions[`resource:${resource.id}`] = {
          x: bucketPosition.x + BUCKET_NODE_WIDTH + RESOURCE_START_OFFSET_X + column * (RESOURCE_NODE_WIDTH + RESOURCE_GAP_X),
          y: bucketPosition.y + row * (RESOURCE_NODE_HEIGHT + RESOURCE_GAP_Y),
        }
      })

      if (activeBucket.resources.length > MAX_VISIBLE_RESOURCE_NODES) {
        const overflowIndex = visibleResources.length
        const column = overflowIndex % RESOURCE_COLUMNS
        const row = Math.floor(overflowIndex / RESOURCE_COLUMNS)
        overflowPosition = {
          x: bucketPosition.x + BUCKET_NODE_WIDTH + RESOURCE_START_OFFSET_X + column * (RESOURCE_NODE_WIDTH + RESOURCE_GAP_X),
          y: bucketPosition.y + row * (RESOURCE_NODE_HEIGHT + RESOURCE_GAP_Y),
        }
      }
    }

    return {
      bucketPositions,
      resourcePositions,
      overflowPosition,
      visibleResources,
    }
  }, [activeBucket, expandedCluster, projectPositions])

  useEffect(() => {
    if (!dragState) return

    const handlePointerMove = (event: PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const localX = event.clientX - rect.left
      const localY = event.clientY - rect.top

      setProjectPositions((prev) => ({
        ...prev,
        [dragState.id]: {
          x: Math.min(Math.max(localX - dragState.offsetX, 32), 420),
          y: Math.max(localY - dragState.offsetY, 32),
        },
      }))
    }

    const handlePointerUp = () => setDragState(null)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragState, projectHeights])

  const bounds = useMemo(() => {
    let width = 720
    let height = 720

    for (const cluster of clusters) {
      const position = projectPositions[cluster.nodeId]
      if (!position) continue
      width = Math.max(width, position.x + PROJECT_NODE_WIDTH + 96)
      height = Math.max(height, position.y + (projectHeights[cluster.nodeId] ?? 176) + 96)
    }

    if (expandedCluster) {
      for (const bucket of expandedCluster.buckets) {
        const position = expandedLayout.bucketPositions[bucket.nodeId]
        if (!position) continue
        width = Math.max(width, position.x + BUCKET_NODE_WIDTH + 96)
        height = Math.max(height, position.y + BUCKET_NODE_HEIGHT + 96)
      }

      for (const resource of expandedLayout.visibleResources) {
        const position = expandedLayout.resourcePositions[`resource:${resource.id}`]
        if (!position) continue
        width = Math.max(width, position.x + RESOURCE_NODE_WIDTH + 96)
        height = Math.max(height, position.y + RESOURCE_NODE_HEIGHT + 96)
      }

      if (expandedLayout.overflowPosition) {
        width = Math.max(width, expandedLayout.overflowPosition.x + RESOURCE_NODE_WIDTH + 96)
        height = Math.max(height, expandedLayout.overflowPosition.y + RESOURCE_NODE_HEIGHT + 96)
      }
    }

    return { width, height }
  }, [clusters, expandedCluster, expandedLayout, projectHeights, projectPositions])

  const allNodePositions = useMemo(() => {
    const positions: Record<string, Position> = { ...projectPositions, ...expandedLayout.bucketPositions, ...expandedLayout.resourcePositions }
    if (activeBucket && expandedLayout.overflowPosition) {
      positions[`overflow:${activeBucket.key}`] = expandedLayout.overflowPosition
    }
    return positions
  }, [activeBucket, expandedLayout, projectPositions])

  const normalizedHoveredTech = hoveredTech ? normalizeTechKey(hoveredTech) : null
  const technologyLabels = useMemo(
    () =>
      Array.from(
        new Set(
          resources
            .map((resource) => getResourceTech(resource))
            .filter((value): value is string => Boolean(value))
        )
      ).sort((left, right) => left.localeCompare(right)),
    [resources]
  )

  const matchesTech = (resource: Resource) =>
    normalizedHoveredTech ? normalizeTechKey(getResourceTech(resource) || '') === normalizedHoveredTech : false

  const focusProject = (clusterNodeId: string) => {
    startTransition(() => {
      setExpandedProjectId((current) => (current === clusterNodeId ? null : clusterNodeId))
      setActiveBucketKey(null)
      setActiveResourceId(null)
    })
  }

  const focusBucket = (bucketKey: string) => {
    if (!expandedCluster) return

    startTransition(() => {
      setActiveBucketKey((current) => (current === bucketKey ? null : bucketKey))
      setActiveResourceId(null)
    })
  }

  const focusResource = (resourceId: string, bucketKey: string, clusterNodeId: string) => {
    startTransition(() => {
      setExpandedProjectId(clusterNodeId)
      setActiveBucketKey(bucketKey)
      setActiveResourceId(resourceId)
    })
  }

  const beginDrag =
    (id: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
      const canvas = canvasRef.current
      const node = projectPositions[id]
      if (!canvas || !node) return

      event.preventDefault()
      event.stopPropagation()

      const rect = canvas.getBoundingClientRect()
      const localX = event.clientX - rect.left
      const localY = event.clientY - rect.top

      setDragState({
        id,
        offsetX: localX - node.x,
        offsetY: localY - node.y,
      })
    }

  const centerNode = (id: string) => {
    const viewport = viewportRef.current
    const node = allNodePositions[id]
    if (!viewport || !node) return

    const width =
      id.startsWith('project:')
        ? PROJECT_NODE_WIDTH
        : id.includes(':bucket:')
          ? BUCKET_NODE_WIDTH
          : RESOURCE_NODE_WIDTH
    const height =
      id.startsWith('project:')
        ? (projectHeights[id] ?? 176)
        : id.includes(':bucket:')
          ? BUCKET_NODE_HEIGHT
          : RESOURCE_NODE_HEIGHT

    viewport.scrollTo({
      left: Math.max(0, node.x - viewport.clientWidth / 2 + width / 2),
      top: Math.max(0, node.y - viewport.clientHeight / 2 + height / 2),
      behavior: 'smooth',
    })
  }

  const resetLayout = () => setProjectPositions(createInitialProjectPositions(clusters, projectHeights))

  if (clusters.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-[#09090c] px-8 py-16 text-center">
        <p className="text-sm text-zinc-300">No hay recursos para dibujar en el mapa.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Mapa global de recursos</h3>
          <p className="text-sm text-muted-foreground">
            Vista por capas: proyectos, grupos por tipo y detalle lateral cuando realmente hace falta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
            onClick={() => {
              setExpandedProjectId(null)
              setActiveBucketKey(null)
              setActiveResourceId(null)
              setHoveredNodeId(null)
              setHoveredTech(null)
            }}
          >
            Colapsar todo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
            onClick={resetLayout}
          >
            <RotateCcw className="size-3.5" />
            Reordenar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
            onClick={() => centerNode(activeResource ? `resource:${activeResource.id}` : activeBucket ? activeBucket.nodeId : expandedProjectId || clusters[0].nodeId)}
          >
            <Crosshair className="size-3.5" />
            Centrar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#09090c] shadow-2xl shadow-black/30">
            <div ref={viewportRef} className="h-[min(80vh,1080px)] overflow-auto">
              <div
                ref={canvasRef}
                className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.12),transparent_25%),linear-gradient(180deg,#09090c_0%,#0b0b10_100%)]"
                style={{ width: bounds.width, height: bounds.height }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.13)_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />

                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  width={bounds.width}
                  height={bounds.height}
                  viewBox={`0 0 ${bounds.width} ${bounds.height}`}
                >
                  {expandedCluster ? (
                    <>
                      {expandedCluster.buckets.map((bucket) => {
                        const projectPosition = projectPositions[expandedCluster.nodeId]
                        const bucketPosition = expandedLayout.bucketPositions[bucket.nodeId]
                        if (!projectPosition || !bucketPosition) return null

                        const bucketMatch = normalizedHoveredTech
                          ? bucket.resources.some(matchesTech)
                          : false

                        return (
                          <path
                            key={`${expandedCluster.nodeId}-${bucket.nodeId}`}
                            d={edgePath(
                              projectPosition.x + PROJECT_NODE_WIDTH,
                              projectPosition.y + (projectHeights[expandedCluster.nodeId] ?? 176) / 2,
                              bucketPosition.x,
                              bucketPosition.y + BUCKET_NODE_HEIGHT / 2
                            )}
                            fill="none"
                            stroke={
                              normalizedHoveredTech
                                ? bucketMatch
                                  ? 'rgba(145,255,230,0.82)'
                                  : 'rgba(255,255,255,0.08)'
                                : activeBucket?.nodeId === bucket.nodeId || activeResource
                                  ? 'rgba(255,255,255,0.54)'
                                  : 'rgba(255,255,255,0.22)'
                            }
                            strokeWidth={normalizedHoveredTech ? (bucketMatch ? '2.2' : '1') : '1.6'}
                            strokeLinecap="round"
                          />
                        )
                      })}

                      {activeBucket
                        ? expandedLayout.visibleResources.map((resource) => {
                            const bucketPosition = expandedLayout.bucketPositions[activeBucket.nodeId]
                            const resourcePosition = expandedLayout.resourcePositions[`resource:${resource.id}`]
                            if (!bucketPosition || !resourcePosition) return null

                            return (
                              <path
                                key={`${activeBucket.nodeId}-${resource.id}`}
                                d={edgePath(
                                  bucketPosition.x + BUCKET_NODE_WIDTH,
                                  bucketPosition.y + BUCKET_NODE_HEIGHT / 2,
                                  resourcePosition.x,
                                  resourcePosition.y + RESOURCE_NODE_HEIGHT / 2
                                )}
                                fill="none"
                                stroke={
                                  activeResourceId === resource.id
                                    ? 'rgba(255,255,255,0.9)'
                                    : normalizedHoveredTech
                                      ? matchesTech(resource)
                                        ? 'rgba(145,255,230,0.82)'
                                        : 'rgba(255,255,255,0.08)'
                                      : 'rgba(255,255,255,0.34)'
                                }
                                strokeWidth={activeResourceId === resource.id ? '2.2' : '1.4'}
                                strokeLinecap="round"
                              />
                            )
                          })
                        : null}
                    </>
                  ) : null}
                </svg>

                {clusters.map((cluster) => {
                  const projectMatch = normalizedHoveredTech
                    ? cluster.resources.some(matchesTech)
                    : false
                  const isExpanded = expandedProjectId === cluster.nodeId

                  return (
                    <div
                      key={cluster.nodeId}
                      role="button"
                      tabIndex={0}
                      aria-label={`Enfocar proyecto ${cluster.title}`}
                      className={cn(
                        'absolute rounded-[30px] border bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-200',
                        normalizedHoveredTech
                          ? projectMatch
                            ? 'border-white/18 opacity-100'
                            : 'border-white/8 opacity-40'
                          : expandedProjectId && !isExpanded
                            ? 'border-white/8 opacity-58'
                            : 'border-white/15 opacity-100',
                        isExpanded || hoveredNodeId === cluster.nodeId
                          ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_24px_80px_rgba(255,255,255,0.08)]'
                          : 'shadow-none'
                      )}
                      onMouseEnter={() => setHoveredNodeId(cluster.nodeId)}
                      onMouseLeave={() => setHoveredNodeId((current) => (current === cluster.nodeId ? null : current))}
                      onClick={() => {
                        focusProject(cluster.nodeId)
                        centerNode(cluster.nodeId)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          focusProject(cluster.nodeId)
                          centerNode(cluster.nodeId)
                        }
                      }}
                      style={{
                        left: projectPositions[cluster.nodeId]?.x ?? PROJECT_START_X,
                        top: projectPositions[cluster.nodeId]?.y ?? 72,
                        width: PROJECT_NODE_WIDTH,
                        minHeight: projectHeights[cluster.nodeId] ?? 176,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-400">
                            <FolderKanban className="size-3.5" />
                            {cluster.isVirtual ? 'Agrupacion' : 'Proyecto'}
                          </div>
                          <h4 className="max-w-[15rem] break-words text-[1.4rem] font-medium leading-[1.02] tracking-tight text-white">
                            {cluster.title}
                          </h4>
                          <p className="max-w-[16rem] break-words text-[12px] leading-[1.5] text-zinc-400">
                            {cluster.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3 text-right text-xs text-zinc-500">
                          <GraphHandle onPointerDown={beginDrag(cluster.nodeId)} />
                          <div>{cluster.resources.length} recursos</div>
                          <div>{cluster.buckets.length} grupos</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {(cluster.project?.tags ?? []).slice(0, 2).map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-300">
                          {isExpanded ? 'expandido' : 'colapsado'}
                          <ChevronRight className={cn('size-3.5 transition-transform', isExpanded ? 'rotate-90' : '')} />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {expandedCluster
                  ? expandedCluster.buckets.map((bucket) => {
                      const position = expandedLayout.bucketPositions[bucket.nodeId]
                      if (!position) return null

                      const Icon = resourceTypeIcons[bucket.type]
                      const isActive = activeBucket?.key === bucket.key
                      const bucketMatch = normalizedHoveredTech
                        ? bucket.resources.some(matchesTech)
                        : false

                      return (
                        <div
                          key={bucket.nodeId}
                          role="button"
                          tabIndex={0}
                          aria-label={`Abrir grupo ${resourceTypeLabels[bucket.type]}`}
                          className={cn(
                            'absolute rounded-[26px] border bg-white/[0.05] p-4 backdrop-blur-sm transition-all duration-200',
                            normalizedHoveredTech
                              ? bucketMatch
                                ? 'border-white/20 opacity-100'
                                : 'border-white/8 opacity-35'
                              : activeBucket && !isActive
                                ? 'border-white/8 opacity-58'
                                : 'border-white/12 opacity-100',
                            isActive
                              ? '-translate-y-1 border-white/26 bg-white/[0.08] shadow-[0_22px_70px_rgba(255,255,255,0.08)]'
                              : 'hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.07]'
                          )}
                          onMouseEnter={() => setHoveredNodeId(bucket.nodeId)}
                          onMouseLeave={() => setHoveredNodeId((current) => (current === bucket.nodeId ? null : current))}
                          onClick={() => {
                            focusBucket(bucket.key)
                            centerNode(bucket.nodeId)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              focusBucket(bucket.key)
                              centerNode(bucket.nodeId)
                            }
                          }}
                          style={{
                            left: position.x,
                            top: position.y,
                            width: BUCKET_NODE_WIDTH,
                            minHeight: BUCKET_NODE_HEIGHT,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className={cn('inline-flex size-10 items-center justify-center rounded-2xl border', resourceTypeColors[bucket.type])}>
                              <Icon className="size-4" />
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-400">
                              {bucket.resources.length}
                            </div>
                          </div>

                          <div className="mt-3 space-y-1">
                            <h4 className="text-[15px] font-medium leading-snug tracking-tight text-white">
                              {resourceTypeLabels[bucket.type]}
                            </h4>
                            <p className="text-[12px] leading-[1.45] text-zinc-400">
                              {bucket.resources.length} recursos
                              {bucket.technologies.length ? ` · ${bucket.technologies.slice(0, 2).join(' · ')}` : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  : null}

                {activeBucket && activeClusterNodeId
                  ? expandedLayout.visibleResources.map((resource) => {
                      const nodeId = `resource:${resource.id}`
                      const position = expandedLayout.resourcePositions[nodeId]
                      if (!position) return null
                      const resourceTech = getResourceTech(resource)
                      const techMatch = normalizedHoveredTech ? matchesTech(resource) : false
                      const isActive = activeResourceId === resource.id
                      const Icon = resourceTypeIcons[resource.type]

                      return (
                        <div
                          key={nodeId}
                          className={cn(
                            'absolute rounded-[24px] border bg-white/[0.05] p-4 backdrop-blur-sm transition-all duration-200',
                            normalizedHoveredTech
                              ? techMatch
                                ? 'border-white/22 opacity-100'
                                : 'border-white/8 opacity-32'
                              : activeResourceId && !isActive
                                ? 'border-white/8 opacity-56'
                                : 'border-white/12 opacity-100',
                            isActive
                              ? '-translate-y-1 border-white/28 bg-white/[0.08] shadow-[0_22px_70px_rgba(255,255,255,0.08)]'
                              : 'hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.07]'
                          )}
                          onMouseEnter={() => setHoveredNodeId(nodeId)}
                          onMouseLeave={() => setHoveredNodeId((current) => (current === nodeId ? null : current))}
                          onClick={() => {
                            focusResource(resource.id, activeBucket.key, activeClusterNodeId)
                            centerNode(nodeId)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              focusResource(resource.id, activeBucket.key, activeClusterNodeId)
                              centerNode(nodeId)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Abrir recurso ${resource.title}`}
                          style={{
                            left: position.x,
                            top: position.y,
                            width: RESOURCE_NODE_WIDTH,
                            minHeight: RESOURCE_NODE_HEIGHT,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className={cn('inline-flex size-9 items-center justify-center rounded-2xl border', resourceTypeColors[resource.type])}>
                              <Icon className="size-4" />
                            </div>
                            <Badge variant="outline" className={cn('border text-[10px]', resourceStatusColors[resource.status])}>
                              {resourceStatusLabels[resource.status]}
                            </Badge>
                          </div>

                          <div className="mt-3 space-y-1">
                            <h4 className="line-clamp-2 break-words text-[15px] font-medium leading-snug tracking-tight text-white">
                              {resource.title}
                            </h4>
                            <p className="line-clamp-2 break-words text-[12px] leading-[1.45] text-zinc-400">
                              {resource.description || 'Sin descripcion adicional'}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                            {resourceTech ? (
                              <button
                                type="button"
                                className={cn(
                                  'rounded-full border px-2 py-1 text-[10px] transition-all duration-150',
                                  getTechBadgeClass(resourceTech, techMatch)
                                )}
                                onMouseEnter={(event) => {
                                  event.stopPropagation()
                                  setHoveredTech(resourceTech)
                                }}
                                onMouseLeave={(event) => {
                                  event.stopPropagation()
                                  setHoveredTech((current) => (current === resourceTech ? null : current))
                                }}
                                onFocus={() => setHoveredTech(resourceTech)}
                                onBlur={() => setHoveredTech((current) => (current === resourceTech ? null : current))}
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setHoveredTech(resourceTech)
                                }}
                              >
                                {resourceTech}
                              </button>
                            ) : null}
                            <span>{formatDateTime(resource.timestamp)}</span>
                          </div>
                        </div>
                      )
                    })
                  : null}

                {activeBucket && expandedLayout.overflowPosition ? (
                  <button
                    type="button"
                    className="absolute rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] p-5 text-left transition hover:border-white/18 hover:bg-white/[0.05]"
                    style={{
                      left: expandedLayout.overflowPosition.x,
                      top: expandedLayout.overflowPosition.y,
                      width: RESOURCE_NODE_WIDTH,
                      minHeight: RESOURCE_NODE_HEIGHT,
                    }}
                    onClick={() => {
                      setActiveResourceId(null)
                      centerNode(activeBucket.nodeId)
                    }}
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Mas recursos</div>
                    <div className="mt-3 text-3xl font-medium tracking-tight text-white">
                      +{activeBucket.resources.length - MAX_VISIBLE_RESOURCE_NODES}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      El resto vive en el inspector lateral para evitar que el lienzo se vuelva inmanejable.
                    </p>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">proyectos colapsados por defecto</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">arrastra proyectos para reorganizar</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">los grupos se abren por tipo</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">el detalle vive en el inspector</span>
          </div>

          {technologyLabels.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Tecnologias</span>
              {technologyLabels.map((tech) => {
                const isHighlighted = normalizedHoveredTech === normalizeTechKey(tech)
                return (
                  <button
                    key={tech}
                    type="button"
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-all duration-150',
                      getTechBadgeClass(tech, isHighlighted)
                    )}
                    onMouseEnter={() => setHoveredTech(tech)}
                    onMouseLeave={() => setHoveredTech((current) => (current === tech ? null : current))}
                    onFocus={() => setHoveredTech(tech)}
                    onBlur={() => setHoveredTech((current) => (current === tech ? null : current))}
                    onClick={() => setHoveredTech((current) => (current === tech ? null : tech))}
                  >
                    {tech}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <aside className="overflow-hidden rounded-[28px] border border-white/10 bg-[#09090c] shadow-2xl shadow-black/30 xl:sticky xl:top-4 xl:h-[min(80vh,1080px)]">
          <ScrollArea className="h-full">
            <CanvasInspector
              cluster={expandedCluster}
              bucket={activeBucket}
              resource={activeResource}
              onSelectBucket={(bucketKey) => focusBucket(bucketKey)}
              onSelectResource={(resourceId, bucketKey) =>
                expandedCluster ? focusResource(resourceId, bucketKey, expandedCluster.nodeId) : undefined
              }
            />
          </ScrollArea>
        </aside>
      </div>
    </div>
  )
}
