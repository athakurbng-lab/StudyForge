import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) redirect('/login');
  
  const payload = await verifyAuthToken(token);
  if (!payload) redirect('/login');

  const session = await prisma.studySession.findUnique({
    where: { id: params.id },
    include: { user: { select: { username: true, displayName: true } } }
  });

  if (!session) {
    return <div className="text-center p-12 text-slate-400">Session not found.</div>;
  }

  const isOwner = session.userId === payload.userId;
  let hasAccess = isOwner || session.isShared;

  if (!hasAccess) {
    const isWatcher = await prisma.watcher.findUnique({
      where: {
        watcherId_targetId: {
          watcherId: payload.userId as string,
          targetId: session.userId
        }
      }
    });
    if (isWatcher) hasAccess = true;
  }

  let requestStatus = null;
  if (!hasAccess) {
    const accessReq = await prisma.sessionAccessRequest.findUnique({
      where: { sessionId_requesterId: { sessionId: params.id, requesterId: payload.userId as string } }
    });
    if (accessReq) {
      requestStatus = accessReq.status;
      if (requestStatus === 'APPROVED') hasAccess = true;
    }
  }

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto space-y-6 mt-20 text-center bg-white/5 border border-white/10 p-8 rounded-2xl">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold">Private Session</h1>
        <p className="text-slate-400 mb-6">This session belongs to {session.user.displayName || session.user.username} and is private.</p>
        
        {requestStatus === 'PENDING' ? (
          <div className="px-6 py-3 bg-white/10 rounded-xl text-slate-300 font-bold inline-block">
            Request Pending...
          </div>
        ) : requestStatus === 'REJECTED' ? (
          <div className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl font-bold inline-block border border-red-500/50">
            Request Denied
          </div>
        ) : (
          <form action={async () => {
            "use server";
            const t = cookies().get('token')?.value;
            const p = await verifyAuthToken(t!);
            if (p) {
              await prisma.sessionAccessRequest.create({
                data: { sessionId: session.id, ownerId: session.userId, requesterId: p.userId as string, status: 'PENDING' }
              });
              const { revalidatePath } = require('next/cache');
              revalidatePath(`/sessions/${session.id}`);
            }
          }}>
            <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors">
              Request Access
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-8">
      <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-medium mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-syne font-bold mb-2">{session.title}</h1>
            <p className="text-slate-400">{new Date(session.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl text-lg font-bold border bg-indigo-500/20 text-indigo-400 border-indigo-500/50">
              +{session.xpAwarded} XP
            </div>
            {isOwner && (
              <form action={async () => {
                "use server";
                const t = cookies().get('token')?.value;
                const p = await verifyAuthToken(t!);
                if (p && p.userId === session.userId) {
                  await prisma.user.update({ where: { id: p.userId as string }, data: { totalXP: { decrement: session.xpAwarded } } });
                  await prisma.studySession.delete({ where: { id: session.id } });
                  const { redirect } = require('next/navigation');
                  redirect('/dashboard');
                }
              }}>
                <button type="submit" className="text-red-500 hover:text-red-400 text-sm font-bold bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30 transition-colors">
                  Delete
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {session.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300">
              {tag}
            </span>
          ))}
        </div>

        <div className="bg-black/30 p-6 rounded-xl border border-white/5 mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Log</h2>
          <p className="text-slate-200 whitespace-pre-wrap">{session.rawText}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-syne flex items-center gap-2">
            <span className="text-indigo-400">✨</span> AI Evaluation
          </h2>
          
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-xl">
            <h3 className="font-semibold text-indigo-300 mb-1">Breakdown</h3>
            <p className="text-slate-300">{session.aiBreakdown || "No breakdown available for this session."}</p>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/30 p-5 rounded-xl">
            <h3 className="font-semibold text-amber-400 mb-1">Suggestion</h3>
            <p className="text-slate-300">{session.aiSuggestion || "Keep up the good work!"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
