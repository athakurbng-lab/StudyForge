import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeKey = await prisma.freeKey.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (!activeKey) {
      return NextResponse.json({
        success: false,
        error: 'No active free key found in database'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      provider: activeKey.provider,
      model: activeKey.model,
      label: activeKey.label || 'NVIDIA Nemotron 3 Ultra 550B (Shared Global)',
      key: activeKey.key,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      }
    });
  } catch (err: any) {
    console.error('Error fetching free key from database:', err);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch free key from database'
    }, { status: 500 });
  }
}
