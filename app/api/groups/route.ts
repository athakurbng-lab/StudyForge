import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    let token = cookies().get('token')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    let userId: string | null = null;
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) {
        userId = payload.userId as string;
      }
    }

    // Optional query param fallback
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    if (!userId && queryUserId) {
      userId = queryUserId;
    }

    if (userId) {
      const memberships = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true, role: true }
      });
      const memberGroupIds = new Set(memberships.map(m => m.groupId));
      const roleMap = new Map(memberships.map(m => [m.groupId, m.role]));

      const groups = await prisma.group.findMany({
        where: {
          OR: [
            { id: { in: Array.from(memberGroupIds) } },
            { isPrivate: false }
          ]
        },
        include: {
          _count: { select: { members: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const mapped = groups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description || '',
        inviteCode: g.inviteCode,
        isPrivate: g.isPrivate,
        memberCount: g._count.members,
        isMember: memberGroupIds.has(g.id),
        role: roleMap.get(g.id) || null,
        createdAt: g.createdAt
      }));

      return NextResponse.json({ success: true, groups: mapped });
    }

    // Unauthenticated / Public groups discovery
    const groups = await prisma.group.findMany({
      where: { isPrivate: false },
      include: {
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const mapped = groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description || '',
      inviteCode: g.inviteCode,
      isPrivate: g.isPrivate,
      memberCount: g._count.members,
      isMember: false,
      role: null,
      createdAt: g.createdAt
    }));

    return NextResponse.json({ success: true, groups: mapped });
  } catch (error) {
    console.error('Fetch groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let token = cookies().get('token')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyAuthToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, isPublic } = await request.json();

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Group name must be at least 3 characters' }, { status: 400 });
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : '',
        isPrivate: isPublic === false,
        inviteCode,
        members: {
          create: {
            userId: payload.userId as string,
            role: 'SUPER_ADMIN'
          }
        }
      },
      include: {
        _count: { select: { members: true } }
      }
    });

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        inviteCode: group.inviteCode,
        isPrivate: group.isPrivate,
        memberCount: group._count.members,
        isMember: true,
        role: 'SUPER_ADMIN',
        createdAt: group.createdAt
      }
    });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
