import { loadEnvConfig } from '@next/env'
import { eq } from 'drizzle-orm'
import { getDb } from '../lib/db/client'
import { projects, tasks } from '../lib/db/schema'

loadEnvConfig(process.cwd())

async function main() {
  const db = getDb()
  const projectRows = await db.select({ id: projects.id }).from(projects)

  for (const project of projectRows) {
    const taskRows = await db
      .select({ status: tasks.status })
      .from(tasks)
      .where(eq(tasks.projectId, project.id))

    const total = taskRows.length
    const completed = taskRows.filter((task) => task.status === 'done').length
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

    await db
      .update(projects)
      .set({
        progress,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))

    console.log(`${project.id}: ${progress}%`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
