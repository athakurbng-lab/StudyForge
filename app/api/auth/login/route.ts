import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuthToken } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { challengeToken: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Lazy daily token reset check
    const today = new Date().toISOString().split('T')[0];
    if (!user.challengeToken) {
      await prisma.challengeToken.create({
        data: { userId: user.id, resetDate: today, tokensRemaining: 10 }
      });
    } else if (user.challengeToken.resetDate !== today) {
      await prisma.challengeToken.update({
        where: { userId: user.id },
        data: { resetDate: today, tokensRemaining: 10 }
      });
    }

    // Lazy Quote Enrichment & Validation check could also be triggered here in the background

    const token = await createAuthToken(user.id);

    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        onboardingDone: user.onboardingDone
      }
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
