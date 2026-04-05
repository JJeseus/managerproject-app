'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Copy, ExternalLink, FileText, Layers3, PencilLine, Search } from 'lucide-react'
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
import { QuickCaptureDialog } from '@/components/capture/quick-capture-dialog'
import { CodePreview } from '@/components/resources/code-preview'
import { ResourcesNetworkMap } from '@/components/resources/resources-network-map'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Project, type Resource, type ResourceGraphEdge, type ResourceStatus, type ResourceType } from '@/lib/data'
import { formatDateTime } from '@/lib/date'

interface ResourcesViewProps {
  resources: Resource[]
  projects: Project[]
  graphEdges: ResourceGraphEdge[]
}

const resourceTypeLabels: Record<ResourceType, string> = {
  code: 'Código',
  document: 'Documento',
  spreadsheet: 'Hoja de cálculo',
  dataset: 'Datos',
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

const resourceTypeColors: Record<ResourceType, string> = {
  code: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  document: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  spreadsheet: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  dataset: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  link: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  image: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const resourceStatusColors: Record<ResourceStatus, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  ready: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  applied: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  archived: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
}

export function ResourcesView({ resources, projects, graphEdges }: ResourcesViewProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | 'all'>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const projectsById = useMemo(
    () => projects.reduce<Record<string, Project>>((acc, project) => {
      acc[project.id] = project
      return acc
    }, {}),
    [projects]
  )

  const filteredResources = resources.filter((resource) => {
    const haystack = [
      resource.title,
      resource.description,
      resource.content,
      resource.sourceUrl,
      resource.format,
      ...(resource.tags ?? []),
    ]
      .join(' ')
      .toLowerCase()

    const matchesSearch = haystack.includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || resource.type === typeFilter
    const matchesStatus = statusFilter === 'all' || resource.status === statusFilter
    const matchesProject = projectFilter === 'all' || resource.projectId === projectFilter

    return matchesSearch && matchesType && matchesStatus && matchesProject
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers3 className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Recursos</h1>
          </div>
          <p className="text-muted-foreground">
            Guarda PDFs, Excel, datos, enlaces y snippets relacionados con tus proyectos.
          </p>
        </div>
        <QuickCaptureDialog buttonLabel="Nuevo recurso" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por título, descripción, contenido o etiquetas..."
                className="pl-8"
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as ResourceType | 'all')}
            >
              <SelectTrigger>
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
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ResourceStatus | 'all')}
            >
              <SelectTrigger>
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

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Mapa</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-0">
          <ResourcesNetworkMap
            resources={filteredResources}
            projects={projects}
            edges={graphEdges.filter((edge) => {
              if (edge.sourceType === 'resource' && !filteredResources.some((resource) => resource.id === edge.sourceId)) {
                return false
              }
              if (edge.targetType === 'resource' && !filteredResources.some((resource) => resource.id === edge.targetId)) {
                return false
              }
              return true
            })}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          {filteredResources.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-3 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay recursos con esos filtros</p>
                <div className="mt-4">
                  <QuickCaptureDialog buttonLabel="Crear recurso" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredResources.map((resource) => {
                const project = resource.projectId ? projectsById[resource.projectId] : null
                const hasLink = Boolean(resource.sourceUrl)
                const hasContent = Boolean(resource.content)

                return (
                  <Card key={resource.id} className="overflow-hidden">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold">{resource.title}</CardTitle>
                          <CardDescription>{resource.description || 'Sin descripción'}</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={`text-xs ${resourceTypeColors[resource.type]}`}>
                            {resourceTypeLabels[resource.type]}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${resourceStatusColors[resource.status]}`}>
                            {resourceStatusLabels[resource.status]}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {resource.type === 'code' && resource.language && (
                          <Badge variant="secondary">{resource.language}</Badge>
                        )}
                        {resource.type !== 'code' && resource.format && (
                          <Badge variant="secondary">{resource.format}</Badge>
                        )}
                        {project && (
                          <Badge variant="outline">
                            <Link href={`/projects/${project.id}`} className="hover:underline">
                              {project.name}
                            </Link>
                          </Badge>
                        )}
                        {resource.taskId && <Badge variant="outline">Tarea {resource.taskId}</Badge>}
                        <span>{formatDateTime(resource.timestamp)}</span>
                      </div>

                      {hasLink && resource.type !== 'code' && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                          <span className="truncate text-muted-foreground">{resource.sourceUrl}</span>
                          <Button variant="ghost" size="icon" asChild className="size-8 shrink-0">
                            <a href={resource.sourceUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="size-4" />
                              <span className="sr-only">Abrir enlace</span>
                            </a>
                          </Button>
                        </div>
                      )}

                      {hasContent && (
                        <div className="rounded-lg border bg-card p-3">
                          <CodePreview
                            code={resource.content}
                            language={resource.type === 'code' ? resource.language : resource.format}
                            className="max-h-64"
                          />
                        </div>
                      )}

                      {resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {resource.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <QuickCaptureDialog
                          buttonLabel="Editar"
                          resource={resource}
                          triggerVariant="outline"
                          triggerSize="sm"
                          triggerIcon={<PencilLine className="size-4" />}
                        />
                        {hasContent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await navigator.clipboard.writeText(resource.content)
                              toast.success('Contenido copiado')
                            }}
                          >
                            <Copy className="mr-2 size-4" />
                            Copiar contenido
                          </Button>
                        )}
                        {hasLink && resource.type !== 'code' && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={resource.sourceUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 size-4" />
                              Abrir recurso
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
