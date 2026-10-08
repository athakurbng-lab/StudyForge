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

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Messages expire after 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const message = await prisma.message.create({
      data: {
        groupId: params.id,
        userId: payload.userId as string,
        content: content.trim(),
        expiresAt
      },
      include: {
        user: { select: { username: true, displayName: true } }
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyAuthToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    if (!messageId) return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify permissions: Must be message author or group Admin
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: params.id, userId: payload.userId as string }
    });

    const isAuthor = message.userId === payload.userId;
    const isAdmin = membership && (membership.role === 'ADMIN' || membership.role === 'SUPER_ADMIN');

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.message.delete({ where: { id: messageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
