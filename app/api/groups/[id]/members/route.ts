import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyAuthToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId, action } = await request.json(); // action = 'PROMOTE' or 'DEMOTE'

    // Verify requester is SUPER_ADMIN
    const requester = await prisma.groupMember.findFirst({
      where: { groupId: params.id, userId: payload.userId as string }
    });

    if (!requester || requester.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admins can change roles' }, { status: 403 });
    }

    const newRole = action === 'PROMOTE' ? 'ADMIN' : 'MEMBER';

    // Find the target membership id
    const target = await prisma.groupMember.findFirst({
      where: { groupId: params.id, userId: targetUserId }
    });

    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    await prisma.groupMember.update({
      where: { id: target.id },
      data: { role: newRole }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
