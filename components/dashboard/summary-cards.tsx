import {
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardStats } from '@/lib/db/queries'

export async function SummaryCards() {
  const stats = await getDashboardStats()

  const cards = [
    {
      title: 'Proyectos activos',
      value: stats.activeProjects,
      description: `${stats.totalProjects} proyectos en total`,
      icon: FolderKanban,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Completadas',
      value: stats.completedTasks,
      description: `de ${stats.totalTasks} tareas`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Vencidas',
      value: stats.overdueTasks,
      description: 'tareas requieren atención',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Vencen esta semana',
      value: stats.dueThisWeek,
      description: 'próximos vencimientos',
      icon: Clock,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-md p-2 ${card.bgColor}`}>
              <card.icon className={`size-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
