'use client'

import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <>
      <Header title="Configuración" breadcrumbs={[{ label: 'Configuración' }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Administra tus preferencias de la aplicación
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza cómo se ve la aplicación en tu dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Tema</Label>
                <RadioGroup
                  value={theme}
                  onValueChange={setTheme}
                  className="grid grid-cols-3 gap-4"
                >
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem value="light" id="light" className="sr-only" />
                    <Sun className="mb-3 size-6" />
                    <span className="text-sm font-medium">Claro</span>
                  </Label>
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem value="dark" id="dark" className="sr-only" />
                    <Moon className="mb-3 size-6" />
                    <span className="text-sm font-medium">Oscuro</span>
                  </Label>
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem value="system" id="system" className="sr-only" />
                    <Monitor className="mb-3 size-6" />
                    <span className="text-sm font-medium">Sistema</span>
                  </Label>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Esta sección estará disponible en una próxima versión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificaciones por correo</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe actualizaciones por correo de tus proyectos
                  </p>
                </div>
                <Switch id="email-notifications" defaultChecked disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="deadline-reminders">Recordatorios de vencimiento</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe recordatorios antes de la fecha límite
                  </p>
                </div>
                <Switch id="deadline-reminders" defaultChecked disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-summary">Resumen semanal</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe un reporte semanal de avance
                  </p>
                </div>
                <Switch id="weekly-summary" disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos y privacidad</CardTitle>
              <CardDescription>
                Acciones avanzadas no disponibles por ahora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exportar datos</Label>
                  <p className="text-sm text-muted-foreground">
                    Descarga tus proyectos y tareas
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  No disponible
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Zona de riesgo</Label>
                  <p className="text-sm text-muted-foreground">
                    Elimina permanentemente toda tu información
                  </p>
                </div>
                <Button variant="destructive" size="sm" disabled>
                  No disponible
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
