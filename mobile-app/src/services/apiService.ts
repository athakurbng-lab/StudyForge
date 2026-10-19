import { StorageService, StudySession } from './storageService';

const API_BASE = 'https://study-forge-five-pi.vercel.app';

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  token?: string;
  totalXP?: number;
  streak?: number;
  freezeTokens?: number;
  dailyXpGoal?: number;
}

export interface GroupItem {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  memberCount: number;
  isPrivate: boolean;
  isMember?: boolean;
  role?: string | null;
}

export interface GroupMemberItem {
  id: string;
  userId: string;
  role: string;
  displayName: string;
  username: string;
  totalXP: number;
  streak: number;
  timeframeXP: number;
  joinedAt?: string;
}

export interface GroupDetailItem extends GroupItem {
  members: GroupMemberItem[];
  myRole?: string | null;
  timeframe?: string;
  challengedUserIds?: string[];
}

export interface GroupChatMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    displayName?: string;
  };
}

export const ApiService = {
  // Map site study sessions to mobile format
  mapCloudSessions(rawSessions: any[]): StudySession[] {
    if (!Array.isArray(rawSessions)) return [];
    return rawSessions.map((s: any) => {
      const createdDate = s.createdAt ? new Date(s.createdAt) : new Date();
      const dateStr = createdDate.toISOString().split('T')[0];
      const timeStr = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Extract genuine duration from cloud session (up to 12 hours)
      const durationMinutes = (typeof s.durationMinutes === 'number' && s.durationMinutes > 0 && s.durationMinutes <= 720)
        ? s.durationMinutes
        : 60;

      // Authentic mood: only retain if genuine rating exists, do not fabricate
      const genuineMood = (s.mood && ['focused', 'neutral', 'distracted'].includes(s.mood)) ? s.mood : undefined;

      return {
        id: s.id || `cloud-${Date.now()}`,
        cloudId: s.id,
        exam: 'upsc',
        moduleId: 'cloud_sync',
        moduleName: s.title || 'Study Sprint',
        topicName: s.tags?.[0] || undefined,
        startTime: s.startTime || timeStr,
        endTime: s.endTime || timeStr,
        durationMinutes,
        xpEarned: s.xpAwarded || 0,
        mood: genuineMood,
        notes: s.rawText || '',
        aiFeedback: s.aiBreakdown || '',
        date: dateStr,
        category: s.tags?.[0] || 'Core Subject',
        isShared: Boolean(s.isShared),
        // 10-Criteria Evaluation Fields
        evalProductivity: s.evalProductivity ?? undefined,
        evalDifficulty: s.evalDifficulty ?? undefined,
        evalAccuracy: s.evalAccuracy ?? undefined,
        evalDepth: s.evalDepth ?? undefined,
        evalMastery: s.evalMastery ?? undefined,
        evalApplication: s.evalApplication ?? undefined,
        evalOutputQuality: s.evalOutputQuality ?? undefined,
        evalProblemSolving: s.evalProblemSolving ?? undefined,
        evalIndependence: s.evalIndependence ?? undefined,
        evalGoalRelevance: s.evalGoalRelevance ?? undefined,
        totalEvalMarks: s.totalEvalMarks ?? undefined,
        evaluationMode: s.evaluationMode ?? undefined,
      };
    });
  },

  // Non-destructive reconciliation between local on-device sessions and cloud records
  reconcileSessions(localSessions: StudySession[], cloudRaw: any[]): StudySession[] {
    const mappedCloud = this.mapCloudSessions(cloudRaw);
    if (!localSessions || localSessions.length === 0) return mappedCloud;

    // Track which local sessions were matched to a cloud session
    const matchedLocalIds = new Set<string>();

    const mergedCloud = mappedCloud.map(cs => {
      // Find matching local session by cloudId, id, or date + notes + xp
      const localMatch = localSessions.find(ls => 
        (ls.cloudId && ls.cloudId === cs.id) ||
        ls.id === cs.id ||
        (ls.date === cs.date && ls.xpEarned === cs.xpEarned && (ls.notes === cs.notes || (ls.notes && cs.notes && ls.notes.slice(0, 30) === cs.notes.slice(0, 30))))
      );

      if (localMatch) {
        matchedLocalIds.add(localMatch.id);
        
        // Critical Fix for Rohit's Timer Bug:
        // If the local session has a genuine duration (>0) and the cloud session only has default 60 (or missing)
        // while local is not 60, NEVER clobber the user's logged duration!
        const resolvedDuration = (localMatch.durationMinutes > 0 && (cs.durationMinutes === 60 || !cs.durationMinutes) && localMatch.durationMinutes !== 60)
          ? localMatch.durationMinutes
          : (cs.durationMinutes || localMatch.durationMinutes || 60);

        return {
          ...cs,
          id: localMatch.id, // keep local ID stable
          cloudId: cs.id,
          durationMinutes: resolvedDuration,
          startTime: localMatch.startTime || cs.startTime,
          endTime: localMatch.endTime || cs.endTime,
          moduleId: localMatch.moduleId !== 'cloud_sync' ? localMatch.moduleId : cs.moduleId,
          moduleName: localMatch.moduleName !== 'Study Sprint' ? localMatch.moduleName : cs.moduleName,
          topicName: localMatch.topicName || cs.topicName,
          exam: localMatch.exam || cs.exam,
          mood: localMatch.mood || cs.mood,
          category: localMatch.category || cs.category,
          // Retain evaluation scores
          evalProductivity: localMatch.evalProductivity || cs.evalProductivity,
          evalDifficulty: localMatch.evalDifficulty || cs.evalDifficulty,
          evalAccuracy: localMatch.evalAccuracy || cs.evalAccuracy,
          evalDepth: localMatch.evalDepth || cs.evalDepth,
          evalMastery: localMatch.evalMastery || cs.evalMastery,
          evalApplication: localMatch.evalApplication || cs.evalApplication,
          evalOutputQuality: localMatch.evalOutputQuality || cs.evalOutputQuality,
          evalProblemSolving: localMatch.evalProblemSolving || cs.evalProblemSolving,
          evalIndependence: localMatch.evalIndependence || cs.evalIndependence,
          evalGoalRelevance: localMatch.evalGoalRelevance || cs.evalGoalRelevance,
          totalEvalMarks: localMatch.totalEvalMarks || cs.totalEvalMarks,
          evaluationMode: localMatch.evaluationMode || cs.evaluationMode,
        };
      }

      return cs;
    });

    // Add any unsynced or local-only sessions that don't exist on the cloud yet
    const localOnly = localSessions.filter(ls => !matchedLocalIds.has(ls.id) && !ls.cloudId);

    // Combine and sort by date descending
    const combined = [...localOnly, ...mergedCloud];
    combined.sort((a, b) => {
      const dateCmp = (b.date || '').localeCompare(a.date || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.startTime || '').localeCompare(a.startTime || '');
    });

    return combined;
  },

  async login(username: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed. Check credentials.' };
      }

      const user: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        displayName: data.user.displayName,
        token: data.token,
        totalXP: data.user.totalXP,
        streak: data.user.streak,
        freezeTokens: data.user.freezeTokens,
      };

      StorageService.saveAuthUser(user);
      if (data.token) {
        StorageService.saveAuthToken(data.token);
      }

      // Sync site stats into device storage
      if (typeof data.user.totalXP === 'number') {
        StorageService.setTotalXp(data.user.totalXP);
      }
      if (typeof data.user.streak === 'number') {
        StorageService.setStreak(data.user.streak);
      }
      if (typeof data.user.freezeTokens === 'number') {
        StorageService.setFreezeTokens(data.user.freezeTokens);
      }
      if (typeof data.user.dailyXpGoal === 'number') {
        StorageService.setDailyXpGoal(data.user.dailyXpGoal);
      }

      // Sync site sessions into device storage using non-destructive reconciliation
      const existingSessions = StorageService.getSessions();
      if (Array.isArray(data.user.sessions)) {
        const reconciled = this.reconcileSessions(existingSessions, data.user.sessions);
        StorageService.saveSessions(reconciled);
      }
      this.uploadUnsyncedSessions();

      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to StudyForge server' };
    }
  },

  async register(username: string, password: string, displayName?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName: displayName || username })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      const user: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        displayName: data.user.displayName,
        token: data.token,
        totalXP: 0,
        streak: 0,
        freezeTokens: 0,
      };

      StorageService.saveAuthUser(user);
      if (data.token) {
        StorageService.saveAuthToken(data.token);
      }

      StorageService.setTotalXp(0);
      StorageService.setStreak(0);
      StorageService.setFreezeTokens(0);
      StorageService.saveSessions([]);

      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to StudyForge server' };
    }
  },

  // Pull latest user data & sessions from the site database
  async syncWithCloud(): Promise<boolean> {
    const user = StorageService.getAuthUser();
    const token = StorageService.getAuthToken();
    if (!user) return false;

    try {
      // 1. Upload any offline or local sessions that haven't reached the cloud yet
      await this.uploadUnsyncedSessions();

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/sessions?userId=${user.id}`, { headers });
      if (!res.ok) return false;

      const data = await res.json();
      if (data.success && data.user) {
        if (typeof data.user.totalXP === 'number') StorageService.setTotalXp(data.user.totalXP);
        if (typeof data.user.streak === 'number') StorageService.setStreak(data.user.streak);
        if (typeof data.user.freezeTokens === 'number') StorageService.setFreezeTokens(data.user.freezeTokens);
        if (typeof data.user.dailyXpGoal === 'number') StorageService.setDailyXpGoal(data.user.dailyXpGoal);
        if (Array.isArray(data.sessions)) {
          const existingSessions = StorageService.getSessions();
          const reconciled = this.reconcileSessions(existingSessions, data.sessions);
          if (reconciled.length > 0) {
            StorageService.saveSessions(reconciled);
          }
        }
        return true;
      }
    } catch (err) {
      console.warn('Background cloud sync error:', err);
    }
    return false;
  },

  // Delete a cloud session from the site database
  async deleteCloudSession(sessionId: string): Promise<boolean> {
    const token = StorageService.getAuthToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return res.ok;
    } catch (err) {
      console.warn('Delete cloud session failed:', err);
      return false;
    }
  },

  // Update daily XP goal on device and cloud
  async updateDailyGoal(goal: number): Promise<boolean> {
    StorageService.setDailyXpGoal(goal);
    const token = StorageService.getAuthToken();
    if (!token) return true; // Saved locally offline
    try {
      const res = await fetch(`${API_BASE}/api/user/goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dailyXpGoal: goal })
      });
      return res.ok;
    } catch (err) {
      console.warn('Cloud update daily goal failed:', err);
      return false;
    }
  },

  // Asynchronously upload a completed mobile session to the live website database
  async syncSessionToCloud(session: StudySession): Promise<string | null> {
    const token = StorageService.getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: session.topicName ? `${session.moduleName}: ${session.topicName}` : session.moduleName,
          rawText: session.notes || `Completed ${session.durationMinutes} min study sprint on ${session.moduleName}.`,
          tags: [session.category || 'Study', session.exam],
          isShared: Boolean(session.isShared),
          xpAwarded: session.xpEarned,
          aiBreakdown: session.aiFeedback,
          durationMinutes: session.durationMinutes,
          startTime: session.startTime,
          endTime: session.endTime,
          mood: session.mood,
          // 10-Criteria Evaluation Fields
          evalProductivity: session.evalProductivity,
          evalDifficulty: session.evalDifficulty,
          evalAccuracy: session.evalAccuracy,
          evalDepth: session.evalDepth,
          evalMastery: session.evalMastery,
          evalApplication: session.evalApplication,
          evalOutputQuality: session.evalOutputQuality,
          evalProblemSolving: session.evalProblemSolving,
          evalIndependence: session.evalIndependence,
          evalGoalRelevance: session.evalGoalRelevance,
          totalEvalMarks: session.totalEvalMarks,
          evaluationMode: session.evaluationMode
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session?.id) {
          StorageService.updateSessionCloudId(session.id, data.session.id);
          if (data.user) {
            if (typeof data.user.totalXP === 'number') StorageService.setTotalXp(data.user.totalXP);
            if (typeof data.user.streak === 'number') StorageService.setStreak(data.user.streak);
            if (typeof data.user.freezeTokens === 'number') StorageService.setFreezeTokens(data.user.freezeTokens);
          }
          return data.session.id;
        }
      }
    } catch (err) {
      console.warn('Session cloud upload failed (saved locally):', err);
    }
    return null;
  },

  // Upload any offline/local sessions that have not yet synced to the cloud database
  async uploadUnsyncedSessions(): Promise<number> {
    const token = StorageService.getAuthToken();
    if (!token) return 0;
    const unsynced = StorageService.getSessions().filter(s => !s.cloudId);
    let count = 0;
    for (const s of unsynced) {
      const cloudId = await this.syncSessionToCloud(s);
      if (cloudId) {
        count++;
      }
    }
    return count;
  },

  async getGroups(forceRefresh = false): Promise<GroupItem[]> {
    const cached = StorageService.getCachedGroups();
    const token = StorageService.getAuthToken();
    const user = StorageService.getAuthUser();

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const clientHash = !forceRefresh && cached ? cached.hash : '';
      const params = new URLSearchParams();
      if (user?.id) params.set('userId', user.id);
      if (clientHash) params.set('clientHash', clientHash);

      const url = `${API_BASE}/api/groups${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.notModified && cached) {
          return cached.groups;
        }

        if (data.groups && Array.isArray(data.groups)) {
          const mapped = data.groups.map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description || '',
            inviteCode: g.inviteCode || '',
            memberCount: g.memberCount ?? (g._count?.members || g.members?.length || 1),
            isPrivate: g.isPrivate || false,
            isMember: g.isMember || false,
            role: g.role || null
          }));

          if (data.hash) {
            StorageService.saveCachedGroups(mapped, data.hash);
          }
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Live groups fetch fallback:', err);
    }

    if (cached) return cached.groups;
    return [];
  },

  async createGroup(name: string, description: string, isPublic: boolean = true): Promise<{ success: boolean; group?: GroupItem; error?: string }> {
    const token = StorageService.getAuthToken();
    if (!token) return { success: false, error: 'Sign in required to create groups' };

    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, isPublic })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create group' };
      }
      return {
        success: true,
        group: {
          id: data.group.id,
          name: data.group.name,
          description: data.group.description || '',
          inviteCode: data.group.inviteCode || '',
          memberCount: data.group.memberCount || 1,
          isPrivate: data.group.isPrivate || false,
          isMember: true,
          role: 'SUPER_ADMIN'
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating group' };
    }
  },

  async joinGroupByCode(code: string): Promise<{ success: boolean; message: string; group?: GroupItem }> {
    if (!code.trim()) return { success: false, message: 'Invite code required' };
    const token = StorageService.getAuthToken();
    if (!token) return { success: false, message: 'Please sign in to join groups' };

    try {
      const res = await fetch(`${API_BASE}/api/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Failed to join group with this code' };
      }

      return {
        success: true,
        message: data.message || 'Successfully joined group!',
        group: data.group
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error joining group' };
    }
  },

  async getGroupDetail(groupId: string, timeframe: string = 'all-time', forceRefresh = false): Promise<GroupDetailItem | null> {
    const cached = StorageService.getCachedGroupDetail(groupId, timeframe);

    try {
      const token = StorageService.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const clientHash = !forceRefresh && cached ? cached.hash : '';
      const params = new URLSearchParams({ timeframe });
      if (clientHash) params.set('clientHash', clientHash);

      const res = await fetch(`${API_BASE}/api/groups/${groupId}?${params.toString()}`, { 
        headers,
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notModified && cached?.group) {
          return { ...cached.group, timeframe };
        }

        if (data.success && data.group) {
          const groupWithTf = {
            ...data.group,
            timeframe: data.group.timeframe || timeframe
          };
          if (data.hash) {
            StorageService.saveCachedGroupDetail(groupId, timeframe, groupWithTf, data.hash);
          }
          return groupWithTf;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch group detail:', err);
    }

    if (cached?.group) return { ...cached.group, timeframe };
    return null;
  },

  async evaluateChallenge(targetUserId: string, groupId: string): Promise<{ success: boolean; message: string; tokensRemaining?: number; error?: string }> {
    const token = StorageService.getAuthToken();
    if (!token) return { success: false, message: 'Please sign in to challenge' };

    try {
      const res = await fetch(`${API_BASE}/api/challenges/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId, groupId })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to evaluate challenge', error: data.error };
      }
      return {
        success: true,
        message: data.message || 'Challenge evaluation complete!',
        tokensRemaining: data.tokensRemaining
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error evaluating challenge', error: err.message };
    }
  },

  async getGroupChat(groupId: string, forceRefresh = false): Promise<GroupChatMessage[]> {
    const cached = StorageService.getCachedGroupChat(groupId);

    try {
      const token = StorageService.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const clientHash = !forceRefresh && cached ? cached.hash : '';
      const url = clientHash 
        ? `${API_BASE}/api/groups/${groupId}/chat?clientHash=${clientHash}`
        : `${API_BASE}/api/groups/${groupId}/chat`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.notModified && cached) {
          return cached.messages;
        }

        if (data.messages && Array.isArray(data.messages)) {
          if (data.hash) {
            StorageService.saveCachedGroupChat(groupId, data.messages, data.hash);
          }
          return data.messages;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch group chat:', err);
    }

    if (cached) return cached.messages;
    return [];
  },

  async sendGroupMessage(groupId: string, content: string): Promise<{ success: boolean; message?: GroupChatMessage; error?: string }> {
    const token = StorageService.getAuthToken();
    if (!token) return { success: false, error: 'Sign in required to post messages' };

    try {
      const res = await fetch(`${API_BASE}/api/groups/${groupId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: content.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send message' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error sending message' };
    }
  },

  // Toggle session privacy (Public <-> Private)
  async toggleSessionShare(sessionId: string, isShared?: boolean): Promise<boolean> {
    const token = StorageService.getAuthToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isShared })
      });
      return res.ok;
    } catch (err) {
      console.warn('Toggle session share failed:', err);
      return false;
    }
  },

  // Fetch another user's profile and privacy-controlled sessions
  async getUserProfile(userId: string): Promise<any> {
    const token = StorageService.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/api/user/${encodeURIComponent(userId)}`, { headers });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Fetch user profile failed:', err);
      return null;
    }
  },

  // Add or remove a watcher (granting or revoking access to your private sessions)
  async toggleWatcher(targetUserId: string, action: 'add' | 'remove'): Promise<boolean> {
    const token = StorageService.getAuthToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/api/watchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId, action })
      });
      return res.ok;
    } catch (err) {
      console.warn('Toggle watcher failed:', err);
      return false;
    }
  },

  // Add watcher by username
  async addWatcherByUsername(username: string): Promise<{ success: boolean; error?: string }> {
    const token = StorageService.getAuthToken();
    if (!token) return { success: false, error: 'Sign-in required' };
    try {
      const res = await fetch(`${API_BASE}/api/watchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, action: 'add' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to add watcher' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error adding watcher' };
    }
  },

  // Get list of watchers (watching me) and watching (I am watching)
  async getWatchers(): Promise<{ watchers: any[]; watching: any[] }> {
    const token = StorageService.getAuthToken();
    if (!token) return { watchers: [], watching: [] };
    try {
      const res = await fetch(`${API_BASE}/api/watchers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return { watchers: [], watching: [] };
      const data = await res.json();
      return { watchers: data.watchers || [], watching: data.watching || [] };
    } catch (err) {
      console.warn('Get watchers failed:', err);
      return { watchers: [], watching: [] };
    }
  },

  // Request access to another user's private session
  async requestSessionAccess(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const token = StorageService.getAuthToken();
    if (!token) return { success: false, error: 'Sign in to request access' };
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to request access' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error requesting access' };
    }
  },

  // Get incoming pending session access requests for me
  async getAccessRequests(): Promise<any[]> {
    const token = StorageService.getAuthToken();
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.requests || [];
    } catch (err) {
      console.warn('Get access requests failed:', err);
      return [];
    }
  },

  // Approve or Reject an access request
  async respondToAccessRequest(requestId: string, action: 'APPROVE' | 'REJECT'): Promise<boolean> {
    const token = StorageService.getAuthToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, action })
      });
      return res.ok;
    } catch (err) {
      console.warn('Respond to access request failed:', err);
      return false;
    }
  }
};
