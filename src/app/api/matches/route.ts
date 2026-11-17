import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getMatches } from '@/lib/services/swipes';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export function GET() {
  return NextResponse.json({ matches: getMatches(getDb()) }, { headers: { 'Cache-Control': 'no-store' } });
}
