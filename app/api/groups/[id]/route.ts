import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

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

    return NextResponse.json({
      success: true,
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
        members: formattedMembers
      }
    });
  } catch (error) {
    console.error('Fetch group detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
