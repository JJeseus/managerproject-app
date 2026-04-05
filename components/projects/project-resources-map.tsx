'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Code2,
  Crosshair,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe,
  GripHorizontal,
  HardDriveDownload,
  Package,
  RotateCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CodePreview } from '@/components/resources/code-preview'
import { ResourceSourcePreview } from '@/components/resources/resource-source-preview'
import { type Project, type Resource, type ResourceStatus, type ResourceType } from '@/lib/data'
import { formatDateTime } from '@/lib/date'
import { getGoogleDrivePreview } from '@/lib/google-drive'
import { cn } from '@/lib/utils'

interface ProjectResourcesMapProps {
  project: Project
  resources: Resource[]
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

const PROJECT_NODE = {
  x: 88,
  y: 164,
  width: 300,
}

const RESOURCE_NODE_WIDTH = 248
const GRID_GAP_X = 104
const GRID_GAP_Y = 92
const GRID_COLUMNS = 2
const techAccentColors: Record<string, string> = {
  html: 'border-orange-400/35 bg-orange-400/12 text-orange-100 shadow-[0_0_24px_rgba(251,146,60,0.18)]',
  appsheet: 'border-emerald-400/35 bg-emerald-400/12 text-emerald-100 shadow-[0_0_24px_rgba(74,222,128,0.18)]',
  r: 'border-sky-400/35 bg-sky-400/12 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.18)]',
  css: 'border-cyan-400/35 bg-cyan-400/12 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]',
  javascript: 'border-amber-400/35 bg-amber-400/12 text-amber-100 shadow-[0_0_24px_rgba(250,204,21,0.18)]',
  typescript: 'border-blue-400/35 bg-blue-400/12 text-blue-100 shadow-[0_0_24px_rgba(96,165,250,0.18)]',
  sql: 'border-violet-400/35 bg-violet-400/12 text-violet-100 shadow-[0_0_24px_rgba(167,139,250,0.18)]',
}

function estimateLineCount(text: string, charsPerLine: number) {
  if (!text.trim()) return 0
  return text
    .split('\n')
    .reduce((total, segment) => total + Math.max(1, Math.ceil(segment.trim().length / charsPerLine)), 0)
}

function getProjectNodeHeight(project: Project) {
  const titleLines = estimateLineCount(project.name, 15)
  const descriptionLines = estimateLineCount(project.description || '', 28)
  return Math.max(152, 96 + titleLines * 24 + descriptionLines * 16)
}

function getResourceNodeHeight(resource: Resource) {
  const titleLines = estimateLineCount(resource.title, 20)
  const descriptionLines = estimateLineCount(resource.description || 'Sin descripcion adicional', 28)
  const metadataCount =
    Number(Boolean(resource.taskId)) +
    Number(Boolean(resource.language)) +
    Number(Boolean(resource.format && !resource.language)) +
    1
  const metadataLines = Math.max(1, Math.ceil(metadataCount / 2))
  const tagLines = Math.max(1, Math.ceil(Math.min(resource.tags.length, 2) / 2))

  return Math.max(212, 130 + titleLines * 18 + descriptionLines * 12 + metadataLines * 18 + tagLines * 16)
}

function normalizeTechKey(value: string) {
  return value.trim().toLowerCase()
}

function getResourceTech(resource: Resource) {
  return resource.language || resource.format || null
}

function getTechBadgeClass(tech: string, isHighlighted: boolean) {
  const accent = techAccentColors[normalizeTechKey(tech)] || 'border-white/12 bg-white/[0.06] text-zinc-200'
  return isHighlighted
    ? accent
    : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]'
}

function createInitialPositions(
  resources: Resource[],
  resourceHeights: Record<string, number>
) {
  const positions: Record<string, Position> = {
    project: { x: PROJECT_NODE.x, y: PROJECT_NODE.y },
  }

  const rowHeights: number[] = []
  resources.forEach((resource, index) => {
    const column = index % GRID_COLUMNS
    const row = Math.floor(index / GRID_COLUMNS)
    if (!rowHeights[row]) {
      const rowResources = resources.slice(row * GRID_COLUMNS, row * GRID_COLUMNS + GRID_COLUMNS)
      rowHeights[row] = Math.max(...rowResources.map((item) => resourceHeights[item.id] ?? 212))
    }

    const previousRowsHeight = rowHeights
      .slice(0, row)
      .reduce((total, height) => total + height + GRID_GAP_Y, 0)

    positions[resource.id] = {
      x:
        PROJECT_NODE.x +
        PROJECT_NODE.width +
        136 +
        column * (RESOURCE_NODE_WIDTH + GRID_GAP_X),
      y: 76 + previousRowsHeight,
    }
  })

  return positions
}

function buildCanvasBounds(
  positions: Record<string, Position>,
  resources: Resource[],
  projectHeight: number,
  resourceHeights: Record<string, number>
) {
  let width = PROJECT_NODE.x + PROJECT_NODE.width + 620
  let height = 660

  const projectPosition = positions.project
  width = Math.max(width, projectPosition.x + PROJECT_NODE.width + 96)
  height = Math.max(height, projectPosition.y + projectHeight + 96)

  for (const resource of resources) {
    const node = positions[resource.id]
    if (!node) continue
    width = Math.max(width, node.x + RESOURCE_NODE_WIDTH + 96)
    height = Math.max(height, node.y + (resourceHeights[resource.id] ?? 212) + 96)
  }

  return { width, height }
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
      aria-label="Mover nodo"
    >
      <GripHorizontal className="size-3" />
      mover
    </button>
  )
}

function edgePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const controlOffset = Math.max(84, Math.abs(endX - startX) * 0.35)
  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY} ${
    endX - controlOffset
  } ${endY} ${endX} ${endY}`
}

export function ProjectResourcesMap({
  project,
  resources,
}: ProjectResourcesMapProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const projectHeight = getProjectNodeHeight(project)
  const resourceHeights = Object.fromEntries(
    resources.map((resource) => [resource.id, getResourceNodeHeight(resource)])
  )
  const [positions, setPositions] = useState<Record<string, Position>>(() =>
    createInitialPositions(resources, resourceHeights)
  )
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredTech, setHoveredTech] = useState<string | null>(null)

  useEffect(() => {
    if (!dragState) return

    const handlePointerMove = (event: PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const localX = event.clientX - rect.left
      const localY = event.clientY - rect.top
      const nodeWidth = dragState.id === 'project' ? PROJECT_NODE.width : RESOURCE_NODE_WIDTH
      const nodeHeight =
        dragState.id === 'project' ? projectHeight : (resourceHeights[dragState.id] ?? 212)
      const bounds = buildCanvasBounds(positions, resources, projectHeight, resourceHeights)

      setPositions((prev) => ({
        ...prev,
        [dragState.id]: {
          x: Math.min(Math.max(localX - dragState.offsetX, 32), bounds.width - nodeWidth - 32),
          y: Math.min(Math.max(localY - dragState.offsetY, 32), bounds.height - nodeHeight - 32),
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
  }, [dragState, positions, projectHeight, resourceHeights, resources])

  const bounds = buildCanvasBounds(positions, resources, projectHeight, resourceHeights)
  const technologyLabels = Array.from(
    new Set(
      resources
        .map((resource) => getResourceTech(resource))
        .filter((value): value is string => Boolean(value))
    )
  ).sort((left, right) => left.localeCompare(right))

  const beginDrag =
    (id: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
      const canvas = canvasRef.current
      const node = positions[id]
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

  const highlightedNodeId = hoveredNodeId || activeNodeId
  const normalizedHoveredTech = hoveredTech ? normalizeTechKey(hoveredTech) : null
  const resetLayout = () => setPositions(createInitialPositions(resources, resourceHeights))

  const centerNode = (id: string) => {
    const viewport = viewportRef.current
    const node = positions[id]
    if (!viewport || !node) return

    const nodeWidth = id === 'project' ? PROJECT_NODE.width : RESOURCE_NODE_WIDTH
    const nodeHeight = id === 'project' ? projectHeight : (resourceHeights[id] ?? 212)

    viewport.scrollTo({
      left: Math.max(0, node.x - viewport.clientWidth / 2 + nodeWidth / 2),
      top: Math.max(0, node.y - viewport.clientHeight / 2 + nodeHeight / 2),
      behavior: 'smooth',
    })
  }

  const openResource = (resource: Resource) => {
    setActiveNodeId(resource.id)
    setSelectedResource(resource)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Mapa de recursos</h3>
          <p className="text-sm text-muted-foreground">
            Una vista conectada de los activos del proyecto: documentos, snippets, enlaces y datasets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
            onClick={() => {
              setActiveNodeId(null)
              setHoveredNodeId(null)
            }}
          >
            Limpiar foco
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
            onClick={() => centerNode(activeNodeId || 'project')}
          >
            <Crosshair className="size-3.5" />
            Centrar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#09090c] shadow-2xl shadow-black/30">
        <div
          ref={viewportRef}
          className="h-[min(76vh,900px)] overflow-auto"
        >
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
              {resources.map((resource) => {
                const projectNode = positions.project
                const resourceNode = positions[resource.id]
                const resourceTech = getResourceTech(resource)
                const techMatch = normalizedHoveredTech
                  ? normalizeTechKey(resourceTech || '') === normalizedHoveredTech
                  : false
                if (!resourceNode) return null

                return (
                  <path
                    key={`edge-${resource.id}`}
                    d={edgePath(
                      projectNode.x + PROJECT_NODE.width,
                      projectNode.y + projectHeight / 2,
                      resourceNode.x,
                      resourceNode.y + (resourceHeights[resource.id] ?? 212) / 2
                    )}
                    fill="none"
                    stroke={
                      normalizedHoveredTech
                        ? techMatch
                          ? 'rgba(255,255,255,0.82)'
                          : 'rgba(255,255,255,0.12)'
                        : !highlightedNodeId || highlightedNodeId === 'project' || highlightedNodeId === resource.id
                        ? 'rgba(255,255,255,0.78)'
                        : 'rgba(255,255,255,0.18)'
                    }
                    strokeWidth={
                      normalizedHoveredTech
                        ? techMatch
                          ? '2.2'
                          : '1'
                        : !highlightedNodeId || highlightedNodeId === resource.id
                          ? '2.1'
                          : '1.2'
                    }
                    strokeLinecap="round"
                    strokeDasharray={resource.type === 'link' ? '6 6' : undefined}
                    className="transition-all duration-200"
                  />
                )
              })}
            </svg>

            <div
              className={cn(
                'absolute rounded-[30px] border bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-200',
                normalizedHoveredTech || (highlightedNodeId && highlightedNodeId !== 'project')
                  ? 'border-white/8 opacity-70'
                  : 'border-white/15 opacity-100',
                activeNodeId === 'project' || hoveredNodeId === 'project'
                  ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_24px_80px_rgba(255,255,255,0.08)]'
                  : 'shadow-none'
              )}
              onMouseEnter={() => setHoveredNodeId('project')}
              onMouseLeave={() => setHoveredNodeId((current) => (current === 'project' ? null : current))}
              onClick={() => {
                setActiveNodeId('project')
                centerNode('project')
              }}
              style={{
                left: positions.project.x,
                top: positions.project.y,
                width: PROJECT_NODE.width,
                minHeight: projectHeight,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-400">
                    <FolderKanban className="size-3.5" />
                    Proyecto
                  </div>
                  <h4 className="max-w-[14rem] break-words text-[1.55rem] font-medium leading-[1.02] tracking-tight text-white">
                    {project.name}
                  </h4>
                  <p className="max-w-[15rem] break-words text-[12px] leading-[1.4] text-zinc-400">
                    {project.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3 text-right text-xs text-zinc-500">
                  <GraphHandle onPointerDown={beginDrag('project')} />
                  <div>{resources.length} recursos</div>
                  <div>{project.tags.length} etiquetas</div>
                </div>
              </div>
            </div>

            {resources.length === 0 ? (
              <div className="absolute left-[460px] top-[156px] rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] px-8 py-12 text-center">
                <p className="text-sm text-zinc-300">Este proyecto aun no tiene recursos asociados.</p>
              </div>
            ) : (
              resources.map((resource) => {
                const node = positions[resource.id]
                if (!node) return null
                const Icon = resourceTypeIcons[resource.type]
                const resourceTech = getResourceTech(resource)
                const techMatch = normalizedHoveredTech
                  ? normalizeTechKey(resourceTech || '') === normalizedHoveredTech
                  : false

                return (
                  <div
                    key={resource.id}
                    className="absolute transition-transform duration-200"
                    style={{
                      left: node.x,
                      top: node.y,
                      width: RESOURCE_NODE_WIDTH,
                      minHeight: resourceHeights[resource.id] ?? 212,
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => setHoveredNodeId(resource.id)}
                      onMouseLeave={() => setHoveredNodeId((current) => (current === resource.id ? null : current))}
                      onClick={() => {
                        setActiveNodeId(resource.id)
                        centerNode(resource.id)
                      }}
                      onDoubleClick={() => openResource(resource)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setActiveNodeId(resource.id)
                          centerNode(resource.id)
                        }
                        if (event.key === 'o') {
                          event.preventDefault()
                          openResource(resource)
                        }
                      }}
                      className={cn(
                        'w-full rounded-[26px] border bg-white/[0.05] p-4 text-left backdrop-blur-sm shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                        normalizedHoveredTech
                          ? techMatch
                            ? 'border-white/26 opacity-100'
                            : 'border-white/8 opacity-40 saturate-50'
                          : highlightedNodeId && highlightedNodeId !== resource.id
                          ? 'border-white/8 opacity-55'
                          : 'border-white/12 opacity-100',
                        activeNodeId === resource.id || hoveredNodeId === resource.id || techMatch
                          ? '-translate-y-1 border-white/30 bg-white/[0.08] shadow-[0_24px_70px_rgba(255,255,255,0.08)]'
                          : 'hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={cn(
                          'inline-flex size-10 items-center justify-center rounded-2xl border',
                          resourceTypeColors[resource.type]
                        )}>
                          <Icon className="size-4" />
                        </div>

                        <GraphHandle onPointerDown={beginDrag(resource.id)} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn('border text-[10px]', resourceTypeColors[resource.type])}
                        >
                          {resourceTypeLabels[resource.type]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn('border text-[10px]', resourceStatusColors[resource.status])}
                        >
                          {resourceStatusLabels[resource.status]}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <h4 className="break-words text-[16px] font-medium leading-snug tracking-tight text-white">
                          {resource.title}
                        </h4>
                        <p className="break-words text-[12px] leading-[1.45] text-zinc-400">
                          {resource.description || 'Sin descripcion adicional'}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                        {resource.taskId && (
                          <Badge variant="secondary" className="bg-white/[0.06] text-zinc-300">
                            {resource.taskId}
                          </Badge>
                        )}
                        {resourceTech && (
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
                              setActiveNodeId(resource.id)
                            }}
                            aria-label={`Resaltar recursos de ${resourceTech}`}
                          >
                            {resourceTech}
                          </button>
                        )}
                        <span>{formatDateTime(resource.timestamp)}</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {resource.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            openResource(resource)
                          }}
                        >
                          Abrir
                          <ExternalLink className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">arrastra para mover</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">click para enfocar</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">doble click o Abrir para detalle</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">hover en tecnologia para resaltar</span>
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

      {activeNodeId && (
        <div className="rounded-[24px] border border-white/10 bg-[#0b0b10] px-4 py-3 text-sm shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
          {activeNodeId === 'project' ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Proyecto enfocado</div>
                <div className="font-medium text-zinc-100">{project.name}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                <span>{resources.length} recursos conectados</span>
                <span>{project.tags.length} etiquetas</span>
              </div>
            </div>
          ) : (
            (() => {
              const resource = resources.find((item) => item.id === activeNodeId)
              if (!resource) return null
              return (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Recurso enfocado</div>
                    <div className="font-medium text-zinc-100">{resource.title}</div>
                    <div className="text-xs text-zinc-400">
                      {resource.description || 'Sin descripcion adicional'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('border text-[10px]', resourceTypeColors[resource.type])}
                    >
                      {resourceTypeLabels[resource.type]}
                    </Badge>
                    {getResourceTech(resource) ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'border text-[10px]',
                          getTechBadgeClass(
                            getResourceTech(resource) as string,
                            normalizedHoveredTech === normalizeTechKey(getResourceTech(resource) as string)
                          )
                        )}
                      >
                        {getResourceTech(resource)}
                      </Badge>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
                      onClick={() => openResource(resource)}
                    >
                      Abrir recurso
                    </Button>
                  </div>
                </div>
              )
            })()
          )}
        </div>
      )}

      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-w-3xl">
          {selectedResource && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={cn('border text-[10px]', resourceTypeColors[selectedResource.type])}
                  >
                    {resourceTypeLabels[selectedResource.type]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('border text-[10px]', resourceStatusColors[selectedResource.status])}
                  >
                    {resourceStatusLabels[selectedResource.status]}
                  </Badge>
                </div>
                <DialogTitle>{selectedResource.title}</DialogTitle>
                <DialogDescription>
                  {selectedResource.description || 'Sin descripcion adicional'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {selectedResource.taskId && (
                    <Badge variant="secondary">{selectedResource.taskId}</Badge>
                  )}
                  {selectedResource.language && (
                    <Badge variant="secondary">{selectedResource.language}</Badge>
                  )}
                  {selectedResource.format && !selectedResource.language && (
                    <Badge variant="secondary">{selectedResource.format}</Badge>
                  )}
                  <span>{formatDateTime(selectedResource.timestamp)}</span>
                </div>

                {selectedResource.sourceUrl && selectedResource.type !== 'code' ? (
                  <ResourceSourcePreview sourceUrl={selectedResource.sourceUrl} />
                ) : null}

                {selectedResource.links?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Enlaza con
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.links.map((link) => (
                        <Badge key={link.id} variant="outline" className="gap-1">
                          {link.targetType === 'project'
                            ? `Proyecto: ${link.targetName}`
                            : `Recurso: ${link.targetName}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedResource.backlinks?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Referenciado por
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.backlinks.map((backlink) => (
                        <Badge key={backlink.id} variant="secondary">
                          {backlink.sourceResourceTitle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedResource.unresolvedLinks?.length ? (
                  <div className="space-y-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Menciones no resueltas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.unresolvedLinks.map((label) => (
                        <Badge key={label} variant="outline">
                          [[{label}]]
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedResource.content ? (
                  <CodePreview
                    code={selectedResource.content}
                    language={
                      selectedResource.type === 'code'
                        ? selectedResource.language || selectedResource.format
                        : selectedResource.format
                    }
                    className="max-h-[420px]"
                  />
                ) : (
                  !getGoogleDrivePreview(selectedResource.sourceUrl) ? (
                    <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                      Este recurso no tiene contenido embebido para previsualizar.
                    </div>
                  ) : null
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {selectedResource.sourceUrl ? (
                    <Button variant="outline" asChild>
                      <Link href={selectedResource.sourceUrl} target="_blank" rel="noreferrer">
                        Abrir enlace
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
