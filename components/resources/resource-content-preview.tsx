import { FileText } from 'lucide-react'
import type { Resource } from '@/lib/data'
import { CodePreview } from '@/components/resources/code-preview'
import { ResourceSourcePreview } from '@/components/resources/resource-source-preview'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getGoogleDrivePreview } from '@/lib/google-drive'

interface ResourceContentPreviewProps {
  resource: Resource
  className?: string
}

const structuredFormats = new Set([
  'csv',
  'json',
  'markdown',
  'sql',
  'xml',
  'yaml',
])

function shouldUseCodePreview(resource: Resource) {
  return resource.type === 'code'
    || resource.type === 'dataset'
    || structuredFormats.has((resource.format || resource.language).toLowerCase())
}

export function ResourceContentPreview({
  resource,
  className,
}: ResourceContentPreviewProps) {
  const hasSourcePreview = Boolean(getGoogleDrivePreview(resource.sourceUrl))
  const hasContent = Boolean(resource.content.trim())
  const previewLabel =
    resource.type === 'code' ? 'Código' : resource.type === 'dataset' ? 'Datos' : 'Contenido'

  if (!hasSourcePreview && !hasContent) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center',
          className
        )}
      >
        <FileText className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Este recurso no tiene contenido embebido para previsualizar.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {resource.sourceUrl && resource.type !== 'code' && hasSourcePreview ? (
        <ResourceSourcePreview sourceUrl={resource.sourceUrl} />
      ) : null}

      {hasContent ? (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
              {previewLabel}
            </Badge>
          </div>

          {shouldUseCodePreview(resource) ? (
            <CodePreview
              code={resource.content}
              language={resource.type === 'code' ? resource.language || resource.format : resource.format}
              className="max-h-[420px]"
            />
          ) : (
            <div className="max-h-[420px] overflow-auto rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-foreground">
              {resource.content}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
