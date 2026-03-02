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
  const accountId = url.searchParams.get('accountId')
  const id = url.searchParams.get('id')
  if (!accountId) return err('accountId query parameter is required', 400)
  if (!id) return err('id query parameter is required', 400)

  const method = req.method

  try {
    const sql = await getDb()

    if (method === 'GET') {
      const [row] = await sql`
        SELECT id, account_id, amount::text, date, description, type
        FROM transactions
        WHERE id = ${id} AND account_id = ${accountId}
      `
      if (!row) return err('Not found', 404)
      return json(row)
    }

    if (method === 'PATCH') {
      let body: { amount?: number | string; date?: string; description?: string; type?: string }
      try {
        body = (await req.json()) as typeof body
      } catch {
        return err('Invalid JSON', 400)
      }
      const amount = body.amount != null ? Number(body.amount) : undefined
      if (amount !== undefined && Number.isNaN(amount)) return err('amount must be a number', 400)
      const date = body.date !== undefined ? String(body.date).trim() : undefined
      const description = body.description !== undefined ? String(body.description) : undefined
      const type =
        body.type === 'income' || body.type === 'expense' ? body.type : undefined

      if (amount === undefined && date === undefined && description === undefined && type === undefined) {
        return err('No fields to update', 400)
      }

      const [existing] = await sql`
        SELECT id, account_id, amount, date, description, type FROM transactions
        WHERE id = ${id} AND account_id = ${accountId}
      `
      if (!existing) return err('Not found', 404)

      const newAmount = amount !== undefined ? amount : Number(existing.amount)
      const newDate = date !== undefined ? date : String(existing.date)
      const newDescription = description !== undefined ? description : String(existing.description)
      const newType = type !== undefined ? type : String(existing.type)

      const [updated] = await sql`
        UPDATE transactions
        SET amount = ${newAmount}, date = ${newDate}::timestamptz, description = ${newDescription}, type = ${newType}
        WHERE id = ${id} AND account_id = ${accountId}
        RETURNING id, account_id, amount::text, date, description, type
      `
      if (!updated) return err('Not found', 404)
      return json(updated)
    }

    if (method === 'DELETE') {
      const [deleted] = await sql`
        DELETE FROM transactions WHERE id = ${id} AND account_id = ${accountId} RETURNING id
      `
      if (!deleted) return err('Not found', 404)
      return new Response(null, { status: 204 })
    }

    return err('Method not allowed', 405)
  } catch (e) {
    console.error(e)
    return err('Internal server error', 500)
  }
}
