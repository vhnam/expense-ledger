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
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return err('id query parameter is required', 400)

  const method = req.method

  try {
    const sql = await getDb()

    if (method === 'GET') {
      const [row] =
        await sql`SELECT id, name, type FROM accounts WHERE id = ${id}`
      if (!row) return err('Not found', 404)
      return json(row)
    }

    if (method === 'PATCH') {
      let body: { name?: string; type?: string }
      try {
        body = (await req.json()) as { name?: string; type?: string }
      } catch {
        return err('Invalid JSON', 400)
      }
      const name =
        body.name !== undefined ? String(body.name).trim() : undefined
      const type =
        body.type !== undefined ? String(body.type).trim() : undefined
      if (name !== undefined && !name) return err('name cannot be empty', 400)
      if (type !== undefined && !type) return err('type cannot be empty', 400)
      if (name === undefined && type === undefined) {
        return err('No fields to update', 400)
      }
      let updated: { id: string; name: string; type: string } | null
      if (name !== undefined && type !== undefined) {
        ;[updated] = await sql`
          UPDATE accounts SET name = ${name}, type = ${type} WHERE id = ${id} RETURNING id, name, type
        `
      } else if (name !== undefined) {
        ;[updated] = await sql`
          UPDATE accounts SET name = ${name} WHERE id = ${id} RETURNING id, name, type
        `
      } else {
        ;[updated] = await sql`
          UPDATE accounts SET type = ${type} WHERE id = ${id} RETURNING id, name, type
        `
      }
      if (!updated) return err('Not found', 404)
      return json(updated)
    }

    if (method === 'DELETE') {
      const [deleted] =
        await sql`DELETE FROM accounts WHERE id = ${id} RETURNING id`
      if (!deleted) return err('Not found', 404)
      return new Response(null, { status: 204 })
    }

    return err('Method not allowed', 405)
  } catch (e) {
    console.error(e)
    return err('Internal server error', 500)
  }
}
