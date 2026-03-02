import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

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
  const method = req.method

  try {
    const sql = await getDb()

    if (method === 'GET') {
      const rows = await sql`SELECT id, name, type FROM accounts ORDER BY name`
      return json(rows)
    }

    if (method === 'POST') {
      let body: { name?: string; type?: string }
      try {
        body = (await req.json()) as { name?: string; type?: string }
      } catch {
        return err('Invalid JSON', 400)
      }
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const type = typeof body.type === 'string' ? body.type.trim() : ''
      if (!name) return err('name is required', 400)
      if (!type) return err('type is required', 400)
      const [row] = await sql`
        INSERT INTO accounts (id, name, type)
        VALUES (gen_random_uuid(), ${name}, ${type})
        RETURNING id, name, type
      `
      return json(row, 201)
    }

    return err('Method not allowed', 405)
  } catch (e) {
    console.error(e)
    return err('Internal server error', 500)
  }
}
