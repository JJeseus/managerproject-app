import { Header } from '@/components/layout/header'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ActivityPanel } from '@/components/dashboard/activity-panel'
import { ProgressOverview } from '@/components/dashboard/progress-overview'

export default function DashboardPage() {
  return (
    <>
      <Header title="Inicio" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
          <p className="text-muted-foreground">
            Resumen de tus proyectos y tareas
          </p>
        </div>

        <SummaryCards />

        <div className="grid gap-6 lg:grid-cols-2">
          <ProgressOverview />
          <ActivityPanel />
        </div>
      </div>
    </>
  )
}
