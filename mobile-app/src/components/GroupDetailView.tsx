import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Trophy, 
  MessageSquare, 
  Users, 
  Flame, 
  Shield, 
  Send, 
  RefreshCw, 
  Sparkles 
} from 'lucide-react';
import { 
  ApiService, 
  GroupDetailItem, 
  GroupChatMessage, 
  AuthUser 
} from '../services/apiService';

interface GroupDetailViewProps {
  groupId: string;
  currentUser: AuthUser | null;
  onBack: () => void;
  onOpenAuth: () => void;
}

export const GroupDetailView: React.FC<GroupDetailViewProps> = ({
  groupId,
  currentUser,
  onBack,
  onOpenAuth
}) => {
  const [group, setGroup] = useState<GroupDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('all-time');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'chat'>('leaderboard');
  
  // Chat state
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [groupId, timeframe]);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChat();
    }
  }, [groupId, activeTab]);

  const fetchDetail = async () => {
    setLoading(true);
    const data = await ApiService.getGroupDetail(groupId, timeframe);
    setGroup(data);
    setLoading(false);
  };

  const fetchChat = async () => {
    setLoadingChat(true);
    const msgs = await ApiService.getGroupChat(groupId);
    setMessages(msgs);
    setLoadingChat(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoin = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!group) return;

    const res = await ApiService.joinGroupByCode(group.inviteCode);
    setActionMsg(res.message);
    if (res.success) {
      await fetchDetail();
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setSendingMsg(true);
    const res = await ApiService.sendGroupMessage(groupId, messageInput.trim());
    setSendingMsg(false);

    if (res.success && res.message) {
      setMessages(prev => [res.message!, ...prev]);
      setMessageInput('');
    } else {
      setActionMsg(res.error || 'Failed to send message');
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  if (loading && !group) {
    return (
      <div className="p-6 min-h-[calc(100vh-140px)] flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-xs font-bold">Entering study squad...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-xs text-rose-500 font-bold">Could not load group details or group is private.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
        >
          ← Return to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-140px)] transition-colors pb-safe-content">
      {/* Top Header / Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Groups</span>
        </button>

        <button
          onClick={() => {
            fetchDetail();
            if (activeTab === 'chat') fetchChat();
          }}
          className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs"
          title="Refresh squad"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
        </button>
      </div>

      {/* Group Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900/90 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-700/40 space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">{group.name}</h2>
              {group.isPrivate && (
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/20">Private</span>
              )}
            </div>
            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xs">
              {group.description || 'Consistent study squad.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/10">
              <Users className="w-3 h-3 text-indigo-300" />
              <span>{group.memberCount} Members</span>
            </span>

            {/* Invite Code Pill */}
            <button
              onClick={() => handleCopyCode(group.inviteCode)}
              className="text-[11px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-xl flex items-center gap-1 hover:bg-amber-400/30 transition-colors"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{group.inviteCode}</span>
            </button>
          </div>
        </div>

        {/* Join CTA if not member */}
        {!group.isMember && (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-[11px] text-indigo-200 font-semibold">You haven't joined this squad yet.</span>
            <button
              onClick={handleJoin}
              className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl shadow-md"
            >
              Join Squad
            </button>
          </div>
        )}
      </div>

      {actionMsg && (
        <div className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Tabs: Leaderboard vs Chat */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Squad Chat</span>
        </button>
      </div>

      {/* TAB 1: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          {/* Timeframe Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
            {(['daily', 'weekly', 'monthly', 'all-time'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tf.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Members Ranked List */}
          <div className="space-y-2">
            {group.members.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No member data available yet.</div>
            ) : (
              group.members.map((member, index) => {
                const isMe = currentUser?.id === member.userId;
                const medalBg =
                  index === 0
                    ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-400/30'
                    : index === 1
                    ? 'bg-slate-300 text-slate-900 ring-2 ring-slate-300/30'
                    : index === 2
                    ? 'bg-amber-700 text-white ring-2 ring-amber-700/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

                return (
                  <div
                    key={member.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isMe
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/80 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${medalBg}`}>
                        {index + 1}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {member.displayName}
                          </span>
                          {isMe && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-md font-bold">
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="capitalize">{member.role.toLowerCase()}</span>
                          {member.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Flame className="w-2.5 h-2.5" />
                              <span>{member.streak}d</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                        {member.timeframeXP.toLocaleString()} XP
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">{timeframe}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE CHAT */}
      {activeTab === 'chat' && (
        <div className="space-y-3">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[300px] flex flex-col justify-between space-y-3">
            {/* Messages Feed */}
            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {loadingChat ? (
                <div className="text-center py-12 text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>Loading squad discussions...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 space-y-1">
                  <MessageSquare className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">No messages in squad yet</p>
                  <p className="text-[11px]">Send a greeting or post today's study target!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = currentUser?.id === msg.userId;
                  const date = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {isMine ? 'You' : msg.user.displayName || msg.user.username}
                        </span>
                        <span>•</span>
                        <span>{date}</span>
                      </div>
                      <div
                        className={`text-xs p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                placeholder={currentUser ? "Write a message to squad..." : "Sign in to send messages..."}
                disabled={!currentUser || sendingMsg}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-indigo-500 text-slate-800 dark:text-slate-100 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!currentUser || sendingMsg || !messageInput.trim()}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
