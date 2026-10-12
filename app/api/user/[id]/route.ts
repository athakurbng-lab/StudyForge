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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUserId = await getAuthUserId(request);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        subjects: true,
        streak: true,
        longestStreak: true,
        totalXP: true,
        dailyXpGoal: true,
        freezeTokens: true,
        isPublic: true,
        createdAt: true,
        studySessions: {
          orderBy: { createdAt: 'desc' },
          take: 30
        }
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isMe = currentUserId === targetUser.id;

    let isMyWatcher = false;
    let amIWatching = false;
    let approvedSessionIds: string[] = [];

    if (!isMe) {
      // Is targetUser a watcher of current user? (Target can see current user's logs)
      const watcherRecord = await prisma.watcher.findUnique({
        where: {
          watcherId_targetId: {
            watcherId: targetUser.id,
            targetId: currentUserId
          }
        }
      });
      if (watcherRecord) isMyWatcher = true;

      // Am I watching the target user? (I can see target user's logs)
      const meWatchingThem = await prisma.watcher.findUnique({
        where: {
          watcherId_targetId: {
            watcherId: currentUserId,
            targetId: targetUser.id
          }
        }
      });
      if (meWatchingThem) amIWatching = true;

      // Check specific approved session requests
      const accessReqs = await prisma.sessionAccessRequest.findMany({
        where: {
          ownerId: targetUser.id,
          requesterId: currentUserId
        }
      });

      const pendingMap = new Map<string, string>();
      accessReqs.forEach(r => {
        if (r.status === 'APPROVED') approvedSessionIds.push(r.sessionId);
        else pendingMap.set(r.sessionId, r.status);
      });

      // Filter or obscure sessions according to privacy rules
      const sanitizedSessions = targetUser.studySessions.map(session => {
        const hasAccess = isMe || session.isShared || amIWatching || approvedSessionIds.includes(session.id);
        const reqStatus = pendingMap.get(session.id) || null;

        if (hasAccess) {
          return {
            ...session,
            hasAccess: true,
            requestStatus: null
          };
        } else {
          return {
            id: session.id,
            userId: session.userId,
            title: session.title,
            tags: session.tags,
            xpAwarded: session.xpAwarded,
            isShared: false,
            hasAccess: false,
            requestStatus: reqStatus,
            createdAt: session.createdAt
          };
        }
      });

      return NextResponse.json({
        success: true,
        user: {
          id: targetUser.id,
          username: targetUser.username,
          displayName: targetUser.displayName,
          bio: targetUser.bio,
          subjects: targetUser.subjects,
          streak: targetUser.streak,
          longestStreak: targetUser.longestStreak,
          totalXP: targetUser.totalXP,
          dailyXpGoal: targetUser.dailyXpGoal,
          freezeTokens: targetUser.freezeTokens,
          isPublic: targetUser.isPublic,
          createdAt: targetUser.createdAt
        },
        isMe,
        isMyWatcher,
        amIWatching,
        sessions: sanitizedSessions
      });
    }

    // Viewing myself
    return NextResponse.json({
      success: true,
      user: targetUser,
      isMe: true,
      isMyWatcher: false,
      amIWatching: false,
      sessions: targetUser.studySessions.map(s => ({ ...s, hasAccess: true, requestStatus: null }))
    });
  } catch (error) {
    console.error('User profile route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
