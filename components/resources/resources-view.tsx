'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Layers3, List, Map as MapIcon, Search, SlidersHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QuickCaptureDialog } from '@/components/capture/quick-capture-dialog'
import { ResourceInspector } from '@/components/resources/resource-inspector'
import { ResourcesNetworkMap } from '@/components/resources/resources-network-map'
import { executeMutation } from '@/lib/client/mutations'
import { formatDateTime } from '@/lib/date'
import {
  type Project,
  type Resource,
  type ResourceGraphEdge,
  type ResourceStatus,
  type ResourceType,
} from '@/lib/data'
import {
  buildResourcesViewSearchParams,
  filterAndSortResources,
  parseResourcesViewState,
  type ResourceListSort,
  type ResourcesViewState,
} from '@/lib/resources/resources-view-state'
import { resourceStatusLabels, resourceTypeLabels } from '@/lib/resources/resource-presentation'
import { cn } from '@/lib/utils'

interface ResourcesViewProps {
  resources: Resource[]
  projects: Project[]
  graphEdges: ResourceGraphEdge[]
  initialViewState: ResourcesViewState
}

const resourceTypeColors: Record<ResourceType, string> = {
  code: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300',
  document: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300',
  spreadsheet: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-300',
  dataset: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 dark:text-fuchsia-300',
  link: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-300',
  image: 'bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-300',
  other: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-300',
}

const resourceStatusColors: Record<ResourceStatus, string> = {
  draft: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-300',
  ready: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300',
  applied: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300',
  archived: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300',
}

const sortLabels: Record<ResourceListSort, string> = {
  recent: 'Más recientes',
  title: 'Título',
  status: 'Estado',
  type: 'Tipo',
}

function replaceResource(resources: Resource[], nextResource: Resource) {
  return resources.map((resource) => (resource.id === nextResource.id ? nextResource : resource))
}

export function ResourcesView({
  resources,
  projects,
  graphEdges,
  initialViewState,
}: ResourcesViewProps) {
  const [resourceItems, setResourceItems] = useState(resources)
  const [viewState, setViewState] = useState(initialViewState)
  const deferredQuery = useDeferredValue(viewState.q)

  useEffect(() => {
    setResourceItems(resources)
  }, [resources])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = buildResourcesViewSearchParams(viewState)
    const query = params.toString()
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState(window.history.state, '', nextUrl)
  }, [viewState])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handlePopState = () => {
      setViewState(parseResourcesViewState(new URLSearchParams(window.location.search)))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [initialViewState])

  const projectsById = useMemo(
    () =>
      projects.reduce<Record<string, Project>>((acc, project) => {
        acc[project.id] = project
        return acc
      }, {}),
    [projects]
  )

  const projectNamesById = useMemo(
    () =>
      Object.fromEntries(projects.map((project) => [project.id, project.name])),
    [projects]
  )

  const resourcesById = useMemo(
    () => new Map(resourceItems.map((resource) => [resource.id, resource])),
    [resourceItems]
  )

  useEffect(() => {
    if (viewState.resource && !resourcesById.has(viewState.resource)) {
      setViewState((current) => ({ ...current, resource: '' }))
    }
  }, [resourcesById, viewState.resource])

  const effectiveViewState = useMemo(
    () => ({
      ...viewState,
      q: deferredQuery,
    }),
    [deferredQuery, viewState]
  )

  const filteredResources = useMemo(
    () =>
      filterAndSortResources(resourceItems, effectiveViewState, {
        projectNamesById,
      }),
    [effectiveViewState, projectNamesById, resourceItems]
  )

  const selectedResource = viewState.resource ? resourcesById.get(viewState.resource) ?? null : null
  const selectedProject = selectedResource?.projectId
    ? projectsById[selectedResource.projectId] ?? null
    : null

  const updateViewState = (patch: Partial<ResourcesViewState>) => {
    setViewState((current) => ({
      ...current,
      ...patch,
    }))
  }

  const clearFilters = () => {
    updateViewState({
      q: '',
      type: 'all',
      status: 'all',
      project: 'all',
      sort: 'recent',
    })
  }

  const activeFilters = [
    viewState.q
      ? {
          key: 'q',
          label: `Buscar: ${viewState.q}`,
          onRemove: () => updateViewState({ q: '' }),
        }
      : null,
    viewState.type !== 'all'
      ? {
          key: 'type',
          label: resourceTypeLabels[viewState.type],
          onRemove: () => updateViewState({ type: 'all' }),
        }
      : null,
    viewState.status !== 'all'
      ? {
          key: 'status',
          label: resourceStatusLabels[viewState.status],
          onRemove: () => updateViewState({ status: 'all' }),
        }
      : null,
    viewState.project !== 'all'
      ? {
          key: 'project',
          label: projectsById[viewState.project]?.name ?? 'Proyecto',
          onRemove: () => updateViewState({ project: 'all' }),
        }
      : null,
    viewState.sort !== 'recent'
      ? {
          key: 'sort',
          label: `Orden: ${sortLabels[viewState.sort]}`,
          onRemove: () => updateViewState({ sort: 'recent' }),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string
    label: string
    onRemove: () => void
  }>

  const updateResourceStatus = async (resourceId: string, status: ResourceStatus) => {
    const currentResource = resourcesById.get(resourceId)

    if (!currentResource || currentResource.status === status) {
      return
    }

    setResourceItems((current) =>
      current.map((resource) =>
        resource.id === resourceId
          ? {
              ...resource,
              status,
            }
          : resource
      )
    )

    const result = await executeMutation<'updateResource'>({
      action: 'updateResource',
      payload: {
        resourceId,
        patch: {
          status,
        },
      },
    })

    if (!result.ok) {
      setResourceItems((current) =>
        current.map((resource) =>
          resource.id === resourceId
            ? {
                ...resource,
                status: currentResource.status,
              }
            : resource
        )
      )
      toast.error(result.message)
      return
    }

    setResourceItems((current) => replaceResource(current, result.data.resource))
    toast.success('Estado actualizado')
  }

  const inspector = (
    <Card className="overflow-hidden border-border/70">
      <ResourceInspector
        resource={selectedResource}
        project={selectedProject}
        projectHref={selectedProject ? `/projects/${selectedProject.id}` : undefined}
        onTagSelect={(tag) =>
          updateViewState({
            view: 'list',
            q: tag,
          })
        }
        onProjectSelect={(projectId) =>
          updateViewState({
            view: 'list',
            project: projectId,
            resource: '',
          })
        }
        onResourceSelect={(resourceId) =>
          updateViewState({
            view: 'list',
            q: '',
            type: 'all',
            status: 'all',
            project: 'all',
            resource: resourceId,
          })
        }
        onStatusChange={updateResourceStatus}
        onToggleArchive={(resource) =>
          updateResourceStatus(
            resource.id,
            resource.status === 'archived' ? 'ready' : 'archived'
          )
        }
      />
    </Card>
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers3 className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Recursos</h1>
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Un workspace para encontrar, leer y reutilizar snippets, documentos, datasets y enlaces
            relacionados con tus proyectos.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{filteredResources.length} visibles</Badge>
            <Badge variant="outline">{resourceItems.length} totales</Badge>
            <Badge variant="outline">{projects.length} proyectos</Badge>
          </div>
        </div>

        <QuickCaptureDialog buttonLabel="Nuevo recurso" />
      </div>

      <Card className="border-border/70">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                aria-label="Buscar recursos"
                value={viewState.q}
                onChange={(event) => updateViewState({ q: event.target.value })}
                placeholder="Buscar por título, descripción, contenido, proyecto o etiquetas..."
                className="pl-8"
              />
            </div>

            <Select
              value={viewState.type}
              onValueChange={(value) => updateViewState({ type: value as ResourceType | 'all' })}
            >
              <SelectTrigger aria-label="Filtrar por tipo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(resourceTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={viewState.status}
              onValueChange={(value) =>
                updateViewState({ status: value as ResourceStatus | 'all' })
              }
            >
              <SelectTrigger aria-label="Filtrar por estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(resourceStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={viewState.project} onValueChange={(value) => updateViewState({ project: value })}>
              <SelectTrigger aria-label="Filtrar por proyecto">
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={viewState.sort}
              onValueChange={(value) => updateViewState({ sort: value as ResourceListSort })}
            >
              <SelectTrigger aria-label="Ordenar recursos">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sortLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <SlidersHorizontal className="size-3.5" />
                Filtros activos
              </div>
              {activeFilters.length > 0 ? (
                activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1.5 text-xs transition hover:border-border hover:bg-muted/40"
                    onClick={filter.onRemove}
                  >
                    {filter.label}
                    <X className="size-3.5" />
                  </button>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Sin filtros avanzados; estás viendo el conjunto completo.
                </span>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={activeFilters.length === 0}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border/70 bg-muted/40 p-1">
          <Button
            type="button"
            variant={viewState.view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => updateViewState({ view: 'list' })}
            aria-pressed={viewState.view === 'list'}
          >
            <List className="mr-2 size-4" />
            Lista
          </Button>
          <Button
            type="button"
            variant={viewState.view === 'map' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => updateViewState({ view: 'map' })}
            aria-pressed={viewState.view === 'map'}
          >
            <MapIcon className="mr-2 size-4" />
            Mapa
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredResources.length === resourceItems.length
            ? `Mostrando los ${resourceItems.length} recursos disponibles.`
            : `Mostrando ${filteredResources.length} de ${resourceItems.length} recursos.`}
        </p>
      </div>

      {viewState.view === 'list' ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lista operativa</CardTitle>
                <CardDescription>
                  Selecciona un recurso para abrir el inspector y trabajar sin salir de la vista.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredResources.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No hay recursos con esos filtros.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="xl:h-[calc(100vh-24rem)]">
                    <div className="space-y-3 pr-3">
                      {filteredResources.map((resource) => {
                        const project = resource.projectId ? projectsById[resource.projectId] : null
                        const isSelected = viewState.resource === resource.id

                        return (
                          <button
                            key={resource.id}
                            type="button"
                            onClick={() => updateViewState({ resource: resource.id })}
                            aria-pressed={isSelected}
                            className={cn(
                              'w-full rounded-2xl border p-4 text-left transition',
                              isSelected
                                ? 'border-primary/40 bg-primary/5 shadow-sm'
                                : 'border-border/70 bg-card hover:border-border hover:bg-muted/20'
                            )}
                            style={{ contentVisibility: 'auto' }}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="text-base font-semibold tracking-tight">
                                  {resource.title}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {resource.description || 'Sin descripción adicional.'}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant="outline"
                                  className={resourceTypeColors[resource.type]}
                                >
                                  {resourceTypeLabels[resource.type]}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={resourceStatusColors[resource.status]}
                                >
                                  {resourceStatusLabels[resource.status]}
                                </Badge>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {project ? <Badge variant="outline">{project.name}</Badge> : null}
                              {resource.taskId ? <Badge variant="outline">Tarea {resource.taskId}</Badge> : null}
                              {resource.language ? <Badge variant="secondary">{resource.language}</Badge> : null}
                              {resource.format && !resource.language ? (
                                <Badge variant="secondary">{resource.format}</Badge>
                              ) : null}
                              <span>{formatDateTime(resource.timestamp)}</span>
                            </div>

                            {(resource.tags.length > 0 || resource.sourceUrl) ? (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {resource.tags.slice(0, 4).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {resource.sourceUrl ? (
                                  <span className="truncate text-[11px] text-muted-foreground">
                                    {resource.sourceUrl}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <div className="hidden xl:block xl:sticky xl:top-4 xl:h-fit">
              {inspector}
            </div>
          </div>

          <div className="xl:hidden">{inspector}</div>
        </>
      ) : (
        <ResourcesNetworkMap
          resources={filteredResources}
          projects={projects}
          edges={graphEdges.filter((edge) => {
            if (
              edge.sourceType === 'resource'
              && !filteredResources.some((resource) => resource.id === edge.sourceId)
            ) {
              return false
            }
            if (
              edge.targetType === 'resource'
              && !filteredResources.some((resource) => resource.id === edge.targetId)
            ) {
              return false
            }
            return true
          })}
        />
      )}
    </div>
  )
}
