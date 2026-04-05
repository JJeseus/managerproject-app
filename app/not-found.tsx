import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
        <p className="text-sm text-muted-foreground">
          El recurso que buscas no existe o fue eliminado.
        </p>
        <Button asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
