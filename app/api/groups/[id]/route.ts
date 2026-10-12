import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    let token = cookies().get('token')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    let userId: string | null = null;
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) userId = payload.userId as string;
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all-time';
    const clientHash = searchParams.get('clientHash') || request.headers.get('if-none-match')?.replace(/W\/"|"/g, '');

    let dateFilter: Date | undefined = undefined;
    const now = new Date();
    if (timeframe === 'daily') {
      now.setHours(0, 0, 0, 0);
      dateFilter = now;
    } else if (timeframe === 'weekly') {
      now.setDate(now.getDate() - 7);
      dateFilter = now;
    } else if (timeframe === 'monthly') {
      now.setMonth(now.getMonth() - 1);
      dateFilter = now;
    }

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                totalXP: true,
                streak: true,
                studySessions: dateFilter ? {
                  where: { createdAt: { gte: dateFilter } },
                  select: { xpAwarded: true }
                } : false
              }
            }
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = userId ? group.members.some(m => m.userId === userId) : false;
    if (!isMember && group.isPrivate) {
      return NextResponse.json({ error: 'This group is private' }, { status: 403 });
    }

    const currentUserMember = userId ? group.members.find(m => m.userId === userId) : null;

    let challengedUserIds: string[] = [];
    if (userId) {
      const todayStr = new Date().toISOString().split('T')[0];
      const myChallenges = await prisma.scoreChallenge.findMany({
        where: { challengerId: userId, challengeDate: todayStr, groupId: params.id },
        select: { targetUserId: true }
      });
      challengedUserIds = myChallenges.map(c => c.targetUserId);
    }

    const formattedMembers = group.members.map((m: any) => {
      let timeframeXP = m.user.totalXP;
      if (dateFilter && Array.isArray(m.user.studySessions)) {
        timeframeXP = m.user.studySessions.reduce((sum: number, s: any) => sum + (s.xpAwarded || 0), 0);
      }

      return {
        id: m.id,
        userId: m.userId,
        role: m.role,
        username: m.user.username,
        displayName: m.user.displayName || m.user.username,
        totalXP: m.user.totalXP,
        streak: m.user.streak,
        timeframeXP,
        joinedAt: m.joinedAt
      };
    });

    formattedMembers.sort((a, b) => b.timeframeXP - a.timeframeXP);

    // Compute deterministic hash of squad + members + stats
    const hashData = `${group.id}:${timeframe}:${group.name}:${group.members.length}:${formattedMembers.map(m => `${m.userId}:${m.timeframeXP}:${m.streak}`).join(',')}`;
    const hash = crypto.createHash('sha1').update(hashData).digest('hex');

    if (clientHash && clientHash === hash) {
      return NextResponse.json(
        { success: true, notModified: true, hash },
        { 
          status: 200, 
          headers: { 
            'ETag': `"${hash}"`,
            'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate'
          } 
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notModified: false,
        hash,
        group: {
          id: group.id,
          name: group.name,
          description: group.description || '',
          inviteCode: group.inviteCode,
          isPrivate: group.isPrivate,
          createdAt: group.createdAt,
          memberCount: group.members.length,
          isMember,
          myRole: currentUserMember ? currentUserMember.role : null,
          timeframe,
          challengedUserIds,
          members: formattedMembers
        }
      },
      { 
        status: 200, 
        headers: { 
          'ETag': `"${hash}"`,
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate'
        } 
      }
    );
  } catch (error) {
    console.error('Fetch group detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
