import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyAuthToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, isPublic } = await request.json();

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Group name must be at least 3 characters' }, { status: 400 });
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const group = await prisma.group.create({
      data: {
        name,
        description: description || '',
        isPrivate: isPublic === false,
        inviteCode,
        members: {
          create: {
            userId: payload.userId as string,
            role: 'SUPER_ADMIN'
          }
        }
      }
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
