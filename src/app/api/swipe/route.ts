import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { HttpError, swipe } from '@/lib/services/swipes';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const b = body as { profileId?: unknown; action?: unknown } | null;
  if (!b || typeof b !== 'object' || !Number.isInteger(b.profileId) || (b.action !== 'like' && b.action !== 'pass')) {
    return NextResponse.json({ error: 'Expected { profileId: integer, action: "like" | "pass" }' }, { status: 400 });
  }
  try {
    return NextResponse.json(swipe(getDb(), b.profileId as number, b.action), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
