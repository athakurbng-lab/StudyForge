import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GroupChat } from './GroupChat';
import { ChallengeButton } from './ChallengeButton';

export default async function GroupDetailPage({ params, searchParams }: { params: { id: string }, searchParams: { timeframe?: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) redirect('/login');
  
  const payload = await verifyAuthToken(token);
  if (!payload) redirect('/login');

  const timeframe = searchParams.timeframe || 'all-time';
  let dateFilter = undefined;
  
  const now = new Date();
  if (timeframe === 'daily') {
    now.setHours(0,0,0,0);
    dateFilter = now;
  } else if (timeframe === 'weekly') {
    now.setDate(now.getDate() - 7);
    dateFilter = now;
  } else if (timeframe === 'monthly') {
    now.setMonth(now.getMonth() - 1);
    dateFilter = now;
  }

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: {
            select: { 
              id: true, username: true, displayName: true, totalXP: true, streak: true,
              studySessions: dateFilter ? {
                where: { createdAt: { gte: dateFilter } },
                select: { xpAwarded: true }
              } : false
            }
          }
        }
      }
    }
  });

  if (group) {
    // Sort members dynamically based on timeframe XP
    group.members.forEach((m: any) => {
      if (dateFilter) {
        m.timeframeXP = m.user.studySessions.reduce((sum: number, s: any) => sum + s.xpAwarded, 0);
      } else {
        m.timeframeXP = m.user.totalXP;
      }
    });
    group.members.sort((a: any, b: any) => b.timeframeXP - a.timeframeXP);
  }

  if (!group) {
    return <div className="text-center p-12 text-slate-400">Group not found.</div>;
  }

  const isMember = group.members.some(m => m.userId === payload.userId);
  if (!isMember && group.isPrivate) {
    return <div className="text-center p-12 text-slate-400">This group is private.</div>;
  }

  const currentUserRole = group.members.find(m => m.userId === payload.userId)?.role;

  const todayStr = new Date().toISOString().split('T')[0];
  const myChallenges = await prisma.scoreChallenge.findMany({
    where: { challengerId: payload.userId as string, challengeDate: todayStr, groupId: params.id },
    select: { targetUserId: true }
  });
  const challengedUserIds = myChallenges.map(c => c.targetUserId);

  const messages = await prisma.message.findMany({
    where: { groupId: params.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { username: true, displayName: true } }
    }
  });

  return (
    <div className="space-y-6 mt-4">
      <Link href="/groups" className="text-indigo-400 hover:text-indigo-300 font-medium mb-4 inline-block">
        ← Back to Groups
      </Link>

      <div className="bg-gradient-to-br from-indigo-900/40 to-cyan-900/20 border border-indigo-500/30 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">🎓</div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-syne font-bold">{group.name}</h1>
            {group.isPrivate && <span className="px-2 py-1 bg-black/40 text-xs rounded-full border border-white/10">Private</span>}
          </div>
          <p className="text-slate-300 mb-6 max-w-2xl">{group.description || "No description provided."}</p>
          
          <div className="flex gap-4">
            <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">Members</span>
              <span className="font-bold">{group.members.length}</span>
            </div>
            {(currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') && (
              <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">Invite Code</span>
                <span className="font-bold text-amber-400">{group.inviteCode}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-syne font-bold">Leaderboard</h2>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
              <Link href={`/groups/${group.id}?timeframe=daily`} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeframe === 'daily' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Daily</Link>
              <Link href={`/groups/${group.id}?timeframe=weekly`} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeframe === 'weekly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Weekly</Link>
              <Link href={`/groups/${group.id}?timeframe=monthly`} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeframe === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Monthly</Link>
              <Link href={`/groups/${group.id}?timeframe=all-time`} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeframe === 'all-time' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>All-Time</Link>
            </div>
          </div>
          
          <div className="space-y-3">
            {group.members.map((member: any, index: number) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold
                    ${index === 0 ? 'bg-amber-500 text-black' : 
                      index === 1 ? 'bg-slate-300 text-black' : 
                      index === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-slate-400'}
                  `}>
                    {index + 1}
                  </div>
                  <div>
                    <Link href={`/user/${member.userId}`} className="font-bold flex items-center gap-2 hover:text-indigo-400 transition-colors">
                      {member.user.displayName || member.user.username}
                      {member.userId === payload.userId && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">You</span>}
                    </Link>
                    <div className="text-xs text-slate-400 capitalize">{member.role.replace('_', ' ').toLowerCase()}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="font-bold text-indigo-400">{member.timeframeXP} XP</div>
                    <div className="text-xs text-amber-500">🔥 {member.user.streak} day streak</div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {member.userId !== payload.userId && timeframe === 'daily' && (
                      <ChallengeButton 
                        targetUserId={member.userId} 
                        groupId={group.id}
                        alreadyChallenged={challengedUserIds.includes(member.userId)}
                      />
                    )}
                    
                    {currentUserRole === 'SUPER_ADMIN' && member.userId !== payload.userId && (
                      <form action={async () => {
                        "use server";
                        const t = cookies().get('token')?.value;
                        const p = await verifyAuthToken(t!);
                        if (p) {
                          const newRole = member.role === 'MEMBER' ? 'ADMIN' : 'MEMBER';
                          await prisma.groupMember.update({
                            where: { id: member.id },
                            data: { role: newRole }
                          });
                          const { revalidatePath } = require('next/cache');
                          revalidatePath(`/groups/${group.id}`);
                        }
                      }}>
                        <button type="submit" className="text-xs bg-white/10 hover:bg-white/20 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                          {member.role === 'MEMBER' ? 'Make Admin' : 'Remove Admin'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <GroupChat groupId={group.id} initialMessages={messages} currentUserId={payload.userId as string} currentUserRole={currentUserRole} />
        </div>
      </div>
    </div>
  );
}
