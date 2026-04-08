'use client'

import Link from 'next/link'
import { Copy, ExternalLink, FolderKanban, Link2, PencilLine } from 'lucide-react'
import { toast } from 'sonner'
import type { Project, Resource, ResourceStatus } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { QuickCaptureDialog } from '@/components/capture/quick-capture-dialog'
import { ResourceContentPreview } from '@/components/resources/resource-content-preview'
import { resourceStatusLabels, resourceTypeLabels } from '@/lib/resources/resource-presentation'

interface ResourceInspectorProps {
  resource: Resource | null
  project?: Project | null
  projectHref?: string
  emptyTitle?: string
  emptyDescription?: string
  onTagSelect?: (tag: string) => void
  onProjectSelect?: (projectId: string) => void
  onResourceSelect?: (resourceId: string) => void
  onStatusChange?: (resourceId: string, status: ResourceStatus) => Promise<void> | void
  onToggleArchive?: (resource: Resource) => Promise<void> | void
}

export function ResourceInspector({
  resource,
  project = null,
  projectHref,
  emptyTitle = 'Selecciona un recurso',
  emptyDescription = 'Abre un recurso para ver su preview, relaciones y acciones rápidas.',
  onTagSelect,
  onProjectSelect,
  onResourceSelect,
  onStatusChange,
  onToggleArchive,
}: ResourceInspectorProps) {
  if (!resource) {
    return (
      <div className="flex min-h-[320px] flex-col justify-center gap-3 px-5 py-8 text-center sm:text-left">
        <div className="inline-flex w-fit self-center rounded-full border border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:self-start">
          Inspector
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight">{emptyTitle}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
        </div>
      </div>
    )
  }

  const canArchive = Boolean(onToggleArchive)
  const canChangeStatus = Boolean(onStatusChange)

  return (
    <div className="space-y-5 px-5 py-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{resourceTypeLabels[resource.type]}</Badge>
          <Badge variant="secondary">{resourceStatusLabels[resource.status]}</Badge>
          {project ? (
            onProjectSelect ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-border hover:text-foreground"
                onClick={() => onProjectSelect(project.id)}
              >
                <FolderKanban className="size-3.5" />
                {project.name}
              </button>
            ) : (
              <Badge variant="outline" className="gap-1">
                <FolderKanban className="size-3.5" />
                {project.name}
              </Badge>
            )
          ) : null}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">{resource.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {resource.description || 'Sin descripción adicional.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {resource.taskId ? <Badge variant="outline">Tarea {resource.taskId}</Badge> : null}
          {resource.language ? <Badge variant="outline">{resource.language}</Badge> : null}
          {resource.format && !resource.language ? <Badge variant="outline">{resource.format}</Badge> : null}
          <span>{new Date(resource.timestamp).toLocaleString('es-MX')}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <QuickCaptureDialog
          buttonLabel="Editar"
          resource={resource}
          triggerVariant="outline"
          triggerSize="sm"
          triggerIcon={<PencilLine className="size-4" />}
        />

        {resource.content ? (
          <Button
            type="button"
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
        ) : null}

        {resource.sourceUrl ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={resource.sourceUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Abrir fuente
            </Link>
          </Button>
        ) : null}

        {projectHref ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={projectHref}>Abrir proyecto</Link>
          </Button>
        ) : null}
      </div>

      {canChangeStatus || canArchive ? <Separator /> : null}

      {canChangeStatus || canArchive ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Estado operativo</h4>
            <p className="text-xs text-muted-foreground">
              Actualiza el estado sin salir de la vista de trabajo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canChangeStatus ? (
              <div className="w-full min-w-48 sm:max-w-56">
                <Select
                  value={resource.status}
                  onValueChange={(value) =>
                    void onStatusChange?.(resource.id, value as ResourceStatus)
                  }
                >
                  <SelectTrigger aria-label="Cambiar estado del recurso">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(resourceStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {canArchive ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void onToggleArchive?.(resource)}
              >
                {resource.status === 'archived' ? 'Quitar de archivo' : 'Archivar'}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <Separator />

      <ResourceContentPreview resource={resource} />

      {resource.links?.length ? (
        <>
          <Separator />
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Link2 className="size-3.5" />
              Enlaces salientes
            </div>
            <div className="flex flex-wrap gap-2">
              {resource.links.map((link) => {
                const isInteractive =
                  (link.targetType === 'project' && Boolean(onProjectSelect))
                  || (link.targetType === 'resource' && Boolean(onResourceSelect))

                if (!isInteractive) {
                  return (
                    <Badge key={link.id} variant="outline">
                      {link.targetType === 'project' ? 'Proyecto' : 'Recurso'}: {link.targetName}
                    </Badge>
                  )
                }

                return (
                  <button
                    key={link.id}
                    type="button"
                    className="rounded-full border border-border/70 px-3 py-1.5 text-left text-xs transition hover:border-border hover:bg-muted/40"
                    onClick={() => {
                      if (link.targetType === 'project') {
                        onProjectSelect?.(link.targetId)
                        return
                      }

                      onResourceSelect?.(link.targetId)
                    }}
                  >
                    {link.targetType === 'project' ? 'Proyecto' : 'Recurso'}: {link.targetName}
                  </button>
                )
              })}
            </div>
          </section>
        </>
      ) : null}

      {resource.backlinks?.length ? (
        <>
          <Separator />
          <section className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Referenciado por
            </div>
            <div className="flex flex-wrap gap-2">
              {resource.backlinks.map((backlink) =>
                onResourceSelect ? (
                  <button
                    key={backlink.id}
                    type="button"
                    className="rounded-full border border-border/70 px-3 py-1.5 text-left text-xs transition hover:border-border hover:bg-muted/40"
                    onClick={() => onResourceSelect(backlink.sourceResourceId)}
                  >
                    {backlink.sourceResourceTitle}
                  </button>
                ) : (
                  <Badge key={backlink.id} variant="secondary">
                    {backlink.sourceResourceTitle}
                  </Badge>
                )
              )}
            </div>
          </section>
        </>
      ) : null}

      {resource.unresolvedLinks?.length ? (
        <>
          <Separator />
          <section className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Menciones no resueltas
            </div>
            <div className="flex flex-wrap gap-2">
              {resource.unresolvedLinks.map((label) => (
                <Badge key={label} variant="outline">
                  [[{label}]]
                </Badge>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {resource.tags.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Etiquetas
            </div>
            <div className="flex flex-wrap gap-2">
              {resource.tags.map((tag) =>
                onTagSelect ? (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full border border-border/70 px-3 py-1.5 text-xs transition hover:border-border hover:bg-muted/40"
                    onClick={() => onTagSelect(tag)}
                  >
                    #{tag}
                  </button>
                ) : (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                )
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
