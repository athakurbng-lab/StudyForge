import React, { useState, useEffect } from 'react';
import { Users, Plus, Key, Trophy, MessageSquare, Shield, Check, Sparkles } from 'lucide-react';
import { ApiService, GroupItem, AuthUser } from '../services/apiService';

interface GroupsViewProps {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  currentUser,
  onOpenAuth
}) => {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Selected Group details view
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const list = await ApiService.getGroups();
    setGroups(list);
    setLoading(false);
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    const res = await ApiService.joinGroupByCode(inviteCodeInput.trim());
    setJoinMsg(res.message);
    setInviteCodeInput('');
    setTimeout(() => setJoinMsg(null), 3000);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const created: GroupItem = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Study group for consistent prep.',
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      memberCount: 1,
      isPrivate: false
    };

    setGroups([created, ...groups]);
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateModal(false);
    setSelectedGroup(created);
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-140px)] transition-colors pb-safe-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>Study Groups & Leaderboards</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Collaborate, compete on group leaderboards, and share answer writing notes.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Group</span>
        </button>
      </div>

      {/* Sync Banner if not logged in */}
      {!currentUser && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-xs text-indigo-800 dark:text-indigo-300 font-semibold truncate">
              Sign in to sync your groups across phone and desktop
            </span>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-lg shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Join via Invite Code Bar */}
      <form onSubmit={handleJoinByCode} className="flex gap-2">
        <div className="relative flex-1">
          <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Enter Group Invite Code (e.g. ANTHRO27)"
            value={inviteCodeInput}
            onChange={(e) => setInviteCodeInput(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-hidden focus:border-indigo-500 text-slate-800 dark:text-slate-100 uppercase font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-800 shrink-0"
        >
          Join
        </button>
      </form>

      {joinMsg && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          <span>{joinMsg}</span>
        </div>
      )}

      {/* Group List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading active study groups...</div>
        ) : (
          groups.map((group) => {
            const isSelected = selectedGroup?.id === group.id;

            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(isSelected ? null : group)}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-3.5 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {group.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {group.inviteCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{group.memberCount}</span>
                  </span>
                </div>

                {/* Expanded Group Drawer: Leaderboard & Chat Preview */}
                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                          <Trophy className="w-4 h-4" />
                          <span>Group Rank</span>
                        </div>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100">#1 Top Batch</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
                          <Shield className="w-4 h-4" />
                          <span>Batch Milestone</span>
                        </div>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100">84% On Track</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Group Discussion Feed</span>
                        </span>
                        <span className="text-[10px] text-emerald-500">Active</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">
                        "Today's topic target: Anthropological theories of religion (Durkheim vs Malinowski) + 2 answers submitted!"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-black">Create Study Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPSC Mains Anthropology 2027"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Description / Focus</label>
                <textarea
                  rows={2}
                  placeholder="Daily target goals, PYQs, and answer review schedule."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 outline-hidden resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
