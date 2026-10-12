import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyXpGoal: true }
    });

    return NextResponse.json({ success: true, dailyXpGoal: user?.dailyXpGoal || 50 });
  } catch (error) {
    console.error('Get daily goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const goal = parseInt(body?.dailyXpGoal, 10);

    if (isNaN(goal) || goal < 10 || goal > 1000) {
      return NextResponse.json({ error: 'Daily XP goal must be between 10 and 1000 XP.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { dailyXpGoal: goal },
      select: { dailyXpGoal: true }
    });

    return NextResponse.json({ success: true, dailyXpGoal: updatedUser.dailyXpGoal });
  } catch (error) {
    console.error('Update daily goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
