import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import Link from 'next/link';

import { Anvil } from 'lucide-react';

import { Navigation } from './Navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get('token')?.value;
  if (!token) {
    redirect('/login');
  }

  const payload = await verifyAuthToken(token);
  if (!payload || !payload.userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { displayName: true, username: true, streak: true, totalXP: true, dailyXpGoal: true }
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navigation 
        userXp={user.totalXP} 
        userStreak={user.streak} 
        userName={user.displayName || user.username}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
