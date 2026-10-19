import React, { useState } from 'react';
import { X, User, Lock, Sparkles, LogIn, UserPlus, LogOut, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { ApiService, AuthUser } from '../services/apiService';
import { StorageService } from '../services/storageService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUserChanged: (user: AuthUser | null) => void;
  onViewProfile?: (userId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onViewProfile
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === 'login') {
      const res = await ApiService.login(username.trim(), password);
      setLoading(false);
      if (res.success && res.user) {
        onUserChanged(res.user);
        setSuccessMsg(`Welcome back, ${res.user.displayName || res.user.username}! Profile synchronized.`);
        setTimeout(() => onClose(), 1200);
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } else {
      const res = await ApiService.register(username.trim(), password, displayName.trim());
      setLoading(false);
      if (res.success && res.user) {
        onUserChanged(res.user);
        setSuccessMsg('Account created & synced with StudyForge database!');
        setTimeout(() => onClose(), 1200);
      } else {
        setError(res.error || 'Failed to create account');
      }
    }
  };

  const handleLogout = () => {
    StorageService.clearAuthUser();
    onUserChanged(null);
    setSuccessMsg('Logged out successfully.');
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Profile & Logout View */
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              {(currentUser.displayName || currentUser.username).slice(0, 1).toUpperCase()}
            </div>

            <div>
              <h2 className="text-xl font-black">{currentUser.displayName || currentUser.username}</h2>
              <p className="text-xs text-slate-400 font-mono">@{currentUser.username}</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 flex items-center gap-2 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                <span className="font-bold block">Connected to Live Database</span>
                Your streaks, XP, and study groups are in sync.
              </div>
            </div>

            {successMsg && (
              <p className="text-xs text-emerald-500 font-semibold">{successMsg}</p>
            )}

            {error && (
              <p className="text-xs text-rose-500 font-semibold">{error}</p>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onViewProfile?.(currentUser.id);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>View My Study Profile & Logs</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError(null);
                const ok = await ApiService.syncWithCloud();
                setLoading(false);
                if (ok) {
                  onUserChanged(currentUser);
                  setSuccessMsg('Synchronized latest data from site database!');
                } else {
                  setError('Failed to sync. Check network connection.');
                }
              }}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Syncing...' : 'Sync Now with Live Database'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        ) : (
          /* Login / Register View */
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CivilsPath & StudyForge Cloud</span>
              </div>
              <h2 className="text-xl font-black mt-2">
                {mode === 'login' ? 'Sign In to Your Account' : 'Create Student Profile'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync your study streak, XP, groups, and answer reviews with the live database.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className={`py-1.5 rounded-lg transition-colors ${mode === 'login' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className={`py-1.5 rounded-lg transition-colors ${mode === 'register' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Full / Display Name
                  </label>
                  <div className="relative mt-1">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abhishek Thakur"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-hidden focus:border-rose-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Username
                </label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-hidden focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-hidden focus:border-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Connecting to database...</span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Synced Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
