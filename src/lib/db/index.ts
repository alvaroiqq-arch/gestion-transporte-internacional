import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// prepare: false es obligatorio con el transaction pooler de Supabase (puerto
// 6543), que es el recomendado para entornos serverless como Vercel.
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

export const db = drizzle(client, { schema })
