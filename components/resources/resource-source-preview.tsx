import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getGoogleDrivePreview } from '@/lib/google-drive'

interface ResourceSourcePreviewProps {
  sourceUrl: string
}

export function ResourceSourcePreview({ sourceUrl }: ResourceSourcePreviewProps) {
  const googleDrivePreview = getGoogleDrivePreview(sourceUrl)

  if (!googleDrivePreview) {
    return null
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Vista previa
          </p>
          <p className="text-sm text-muted-foreground">
            Documento embebido desde Google Drive.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            Abrir en Drive
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/80 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
        <iframe
          src={googleDrivePreview.previewUrl}
          title="Vista previa de Google Drive"
          className="h-[420px] w-full bg-background"
          loading="lazy"
        />
      </div>
    </section>
  )
}
