import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/app/lib/auth';
import Link from 'next/link';

export default async function GroupsPage() {
  const token = cookies().get('token')?.value;
  const payload = await verifyAuthToken(token!);
  const userId = payload!.userId as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { group: true }
      }
    }
  });

  const memberGroupIds = user?.memberships.map(m => m.groupId) || [];

  const publicGroups = await prisma.group.findMany({
    where: { 
      isPrivate: false,
      NOT: { id: { in: memberGroupIds } }
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { members: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-syne font-bold">Study Groups</h1>
        
        <div className="flex items-center gap-4">
          <form action={async (formData) => {
            "use server";
            const code = formData.get('code') as string;
            if (!code) return;
            const t = cookies().get('token')?.value;
            const p = await verifyAuthToken(t!);
            if (p) {
              const group = await prisma.group.findUnique({ where: { inviteCode: code } });
              if (group) {
                // Check if already member
                const existing = await prisma.groupMember.findFirst({ where: { groupId: group.id, userId: p.userId as string } });
                if (!existing) {
                  await prisma.groupMember.create({
                    data: { userId: p.userId as string, groupId: group.id, role: 'MEMBER' }
                  });
                }
              }
              const { redirect } = require('next/navigation');
              if (group) redirect(`/groups/${group.id}`);
            }
          }} className="flex items-center">
            <input 
              type="text" 
              name="code"
              placeholder="Invite Code" 
              className="bg-black/20 border border-white/10 rounded-l-xl px-4 py-2 w-32 focus:outline-none focus:border-indigo-500 text-sm h-10"
            />
            <button type="submit" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-r-xl border border-white/10 border-l-0 text-sm font-bold transition-colors h-10">
              Join
            </button>
          </form>

          <Link href="/groups/create" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors h-10 flex items-center">
            + Create Group
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {user!.memberships.length === 0 ? (
          <div className="col-span-2 bg-white/5 border border-white/10 p-8 rounded-2xl text-center text-slate-400">
            <div className="text-4xl mb-4">🌍</div>
            <h2 className="text-xl font-bold text-white mb-2">You aren't in any groups yet.</h2>
            <p>Create a group to compete on leaderboards and share study sessions with friends.</p>
          </div>
        ) : (
          user!.memberships.map((membership) => (
            <Link href={`/groups/${membership.group.id}`} key={membership.group.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors block">
              <h3 className="text-xl font-bold mb-2">{membership.group.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{membership.group.description || "No description."}</p>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className={membership.role === 'ADMIN' || membership.role === 'SUPER_ADMIN' ? 'text-amber-400' : 'text-indigo-400'}>
                  Role: {membership.role}
                </span>
                <span className="text-slate-500">
                  Joined {new Date(membership.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <h2 className="text-2xl font-syne font-bold mb-6">Discover Public Groups</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {publicGroups.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/10">
            No public groups available to join right now.
          </div>
        ) : (
          publicGroups.map(group => (
            <div key={group.id} className="bg-black/20 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{group.description || "No description."}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{group._count.members} Members</span>
                <form action={async () => {
                  "use server";
                  const t = cookies().get('token')?.value;
                  const p = await verifyAuthToken(t!);
                  if (p) {
                    await prisma.groupMember.create({
                      data: { userId: p.userId as string, groupId: group.id, role: 'MEMBER' }
                    });
                    const { revalidatePath } = require('next/cache');
                    revalidatePath('/groups');
                  }
                }}>
                  <button type="submit" className="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg font-bold transition-colors">
                    Join Group
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
