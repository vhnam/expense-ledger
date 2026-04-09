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

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return withCors(req, err('id query parameter is required', 400))

  const method = req.method

  try {
    const sql = await getDb()

    if (method === 'GET') {
      const [row] =
        await sql`SELECT id, name, type FROM bank_accounts WHERE id = ${id} AND user_id = ${userId}`
      if (!row) return withCors(req, err('Not found', 404))
      return withCors(req, json(row))
    }

    if (method === 'PATCH') {
      let body: { name?: string; type?: string }
      try {
        body = (await req.json()) as { name?: string; type?: string }
      } catch {
        return withCors(req, err('Invalid JSON', 400))
      }
      const name =
        body.name !== undefined ? String(body.name).trim() : undefined
      const type =
        body.type !== undefined ? String(body.type).trim() : undefined
      if (name !== undefined && !name)
        return withCors(req, err('name cannot be empty', 400))
      if (type !== undefined && !type)
        return withCors(req, err('type cannot be empty', 400))
      if (name === undefined && type === undefined) {
        return withCors(req, err('No fields to update', 400))
      }
      let updated: { id: string; name: string; type: string } | null
      if (name !== undefined && type !== undefined) {
        ;[updated] = await sql`
          UPDATE bank_accounts SET name = ${name}, type = ${type} WHERE id = ${id} AND user_id = ${userId} RETURNING id, name, type
        `
      } else if (name !== undefined) {
        ;[updated] = await sql`
          UPDATE bank_accounts SET name = ${name} WHERE id = ${id} AND user_id = ${userId} RETURNING id, name, type
        `
      } else {
        ;[updated] = await sql`
          UPDATE bank_accounts SET type = ${type} WHERE id = ${id} AND user_id = ${userId} RETURNING id, name, type
        `
      }
      if (!updated) return withCors(req, err('Not found', 404))
      return withCors(req, json(updated))
    }

    if (method === 'DELETE') {
      const [deleted] =
        await sql`DELETE FROM bank_accounts WHERE id = ${id} AND user_id = ${userId} RETURNING id`
      if (!deleted) return withCors(req, err('Not found', 404))
      return withCors(req, new Response(null, { status: 204 }))
    }

    return withCors(req, err('Method not allowed', 405))
  } catch (e) {
    console.error(e)
    return withCors(req, err('Internal server error', 500))
  }
}
