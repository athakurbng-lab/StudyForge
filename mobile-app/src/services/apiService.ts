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
      
      // Flat 1 hour (60 min) for sessions without explicit hour/duration data
      const durationMinutes = (typeof s.durationMinutes === 'number' && s.durationMinutes > 0 && s.durationMinutes <= 480)
        ? s.durationMinutes
        : 60;

      // Authentic mood: only retain if genuine rating exists, do not fabricate
      const genuineMood = (s.mood && ['focused', 'neutral', 'distracted'].includes(s.mood)) ? s.mood : undefined;

      return {
        id: s.id || `cloud-${Date.now()}`,
        exam: 'upsc',
        moduleId: 'cloud_sync',
        moduleName: s.title || 'Study Sprint',
        topicName: s.tags?.[0] || undefined,
        startTime: timeStr,
        endTime: timeStr,
        durationMinutes,
        xpEarned: s.xpAwarded || 0,
        mood: genuineMood,
        notes: s.rawText || '',
        aiFeedback: s.aiBreakdown || '',
        date: dateStr,
        category: s.tags?.[0] || 'Core Subject'
      };
    });
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

      // Sync site sessions into device storage if available
      if (Array.isArray(data.user.sessions) && data.user.sessions.length > 0) {
        const mapped = this.mapCloudSessions(data.user.sessions);
        StorageService.saveSessions(mapped);
      }

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
          const mapped = this.mapCloudSessions(data.sessions);
          if (mapped.length > 0) {
            StorageService.saveSessions(mapped);
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
          isShared: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session?.id) {
          StorageService.updateSessionCloudId(session.id, data.session.id);
          return data.session.id;
        }
      }
    } catch (err) {
      console.warn('Session cloud upload failed (saved locally):', err);
    }
    return null;
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
  }
};
