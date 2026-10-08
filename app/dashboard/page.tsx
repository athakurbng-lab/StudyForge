import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/app/lib/auth';
import Link from 'next/link';
import { DashboardChart } from './DashboardChart';

export default async function DashboardPage() {
  const token = cookies().get('token')?.value;
  const payload = await verifyAuthToken(token!);
  const userId = payload!.userId as string;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studySessions: {
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' }
      },
      sessionAccessGrants: {
        where: { status: 'PENDING' },
        include: { 
          requester: { select: { username: true, displayName: true } },
          session: { select: { title: true } }
        }
      }
    }
  });

  const recentSessions = user!.studySessions.slice(0, 5);

  const todayStr = new Date().toISOString().split('T')[0];
  const quote = await prisma.inspirationQuote.findUnique({
    where: { dailyDate: todayStr }
  }) || { quote: "Excellence is not an act, but a habit.", author: "Aristotle", category: "🔥 Motivation", whyItMatters: "Daily consistent effort trumps cramming." };

  // Calculate today's XP
  const todaySessions = user!.studySessions.filter(s => s.createdAt.toISOString().startsWith(todayStr));
  const todayXp = todaySessions.reduce((acc, s) => acc + s.xpAwarded, 0);
  const progress = Math.min(100, Math.round((todayXp / user!.dailyXpGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome & Goal Progress */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h1 className="text-2xl font-syne font-bold mb-2">Welcome back, {user!.displayName || user!.username}!</h1>
          <p className="text-slate-400 text-sm">Keep up the great work. You're doing amazing.</p>
        </div>
        
        <div className="w-full md:w-1/3 bg-black/20 rounded-xl p-4 border border-white/5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Daily Goal</span>
            <span className="font-bold text-indigo-400">{todayXp} / {user!.dailyXpGoal} XP</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Daily Inspiration */}
      <section className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">✨</div>
        <div className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full mb-4">
          {quote.category || 'Daily Quote'}
        </div>
        <blockquote className="text-xl font-medium mb-3 italic">"{quote.quote}"</blockquote>
        <div className="text-sm text-slate-400 mb-4">— {quote.author}</div>
        <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-sm text-slate-300 leading-relaxed">
          <strong className="text-white block mb-1">Why it matters:</strong>
          {quote.whyItMatters}
        </div>
      </section>

      {/* Inbox */}
      {user!.sessionAccessGrants.length > 0 && (
        <section className="bg-white/5 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
          <h2 className="text-xl font-syne font-bold mb-4 flex items-center gap-2">
            <span className="text-amber-500">📬</span> Inbox ({user!.sessionAccessGrants.length})
          </h2>
          <div className="space-y-3">
            {user!.sessionAccessGrants.map(req => (
              <div key={req.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold">{req.requester.displayName || req.requester.username} requested access</div>
                  <div className="text-sm text-slate-400">to your session: <span className="text-indigo-400">{req.session.title}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={async () => {
                    "use server";
                    const { verifyAuthToken } = require('@/app/lib/auth');
                    const { cookies } = require('next/headers');
                    const prisma = require('@/app/lib/prisma').default;
                    const p = await verifyAuthToken(cookies().get('token')?.value!);
                    if (p) {
                      await prisma.sessionAccessRequest.update({ where: { id: req.id }, data: { status: 'APPROVED' }});
                      const { revalidatePath } = require('next/cache'); revalidatePath('/dashboard');
                    }
                  }}>
                    <button className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/50 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">Approve</button>
                  </form>
                  <form action={async () => {
                    "use server";
                    const { verifyAuthToken } = require('@/app/lib/auth');
                    const { cookies } = require('next/headers');
                    const prisma = require('@/app/lib/prisma').default;
                    const p = await verifyAuthToken(cookies().get('token')?.value!);
                    if (p) {
                      await prisma.sessionAccessRequest.update({ where: { id: req.id }, data: { status: 'REJECTED' }});
                      const { revalidatePath } = require('next/cache'); revalidatePath('/dashboard');
                    }
                  }}>
                    <button className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/50 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">Reject</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 30-Day Activity Graph */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-syne font-bold mb-2">Activity (Last 30 Days)</h2>
        <DashboardChart sessions={user!.studySessions} />
      </section>

      {/* Recent Sessions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-syne font-bold">Recent Sessions</h2>
          <Link href="/sessions" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-4 py-2 rounded-lg transition-colors">
            + Log Session
          </Link>
        </div>

        <div className="space-y-4">
          {recentSessions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-slate-400">
              No sessions yet. Time to get to work!
            </div>
          ) : (
            recentSessions.map(session => (
              <Link href={`/sessions/${session.id}`} key={session.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-pointer block group">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-semibold group-hover:text-indigo-300 transition-colors">{session.title || 'Study Session'}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(session.createdAt).toLocaleDateString()} • {session.tags.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold border
                      ${session.xpAwarded >= 76 ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 
                        session.xpAwarded >= 51 ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
                        session.xpAwarded >= 25 ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 
                        'bg-slate-500/20 text-slate-300 border-slate-500/50'}
                    `}>
                      +{session.xpAwarded} XP
                    </div>
                    <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
