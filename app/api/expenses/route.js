import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { ensureSchema, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT id, title, amount::float8 AS amount, currency, country, category, note, occurred_at AS "occurredAt", created_at AS "createdAt"
       FROM expenses
       ORDER BY created_at DESC
       LIMIT 200;`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(
      { message: 'Database connection failed. Configure DATABASE_URL for an external PostgreSQL database.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const amount = Number(body.amount);

    if (!body.title || Number.isNaN(amount) || amount <= 0 || !body.currency || !body.country || !body.occurredAt) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const id = randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO expenses (id, title, amount, currency, country, category, note, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, title, amount::float8 AS amount, currency, country, category, note, occurred_at AS "occurredAt", created_at AS "createdAt";`,
      [
        id,
        body.title.trim(),
        amount,
        body.currency,
        body.country,
        body.category?.trim() || null,
        body.note?.trim() || null,
        body.occurredAt
      ]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch {
    return NextResponse.json(
      { message: 'Database connection failed. Configure DATABASE_URL for an external PostgreSQL database.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    }

    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'Delete failed.' }, { status: 500 });
  }
}
