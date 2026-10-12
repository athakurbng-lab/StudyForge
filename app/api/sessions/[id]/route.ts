import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

async function getAuthPayload(request: Request) {
  let token = cookies().get('token')?.value;
  const authHeader = request.headers.get('authorization');
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (!token) return null;
  return await verifyAuthToken(token);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await getAuthPayload(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await prisma.studySession.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, streak: true, totalXP: true } }
      }
    });

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const isOwner = session.userId === payload.userId;
    let hasAccess = isOwner || session.isShared;

    if (!hasAccess) {
      const isWatcher = await prisma.watcher.findUnique({
        where: {
          watcherId_targetId: {
            watcherId: payload.userId as string,
            targetId: session.userId
          }
        }
      });
      if (isWatcher) hasAccess = true;
    }

    let requestStatus = null;
    if (!hasAccess) {
      const accessReq = await prisma.sessionAccessRequest.findUnique({
        where: { sessionId_requesterId: { sessionId: params.id, requesterId: payload.userId as string } }
      });
      if (accessReq) {
        requestStatus = accessReq.status;
        if (requestStatus === 'APPROVED') hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          userId: session.userId,
          title: session.title,
          tags: session.tags,
          xpAwarded: session.xpAwarded,
          isShared: false,
          hasAccess: false,
          requestStatus,
          createdAt: session.createdAt,
          user: session.user
        }
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        hasAccess: true,
        isOwner
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await getAuthPayload(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const session = await prisma.studySession.findUnique({ where: { id: params.id } });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.userId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const isShared = typeof body.isShared === 'boolean' ? body.isShared : !session.isShared;

    const updated = await prisma.studySession.update({
      where: { id: params.id },
      data: { isShared }
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await getAuthPayload(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await prisma.studySession.findUnique({
      where: { id: params.id }
    });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.userId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Deduct the XP from the user
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
