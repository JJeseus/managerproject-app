import {
  CheckCircle2,
  FileText,
  FolderKanban,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type Activity } from '@/lib/data'
import { getRecentActivities } from '@/lib/db/queries'
import { formatDistanceToNowEs } from '@/lib/date'

const activityIcons: Record<Activity['type'], typeof CheckCircle2> = {
  task_completed: CheckCircle2,
  task_created: Plus,
  project_updated: FolderKanban,
  note_added: FileText,
  status_changed: RefreshCw,
}

const activityColors: Record<Activity['type'], string> = {
  task_completed: 'text-emerald-500 bg-emerald-500/10',
  task_created: 'text-blue-500 bg-blue-500/10',
  project_updated: 'text-purple-500 bg-purple-500/10',
  note_added: 'text-amber-500 bg-amber-500/10',
  status_changed: 'text-zinc-400 bg-zinc-500/10',
}

export async function ActivityPanel() {
  const activities = await getRecentActivities(8)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-medium">Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-4 pb-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type]
              const colorClasses = activityColors[activity.type]

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div
                    className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${colorClasses}`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="leading-snug text-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNowEs(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
