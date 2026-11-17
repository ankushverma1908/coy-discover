import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getFeed } from '@/lib/services/swipes';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export function GET() {
  return NextResponse.json({ profiles: getFeed(getDb()) }, { headers: { 'Cache-Control': 'no-store' } });
}
