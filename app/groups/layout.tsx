import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import { Navigation } from '@/app/dashboard/Navigation';
import { evaluateLazyStreak } from '@/app/lib/streak';

export default async function GroupsLayout({
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

  await evaluateLazyStreak(payload.userId as string);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { displayName: true, username: true, streak: true, totalXP: true }
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
