import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { resetSwipes } from '@/lib/services/swipes';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Demo-only: disabled unless COY_ALLOW_RESET=1 (returns 404 so its existence is not advertised). */
export function POST() {
  if (process.env.COY_ALLOW_RESET !== '1') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  resetSwipes(getDb());
  return NextResponse.json({ ok: true });
}