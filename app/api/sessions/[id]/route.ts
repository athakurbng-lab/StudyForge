import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyAuthToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await prisma.studySession.findUnique({
      where: { id: params.id }
    });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.userId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Deduct the XP from the user (optional based on your design, but usually expected)
    await prisma.user.update({
      where: { id: payload.userId as string },
      data: { totalXP: { decrement: session.xpAwarded } }
    });

    await prisma.studySession.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
