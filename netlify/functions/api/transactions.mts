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
  if (!accountId) return err('accountId query parameter is required', 400)

  const method = req.method

  try {
    const sql = await getDb()

    if (method === 'GET') {
      const rows = await sql`
        SELECT id, account_id, amount::text, date, description, type
        FROM transactions
        WHERE account_id = ${accountId}
        ORDER BY date DESC
      `
      return json(rows)
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
        return err('Invalid JSON', 400)
      }
      if (body.account_id !== accountId) return err('account_id must match accountId', 400)
      const amount = body.amount != null ? Number(body.amount) : NaN
      if (Number.isNaN(amount)) return err('amount is required and must be a number', 400)
      const date = typeof body.date === 'string' ? body.date.trim() : ''
      if (!date) return err('date is required', 400)
      const description = typeof body.description === 'string' ? body.description : ''
      const type = body.type === 'income' || body.type === 'expense' ? body.type : ''
      if (!type) return err('type must be income or expense', 400)

      const [row] = await sql`
        INSERT INTO transactions (id, account_id, amount, date, description, type)
        VALUES (gen_random_uuid(), ${accountId}, ${amount}, ${date}::timestamptz, ${description}, ${type})
        RETURNING id, account_id, amount::text, date, description, type
      `
      return json(row, 201)
    }

    return err('Method not allowed', 405)
  } catch (e) {
    console.error(e)
    return err('Internal server error', 500)
  }
}
