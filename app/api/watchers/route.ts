import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

    // Users watching me (they can see my private logs)
    const watchers = await prisma.watcher.findMany({
      where: { targetId: currentUserId },
      include: {
        watcher: {
          select: {
            id: true,
            username: true,
            displayName: true,
            totalXP: true,
            streak: true
          }
        }
      }
    });

    // Users I am watching (I can see their private logs)
    const watching = await prisma.watcher.findMany({
      where: { watcherId: currentUserId },
      include: {
        target: {
          select: {
            id: true,
            username: true,
            displayName: true,
            totalXP: true,
            streak: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      watchers: watchers.map(w => w.watcher),
      watching: watching.map(w => w.target)
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Get watchers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const currentUserId = await getAuthUserId(request);
    if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const body = await request.json();
    const { targetUserId, username, action = 'add' } = body;

    let targetId = targetUserId;
    if (!targetId && username) {
      const cleanName = username.trim().replace(/^@/, '');
      const found = await prisma.user.findFirst({
        where: {
          OR: [
            { id: cleanName },
            { username: { equals: cleanName, mode: 'insensitive' } },
            { displayName: { equals: cleanName, mode: 'insensitive' } }
          ]
        }
      });
      if (!found) {
        return NextResponse.json({ error: `User "@${cleanName}" not found.` }, { status: 404, headers: CORS_HEADERS });
      }
      targetId = found.id;
    }

    if (!targetId) {
      return NextResponse.json({ error: 'targetUserId or username is required' }, { status: 400, headers: CORS_HEADERS });
    }

    if (targetId === currentUserId) {
      return NextResponse.json({ error: 'Cannot watch yourself' }, { status: 400, headers: CORS_HEADERS });
    }

    // Adding targetId as watcher of currentUserId (i.e. target can watch me)
    // targetId in prisma schema is the one being watched, watcherId is the one who watches
    if (action === 'remove') {
      await prisma.watcher.deleteMany({
        where: {
          targetId: currentUserId,
          watcherId: targetId
        }
      });
      return NextResponse.json({ success: true, message: 'Watcher removed' }, { headers: CORS_HEADERS });
    } else {
      // Upsert watcher
      const existing = await prisma.watcher.findUnique({
        where: {
          watcherId_targetId: {
            watcherId: targetId,
            targetId: currentUserId
          }
        }
      });

      if (!existing) {
        await prisma.watcher.create({
          data: {
            watcherId: targetId,
            targetId: currentUserId
          }
        });
      }

      return NextResponse.json({ success: true, message: 'Watcher added' }, { headers: CORS_HEADERS });
    }
  } catch (error) {
    console.error('Post watcher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUserId = await getAuthUserId(request);
    if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const url = new URL(request.url);
    const watcherId = url.searchParams.get('watcherId');

    if (!watcherId) {
      return NextResponse.json({ error: 'watcherId parameter is required' }, { status: 400, headers: CORS_HEADERS });
    }

    await prisma.watcher.deleteMany({
      where: {
        targetId: currentUserId,
        watcherId
      }
    });

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Delete watcher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
