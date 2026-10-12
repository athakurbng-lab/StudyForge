import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Lock, Unlock, Globe, Flame, Award, ShieldCheck, Clock, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { ApiService, AuthUser } from '../services/apiService';

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onOpenAuth?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  currentUser,
  onOpenAuth
}) => {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await ApiService.getUserProfile(userId);
      if (data && data.success) {
        setProfileData(data);
      } else {
        setErrorMsg('Unable to load user profile.');
      }
    } catch {
      setErrorMsg('Network error loading profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    } else {
      setProfileData(null);
      setExpandedSessionId(null);
      setActionSuccessMsg(null);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleToggleWatcher = async () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!profileData) return;
    const isCurrentlyWatcher = profileData.isMyWatcher;
    setActionLoading(true);
    setActionSuccessMsg(null);

    const success = await ApiService.toggleWatcher(
      profileData.user.id,
      isCurrentlyWatcher ? 'remove' : 'add'
    );

    if (success) {
      setProfileData({
        ...profileData,
        isMyWatcher: !isCurrentlyWatcher
      });
      setActionSuccessMsg(
        !isCurrentlyWatcher
          ? `Added ${profileData.user.displayName || profileData.user.username} as your Watcher. They can now view all your study sessions.`
          : `Removed Watcher access for ${profileData.user.displayName || profileData.user.username}.`
      );
    } else {
      setErrorMsg('Failed to update watcher status.');
    }
    setActionLoading(false);
  };

  const handleRequestAccess = async (sessionId: string) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setActionLoading(true);
    setActionSuccessMsg(null);

    const res = await ApiService.requestSessionAccess(sessionId);
    if (res.success) {
      setActionSuccessMsg('Access request sent to user.');
      // Update local state to reflect PENDING status
      if (profileData && Array.isArray(profileData.sessions)) {
        const updated = profileData.sessions.map((s: any) =>
          s.id === sessionId ? { ...s, requestStatus: 'PENDING' } : s
        );
        setProfileData({ ...profileData, sessions: updated });
      }
    } else {
      setErrorMsg(res.error || 'Failed to request access.');
    }
    setActionLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Friend & Study Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading profile & study sessions...</p>
            </div>
          ) : errorMsg && !profileData ? (
            <div className="py-12 text-center text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl">
              {errorMsg}
            </div>
          ) : profileData ? (
            <>
              {/* User Hero Banner */}
              <div className="bg-gradient-to-br from-indigo-900/30 via-slate-900/20 to-purple-900/30 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center text-2xl font-black text-white shadow-md">
                  {(profileData.user.displayName || profileData.user.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 truncate">
                    {profileData.user.displayName || profileData.user.username}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{profileData.user.username}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{profileData.user.streak}d Streak</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-full">
                      <Award className="w-3 h-3 text-indigo-500" />
                      <span>{profileData.user.totalXP.toLocaleString()} XP</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Watcher Relationship Card */}
              {!profileData.isMe && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                        Watcher Privilege
                      </span>
                    </div>

                    <button
                      onClick={handleToggleWatcher}
                      disabled={actionLoading}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                        profileData.isMyWatcher
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      }`}
                    >
                      {profileData.isMyWatcher ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Remove Watcher</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Add as Watcher</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {profileData.isMyWatcher
                      ? `🔓 ${profileData.user.displayName || profileData.user.username} is currently your Watcher. They have full access to view your private study logs.`
                      : `🔒 Grant ${profileData.user.displayName || profileData.user.username} blanket permission to inspect your private study logs, feedback, and notes.`}
                  </p>

                  {profileData.amIWatching && (
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>You are their Watcher: You have blanket access to all their study sessions!</span>
                    </div>
                  )}

                  {actionSuccessMsg && (
                    <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg">
                      {actionSuccessMsg}
                    </div>
                  )}
                </div>
              )}

              {/* Recent Study Sessions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Recent Study Sessions</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {profileData.sessions.length} recorded
                  </span>
                </div>

                {profileData.sessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    No sessions logged yet by this user.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profileData.sessions.map((session: any) => {
                      const isExpanded = expandedSessionId === session.id;
                      const hasAccess = session.hasAccess;

                      return (
                        <div
                          key={session.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-2xs space-y-2 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {session.title || 'Study Session'}
                                </span>

                                {/* Privacy Badges */}
                                {session.isShared ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 px-1.5 py-0.2 rounded-md">
                                    <Globe className="w-2.5 h-2.5" />
                                    <span>Public</span>
                                  </span>
                                ) : hasAccess ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-1.5 py-0.2 rounded-md">
                                    <Unlock className="w-2.5 h-2.5" />
                                    <span>Granted 🔓</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded-md">
                                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                                    <span>Private</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                </span>
                                {session.tags && session.tags.length > 0 && (
                                  <span>• {session.tags.join(', ')}</span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                +{session.xpAwarded} XP
                              </span>
                            </div>
                          </div>

                          {/* Detail or Request Action */}
                          {hasAccess ? (
                            <div>
                              <button
                                onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                <span>{isExpanded ? 'Hide Details' : 'View Notes & AI Feedback →'}</span>
                              </button>

                              {isExpanded && (
                                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
                                  {session.rawText && (
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Study Notes</span>
                                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                        {session.rawText}
                                      </p>
                                    </div>
                                  )}

                                  {session.aiBreakdown && (
                                    <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                                      <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-1">AI Breakdown</span>
                                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                        {session.aiBreakdown}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                              <span className="text-slate-400">
                                Notes & feedback hidden
                              </span>

                              {session.requestStatus === 'PENDING' ? (
                                <span className="font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md text-[10px]">
                                  Request Pending...
                                </span>
                              ) : session.requestStatus === 'REJECTED' ? (
                                <span className="font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md text-[10px]">
                                  Access Denied
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRequestAccess(session.id)}
                                  disabled={actionLoading}
                                  className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900 active:scale-95 transition-all"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Request Access</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
