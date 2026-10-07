import { devOnly } from '@/lib/api-guard';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const blocked = devOnly();
  if (blocked) return blocked;

  return NextResponse.json({
    success: true,
    message: 'Invite API is working',
    timestamp: new Date().toISOString()
  });
}
