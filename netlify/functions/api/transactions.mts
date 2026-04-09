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
  if (!accountId)
    return withCors(req, err('accountId query parameter is required', 400))

  const method = req.method

  try {
    const sql = await getDb()

    if (method === 'GET') {
      const [account] =
        await sql`SELECT id FROM bank_accounts WHERE id = ${accountId} AND user_id = ${userId}`
      if (!account) return withCors(req, err('Not found', 404))

      const rows = await sql`
        SELECT id, account_id, amount::text, date, description, type
        FROM transactions
        WHERE account_id = ${accountId}
        ORDER BY date DESC
      `
      return withCors(req, json(rows))
    }

    if (method === 'POST') {
      let body: {
        account_id?: string
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
      if (body.account_id !== accountId)
        return withCors(req, err('account_id must match accountId', 400))

      const [account] =
        await sql`SELECT id FROM bank_accounts WHERE id = ${accountId} AND user_id = ${userId}`
      if (!account) return withCors(req, err('Not found', 404))

      const amount = body.amount != null ? Number(body.amount) : NaN
      if (Number.isNaN(amount))
        return withCors(req, err('amount is required and must be a number', 400))
      const date = typeof body.date === 'string' ? body.date.trim() : ''
      if (!date) return withCors(req, err('date is required', 400))
      const description =
        typeof body.description === 'string' ? body.description : ''
      const type =
        body.type === 'income' || body.type === 'expense' ? body.type : ''
      if (!type) return withCors(req, err('type must be income or expense', 400))

      const [row] = await sql`
        INSERT INTO transactions (id, account_id, amount, date, description, type)
        VALUES (gen_random_uuid(), ${accountId}, ${amount}, ${date}::timestamptz, ${description}, ${type})
        RETURNING id, account_id, amount::text, date, description, type
      `
      return withCors(req, json(row, 201))
    }

    return withCors(req, err('Method not allowed', 405))
  } catch (e) {
    console.error(e)
    return withCors(req, err('Internal server error', 500))
  }
}
