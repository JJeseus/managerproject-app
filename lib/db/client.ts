import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (dbInstance) {
    return dbInstance
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('Falta la variable de entorno DATABASE_URL')
  }

  const client = neon(databaseUrl)
  dbInstance = drizzle({ client, schema })

  return dbInstance
}
