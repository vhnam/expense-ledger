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
  const accountId = url.searchParams.get('accountId')
  const id = url.searchParams.get('id')
  if (!accountId) return withCors(req, err('accountId query parameter is required', 400))
  if (!id) return withCors(req, err('id query parameter is required', 400))

  const method = req.method

  try {
    const sql = await getDb()

    if (method === 'GET') {
      const [row] = await sql`
        SELECT t.id, t.account_id, t.amount::text, t.date, t.description, t.type
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.id = ${id} AND t.account_id = ${accountId} AND a.user_id = ${userId}
      `
      if (!row) return withCors(req, err('Not found', 404))
      return withCors(req, json(row))
    }

    if (method === 'PATCH') {
      let body: {
        amount?: number | string
        date?: string
        description?: string
        type?: string
      }
      try {
        body = (await req.json()) as typeof body
      } catch {
        return withCors(req, err('Invalid JSON', 400))
      }
      const amount = body.amount != null ? Number(body.amount) : undefined
      if (amount !== undefined && Number.isNaN(amount))
        return withCors(req, err('amount must be a number', 400))
      const date =
        body.date !== undefined ? String(body.date).trim() : undefined
      const description =
        body.description !== undefined ? String(body.description) : undefined
      const type =
        body.type === 'income' || body.type === 'expense'
          ? body.type
          : undefined

      if (
        amount === undefined &&
        date === undefined &&
        description === undefined &&
        type === undefined
      ) {
        return withCors(req, err('No fields to update', 400))
      }

      const [existing] = await sql`
        SELECT t.id, t.account_id, t.amount, t.date, t.description, t.type
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.id = ${id} AND t.account_id = ${accountId} AND a.user_id = ${userId}
      `
      if (!existing) return withCors(req, err('Not found', 404))

      const newAmount = amount !== undefined ? amount : Number(existing.amount)
      const newDate = date !== undefined ? date : String(existing.date)
      const newDescription =
        description !== undefined ? description : String(existing.description)
      const newType = type !== undefined ? type : String(existing.type)

      const [updated] = await sql`
        UPDATE transactions
        SET amount = ${newAmount}, date = ${newDate}::timestamptz, description = ${newDescription}, type = ${newType}
        WHERE id = ${id} AND account_id = ${accountId}
        RETURNING id, account_id, amount::text, date, description, type
      `
      if (!updated) return withCors(req, err('Not found', 404))
      return withCors(req, json(updated))
    }

    if (method === 'DELETE') {
      // Verify ownership before deleting
      const [owned] = await sql`
        SELECT t.id FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.id = ${id} AND t.account_id = ${accountId} AND a.user_id = ${userId}
      `
      if (!owned) return withCors(req, err('Not found', 404))
      await sql`DELETE FROM transactions WHERE id = ${id} AND account_id = ${accountId}`
      return withCors(req, new Response(null, { status: 204 }))
    }

    return withCors(req, err('Method not allowed', 405))
  } catch (e) {
    console.error(e)
    return withCors(req, err('Internal server error', 500))
  }
}
