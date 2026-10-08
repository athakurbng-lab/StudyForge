import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/app/dashboard/Navigation';

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) redirect('/login');
  
  const payload = await verifyAuthToken(token);
  if (!payload) redirect('/login');

  const currentUser = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { displayName: true, username: true, streak: true, totalXP: true, dailyXpGoal: true }
  });

  const targetUser = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      studySessions: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  const isMe = payload.userId === targetUser?.id;

  let approvedSessionIds: string[] = [];
  let isMyWatcher = false;
  let amIWatching = false;

  if (targetUser && !isMe) {
    const accessReqs = await prisma.sessionAccessRequest.findMany({
      where: {
        ownerId: targetUser.id,
        requesterId: payload.userId as string,
        status: 'APPROVED'
      }
    });
    approvedSessionIds = accessReqs.map(r => r.sessionId);

    const watcherRecord = await prisma.watcher.findUnique({
      where: {
        watcherId_targetId: {
          watcherId: targetUser.id,
          targetId: payload.userId as string
        }
      }
    });
    if (watcherRecord) isMyWatcher = true;

    const meWatchingThem = await prisma.watcher.findUnique({
      where: {
        watcherId_targetId: {
          watcherId: payload.userId as string,
          targetId: targetUser.id
        }
      }
    });
    if (meWatchingThem) amIWatching = true;
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navigation userXp={currentUser!.totalXP} userStreak={currentUser!.streak} userName={currentUser!.displayName || currentUser!.username} />
        <div className="text-center p-12 text-slate-400">User not found.</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navigation userXp={currentUser!.totalXP} userStreak={currentUser!.streak} userName={currentUser!.displayName || currentUser!.username} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/30 rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white border-4 border-indigo-400 shadow-xl">
              {(targetUser.displayName || targetUser.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-syne font-bold">{targetUser.displayName || targetUser.username}</h1>
              <p className="text-slate-400">@{targetUser.username}</p>
              <div className="flex gap-4 mt-4">
                <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-sm font-bold border border-amber-500/30">🔥 {targetUser.streak} Day Streak</span>
                <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm font-bold border border-indigo-500/30">⚡ {targetUser.totalXP} Total XP</span>
              </div>
            </div>
          </div>

          {!isMe && (
            <div className="flex flex-col items-end gap-2">
              {isMyWatcher ? (
                <form action={async () => {
                  "use server";
                  const { verifyAuthToken } = require('@/app/lib/auth');
                  const { cookies } = require('next/headers');
                  const p = await verifyAuthToken(cookies().get('token')?.value!);
                  if (p) {
                    await prisma.watcher.deleteMany({
                      where: { targetId: p.userId as string, watcherId: targetUser.id }
                    });
                    const { revalidatePath } = require('next/cache');
                    revalidatePath(`/user/${targetUser.id}`);
                  }
                }}>
                  <button className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    Remove Watcher
                  </button>
                </form>
              ) : (
                <form action={async () => {
                  "use server";
                  const { verifyAuthToken } = require('@/app/lib/auth');
                  const { cookies } = require('next/headers');
                  const p = await verifyAuthToken(cookies().get('token')?.value!);
                  if (p) {
                    await prisma.watcher.create({
                      data: { targetId: p.userId as string, watcherId: targetUser.id }
                    });
                    const { revalidatePath } = require('next/cache');
                    revalidatePath(`/user/${targetUser.id}`);
                  }
                }}>
                  <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg">
                    Add as Watcher
                  </button>
                </form>
              )}
              <p className="text-[10px] text-slate-500 max-w-[200px] text-right">
                {isMyWatcher ? "They can see all your private sessions." : "Grant them access to see all your private sessions."}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-syne font-bold mb-6">Recent Sessions</h2>
          
          <div className="space-y-4">
            {targetUser.studySessions.length === 0 ? (
              <div className="text-center text-slate-500 py-8">This user hasn't logged any sessions yet.</div>
            ) : (
              targetUser.studySessions.map(session => {
                const isGranted = amIWatching || approvedSessionIds.includes(session.id);
                return (
                  <Link href={`/sessions/${session.id}`} key={session.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:bg-white/5 hover:border-indigo-500/50 transition-all group block">
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <h3 className="font-bold group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                          {session.title}
                          {!session.isShared && !isMe && !isGranted && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Private</span>}
                          {!session.isShared && !isMe && isGranted && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Granted 🔓</span>}
                          {session.isShared && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Public</span>}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">{new Date(session.createdAt).toLocaleDateString()} • {session.tags.join(', ')}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-indigo-400">+{session.xpAwarded} XP</div>
                        <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
