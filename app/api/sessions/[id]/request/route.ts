import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyAuthToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await prisma.studySession.findUnique({
      where: { id: params.id }
    });

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.userId === payload.userId) return NextResponse.json({ error: 'You own this session' }, { status: 400 });

    const existing = await prisma.sessionAccessRequest.findUnique({
      where: {
        sessionId_requesterId: { sessionId: params.id, requesterId: payload.userId as string }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Request already exists' }, { status: 400 });
    }

    const newReq = await prisma.sessionAccessRequest.create({
      data: {
        sessionId: params.id,
        ownerId: session.userId,
        requesterId: payload.userId as string,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, request: newReq });
  } catch (error) {
    console.error('Session access request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
