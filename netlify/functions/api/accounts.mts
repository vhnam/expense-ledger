import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { getSessionFromRequest } from '../lib/auth.mts'
import { handlePreflight, withCors } from '../lib/cors.mts'

const DATABASE_URL = process.env.DATABASE_URL

async function getDb() {
  if (!DATABASE_URL) throw new Response('DATABASE_URL not set', { status: 500 })
  return neon(DATABASE_URL)
}

function json<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function err(message: string, status: number) {
  return json({ error: message }, status)
}

export default async (req: Request, _context: Context) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  const session = await getSessionFromRequest(req)
  if (!session) return withCors(req, err('Unauthorized', 401))
  const userId = session.user.id

  const method = req.method

  try {
    const sql = await getDb()

    if (method === 'GET') {
      const rows =
        await sql`SELECT id, name, type FROM accounts WHERE user_id = ${userId} ORDER BY name`
      return withCors(req, json(rows))
    }

    if (method === 'POST') {
      let body: { name?: string; type?: string }
      try {
        body = (await req.json()) as { name?: string; type?: string }
      } catch {
        return withCors(req, err('Invalid JSON', 400))
      }
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const type = typeof body.type === 'string' ? body.type.trim() : ''
      if (!name) return withCors(req, err('name is required', 400))
      if (!type) return withCors(req, err('type is required', 400))
      const [row] = await sql`
        INSERT INTO accounts (id, name, type, user_id)
        VALUES (gen_random_uuid(), ${name}, ${type}, ${userId})
        RETURNING id, name, type
      `
      return withCors(req, json(row, 201))
    }

    return withCors(req, err('Method not allowed', 405))
  } catch (e) {
    console.error(e)
    return withCors(req, err('Internal server error', 500))
  }
}
