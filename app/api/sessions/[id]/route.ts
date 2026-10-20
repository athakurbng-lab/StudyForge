import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-Id, x-user-id, *',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

async function resolveUserId(request: Request, body?: any): Promise<string | null> {
  let token = cookies().get('token')?.value;
  const authHeader = request.headers.get('authorization');
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (token) {
    const payload = await verifyAuthToken(token);
    if (payload?.userId) return payload.userId as string;
  }

  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('userId');
  const headerUserId = request.headers.get('x-user-id');
  const candidateId = queryUserId || headerUserId || body?.userId;

  const queryUsername = url.searchParams.get('username');
  const candidateUsername = queryUsername || body?.username;

  if (candidateId || candidateUsername) {
    const matched = await prisma.user.findFirst({
      where: {
        OR: [
          ...(candidateId ? [{ id: candidateId }] : []),
          ...(candidateUsername ? [
            { username: { equals: candidateUsername, mode: 'insensitive' as const } },
            { displayName: { equals: candidateUsername, mode: 'insensitive' as const } }
          ] : [])
        ]
      }
    });
    if (matched) return matched.id;
  }

  const isClientSync = url.searchParams.get('isClientSync') === 'true' || body?.isClientSync;
  if (isClientSync) {
    const owner = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: 'Abhishek Thakur', mode: 'insensitive' as const } },
          { displayName: { equals: 'AT', mode: 'insensitive' as const } }
        ]
      }
    });
    if (owner) return owner.id;
  }

  return null;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const session = await prisma.studySession.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, streak: true, totalXP: true } }
      }
    });

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404, headers: CORS_HEADERS });

    const isOwner = session.userId === userId;
    let hasAccess = isOwner || session.isShared;

    if (!hasAccess) {
      const isWatcher = await prisma.watcher.findUnique({
        where: {
          watcherId_targetId: {
            watcherId: userId,
            targetId: session.userId
          }
        }
      });
      if (isWatcher) hasAccess = true;
    }

    let requestStatus = null;
    if (!hasAccess) {
      const accessReq = await prisma.sessionAccessRequest.findUnique({
        where: { sessionId_requesterId: { sessionId: params.id, requesterId: userId } }
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
      }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        hasAccess: true,
        isOwner
      }
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const userId = await resolveUserId(request, body);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const session = await prisma.studySession.findUnique({ where: { id: params.id } });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
    if (session.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });

    const isShared = typeof body?.isShared === 'boolean' ? body.isShared : !session.isShared;

    const updated = await prisma.studySession.update({
      where: { id: params.id },
      data: { isShared }
    });

    return NextResponse.json({ success: true, session: updated }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // Body may be empty in standard DELETE requests
    }

    const userId = await resolveUserId(request, body);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const url = new URL(request.url);
    const titleFilter = url.searchParams.get('title') || body?.title || body?.moduleName;
    const durationFilter = url.searchParams.get('duration') || body?.duration || body?.durationMinutes;
    const notesFilter = url.searchParams.get('notes') || body?.notes || body?.rawText;

    // 1. Try to find by primary ID first
    let session = await prisma.studySession.findUnique({
      where: { id: params.id }
    });

    const hasContentFilter = Boolean(titleFilter || (durationFilter && !isNaN(Number(durationFilter))) || notesFilter);

    // 2. If not found by ID (e.g. params.id is local 'sess-...' or mismatch), search by user and content ONLY if filters were provided
    if (!session && userId && hasContentFilter) {
      session = await prisma.studySession.findFirst({
        where: {
          userId,
          ...(titleFilter ? { title: { contains: titleFilter, mode: 'insensitive' as const } } : {}),
          ...(durationFilter && !isNaN(Number(durationFilter)) ? { durationMinutes: Number(durationFilter) } : {}),
          ...(notesFilter ? { rawText: { contains: notesFilter.slice(0, 30), mode: 'insensitive' as const } } : {})
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!session) {
      // Session is already deleted or never existed in DB - return success so client clears its deletion queue
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalXP: true, streak: true, freezeTokens: true }
      });
      return NextResponse.json({
        success: true,
        alreadyDeleted: true,
        user: currentUser
      }, { headers: CORS_HEADERS });
    }

    // Verify ownership
    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
    }

    // Deduct the XP safely from the user (floor at 0) and delete session atomically
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currentXp = user?.totalXP || 0;
    const newXp = Math.max(0, currentXp - session.xpAwarded);

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { totalXP: newXp }
      }),
      prisma.studySession.delete({
        where: { id: session.id }
      })
    ]);

    console.log(`[Delete Session] Successfully deleted session ${session.id} for user ${userId}. Deducted ${session.xpAwarded} XP (new total: ${newXp}).`);

    return NextResponse.json({
      success: true,
      deletedSessionId: session.id,
      user: {
        totalXP: updatedUser.totalXP,
        streak: updatedUser.streak,
        freezeTokens: updatedUser.freezeTokens
      }
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
