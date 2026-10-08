import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyAuthToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dailyXpGoal } = await request.json();

    await prisma.user.update({
      where: { id: payload.userId as string },
      data: {
        dailyXpGoal: dailyXpGoal || 50,
        onboardingDone: true,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
