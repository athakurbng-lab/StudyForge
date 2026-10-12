import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    let token = cookies().get('token')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    if (!token) return NextResponse.json({ error: 'Unauthorized. Please sign in to join groups.' }, { status: 401 });

    const payload = await verifyAuthToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const rawCode = (body.code || body.inviteCode || '').toString().trim().toUpperCase();

    if (!rawCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const group = await prisma.group.findUnique({
      where: { inviteCode: rawCode },
      include: {
        _count: { select: { members: true } }
      }
    });

    if (!group) {
      return NextResponse.json({ error: `No group found with invite code "${rawCode}".` }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: payload.userId as string
      }
    });

    if (!existingMember) {
      await prisma.groupMember.create({
        data: {
          userId: payload.userId as string,
          groupId: group.id,
          role: 'MEMBER'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${group.name}!`,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        inviteCode: group.inviteCode,
        isPrivate: group.isPrivate,
        memberCount: group._count.members + (existingMember ? 0 : 1),
        isMember: true,
        role: existingMember ? existingMember.role : 'MEMBER'
      }
    });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
