'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Ocurrió un error inesperado</h1>
        <p className="text-sm text-muted-foreground">
          No se pudo cargar esta pantalla. Intenta nuevamente.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  )
}
