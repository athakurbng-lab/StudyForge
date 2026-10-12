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

export const ApiService = {
  // Map site study sessions to mobile format
  mapCloudSessions(rawSessions: any[]): StudySession[] {
    if (!Array.isArray(rawSessions)) return [];
    return rawSessions.map((s: any) => {
      const createdDate = s.createdAt ? new Date(s.createdAt) : new Date();
      const dateStr = createdDate.toISOString().split('T')[0];
      const timeStr = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        id: s.id || `cloud-${Date.now()}`,
        exam: 'upsc',
        moduleId: 'cloud_sync',
        moduleName: s.title || 'Study Sprint',
        topicName: s.tags?.[0] || undefined,
        startTime: timeStr,
        endTime: timeStr,
        durationMinutes: 30,
        xpEarned: s.xpAwarded || 0,
        mood: 'focused',
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

  // Asynchronously upload a completed mobile session to the live website database
  async syncSessionToCloud(session: StudySession): Promise<void> {
    const token = StorageService.getAuthToken();
    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/sessions`, {
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
    } catch (err) {
      console.warn('Session cloud upload failed (saved locally):', err);
    }
  },

  async getGroups(): Promise<GroupItem[]> {
    try {
      const token = StorageService.getAuthToken();
      const user = StorageService.getAuthUser();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = user?.id ? `${API_BASE}/api/groups?userId=${user.id}` : `${API_BASE}/api/groups`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.groups && Array.isArray(data.groups)) {
          return data.groups.map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description || '',
            inviteCode: g.inviteCode || '',
            memberCount: g.memberCount ?? (g._count?.members || g.members?.length || 1),
            isPrivate: g.isPrivate || false,
            isMember: g.isMember || false,
            role: g.role || null
          }));
        }
      }
    } catch (err) {
      console.warn('Live groups fetch fallback:', err);
    }

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
  }
};
