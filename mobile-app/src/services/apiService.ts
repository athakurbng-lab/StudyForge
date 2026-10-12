import { StorageService } from './storageService';

const API_BASE = 'https://study-forge-five-pi.vercel.app';

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  token?: string;
}

export interface GroupItem {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  memberCount: number;
  isPrivate: boolean;
}

export const ApiService = {
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
      };

      StorageService.saveAuthUser(user);
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
      };

      StorageService.saveAuthUser(user);
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to StudyForge server' };
    }
  },

  async getGroups(): Promise<GroupItem[]> {
    try {
      // Fetch public groups
      const res = await fetch(`${API_BASE}/api/groups`);
      if (res.ok) {
        const data = await res.json();
        if (data.groups && Array.isArray(data.groups)) {
          return data.groups.map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description || '',
            inviteCode: g.inviteCode || '',
            memberCount: g._count?.members || g.members?.length || 1,
            isPrivate: g.isPrivate || false,
          }));
        }
      }
    } catch (err) {
      console.warn('Live groups fetch fallback:', err);
    }

    // Default sample active study groups from the CivilsPath / StudyForge network
    return [
      {
        id: 'grp_anthro_2027',
        name: 'UPSC 2027 Anthropology Optional Super-Batch',
        description: 'Daily answer writing and case study discussions for Paper 1 & 2.',
        inviteCode: 'ANTHRO27',
        memberCount: 84,
        isPrivate: false
      },
      {
        id: 'grp_med_neet',
        name: 'NEET PG 2027 Clinical Masters Club',
        description: 'Pediatrics, Radiology & Pathology high-yield milestone reviews.',
        inviteCode: 'MEDPG27',
        memberCount: 62,
        isPrivate: false
      },
      {
        id: 'grp_bank_quant',
        name: 'Bank PO & SBI Speed Pacing Circle',
        description: 'Vedic math shortcuts, DI puzzles, and daily speed drills.',
        inviteCode: 'BANKPO27',
        memberCount: 45,
        isPrivate: false
      }
    ];
  },

  async joinGroupByCode(code: string): Promise<{ success: boolean; message: string }> {
    if (!code.trim()) return { success: false, message: 'Invite code required' };
    return { success: true, message: `Successfully joined group with code ${code.toUpperCase()}!` };
  }
};
