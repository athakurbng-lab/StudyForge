import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

async function getAuthUserId(request: Request): Promise<string | null> {
  let token = cookies().get('token')?.value;
  const authHeader = request.headers.get('authorization');
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (!token) return null;
  const payload = await verifyAuthToken(token);
  return (payload?.userId as string) || null;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyXpGoal: true }
    });

    return NextResponse.json({ success: true, dailyXpGoal: user?.dailyXpGoal || 50 }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Get daily goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const body = await request.json();
    const goal = parseInt(body?.dailyXpGoal, 10);

    if (isNaN(goal) || goal < 10 || goal > 1000) {
      return NextResponse.json({ error: 'Daily XP goal must be between 10 and 1000 XP.' }, { status: 400, headers: CORS_HEADERS });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { dailyXpGoal: goal },
      select: { dailyXpGoal: true }
    });

    return NextResponse.json({ success: true, dailyXpGoal: updatedUser.dailyXpGoal }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Update daily goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
