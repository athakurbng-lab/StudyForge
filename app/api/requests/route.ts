import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-Id, x-user-id, *',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

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

export async function GET(request: Request) {
  try {
    const currentUserId = await getAuthUserId(request);
    if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const requests = await prisma.sessionAccessRequest.findMany({
      where: { ownerId: currentUserId, status: 'PENDING' },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            streak: true,
            totalXP: true
          }
        },
        session: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            xpAwarded: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, requests }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Get access requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const currentUserId = await getAuthUserId(request);
    if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const { requestId, action } = await request.json();

    if (!requestId || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid requestId or action' }, { status: 400, headers: CORS_HEADERS });
    }

    const req = await prisma.sessionAccessRequest.findUnique({
      where: { id: requestId }
    });

    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: CORS_HEADERS });
    if (req.ownerId !== currentUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });

    const updated = await prisma.sessionAccessRequest.update({
      where: { id: requestId },
      data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
    });

    return NextResponse.json({ success: true, request: updated }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Process access request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
