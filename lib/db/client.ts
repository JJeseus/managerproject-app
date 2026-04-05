import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL

const client = databaseUrl ? neon(databaseUrl) : null

export const db = client ? drizzle({ client, schema }) : null

export function getDb() {
  if (!db) {
    throw new Error('Falta la variable de entorno DATABASE_URL')
  }

  return db
}
