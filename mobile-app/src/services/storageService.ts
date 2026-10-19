import { ExamType, SubjectModule, TopicProgress, EXAMS_DATA } from '../data/exams';

export interface StudySession {
  id: string;
  cloudId?: string;
  exam: ExamType;
  moduleId: string;
  moduleName: string;
  topicId?: string;
  topicName?: string;
  startTime: string; // ISO string or e.g. "09:58 PM"
  endTime: string;   // e.g. "11:20 PM"
  durationMinutes: number;
  xpEarned: number;
  mood?: 'focused' | 'neutral' | 'distracted'; // 🤩, 🙂, 😔
  notes: string;
  aiFeedback?: string;
  date: string; // YYYY-MM-DD
  category: string;
  apiError?: string;
  usedFallback?: boolean;
  modelUsed?: string;
  isShared?: boolean;
  // 10-Criteria Personal Evaluation System (Each scored 1-10, total 10-100)
  evalProductivity?: number;       // Work volume vs personal baseline
  evalDifficulty?: number;         // Task complexity (1-2 easy, 5-6 moderate, 9-10 complex)
  evalAccuracy?: number;           // Correctness of answers/facts/calculations
  evalDepth?: number;              // Depth of exploration & conceptual understanding
  evalMastery?: number;            // Demonstrated recall and explanation without notes
  evalApplication?: number;        // Performance on unfamiliar questions/scenarios
  evalOutputQuality?: number;      // Usability and organization of notes/deliverables
  evalProblemSolving?: number;     // Effective approach to challenging parts
  evalIndependence?: number;       // Execution without assistance or prompts
  evalGoalRelevance?: number;      // Alignment with long-term exam priorities
  totalEvalMarks?: number;         // Sum of all 10 criteria (10-100)
  evaluationMode?: 'manual' | 'ai'; // 'manual' (default) or 'ai'
}

/**
 * Calculates session XP based on exact focused time and evaluation marks.
 * Formula: Focused Hours × Total Evaluation Marks (Sum of 10 criteria, 10–100)
 * Where Focused Hours = durationMinutes / 60.
 */
export function calculateSessionXP(durationMinutes: number, totalEvalMarks: number): number {
  const focusedHours = Math.max(0.01, durationMinutes / 60);
  const clampedMarks = Math.max(10, Math.min(100, totalEvalMarks));
  return Math.max(1, Math.round(focusedHours * clampedMarks));
}

export interface DayStats {
  date: string;
  dayLabel: string; // e.g. "MON 05"
  totalHours: number;
  notesOnly?: boolean;
}

export interface UserSettings {
  geminiApiKey: string;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  inactivityAlertTime: string; // "20:30"
  streakSaverEnabled: boolean;
  spacedRevisionAlertEnabled: boolean;
  appVersion: string;
  buildNumber: string;
}

export interface FreeKeyData {
  key: string;
  provider: string;
  model: string;
  endpoint?: string;
  label?: string;
  fetchedAt: number;
}

const STORAGE_KEYS = {
  ACTIVE_EXAM: 'studyforge_active_exam',
  CUSTOM_MODULES: 'studyforge_custom_modules',
  DELETED_MODULES: 'studyforge_deleted_modules',
  SESSIONS: 'studyforge_sessions',
  SETTINGS: 'studyforge_settings',
  STREAK: 'studyforge_streak',
  FREEZE_TOKENS: 'studyforge_freeze_tokens',
  TOTAL_XP: 'studyforge_total_xp',
  DAILY_XP_GOAL: 'studyforge_daily_xp_goal',
  FREE_KEY: 'studyforge_free_key',
};

// Zero pre-filled sessions: clean slate for the user
const DEFAULT_SESSIONS: StudySession[] = [];

export const StorageService = {
  // Deduplicate sessions list to prevent duplicate entries across local storage and cloud sync
  deduplicateSessions(list: StudySession[]): StudySession[] {
    if (!Array.isArray(list) || list.length <= 1) return list || [];

    const result: StudySession[] = [];
    const seenCloudIds = new Set<string>();
    const seenLocalIds = new Set<string>();
    const seenFuzzyKeys = new Set<string>();

    for (const s of list) {
      if (!s) continue;

      // 1. Direct Cloud ID match
      if (s.cloudId) {
        if (seenCloudIds.has(s.cloudId)) {
          continue;
        }
        seenCloudIds.add(s.cloudId);
      }

      // 2. Direct Local ID match
      if (s.id) {
        if (seenLocalIds.has(s.id)) {
          continue;
        }
        seenLocalIds.add(s.id);
      }

      // 3. Content-based Fuzzy Match (same date, duration, module/topic, and notes prefix)
      const normDate = s.date || '';
      const normDur = s.durationMinutes || 60;
      const normMod = (s.moduleName || s.topicName || '').trim().toLowerCase();
      const normNotes = (s.notes || '').trim().slice(0, 30).toLowerCase();
      const fuzzyKey = `${normDate}_${normDur}_${normMod}_${normNotes}`;

      if (fuzzyKey.length > 10 && seenFuzzyKeys.has(fuzzyKey)) {
        // If this duplicate session has cloudId and the kept one didn't, attach cloudId to kept session
        if (s.cloudId) {
          const existing = result.find(r => 
            `${r.date || ''}_${r.durationMinutes || 60}_${(r.moduleName || r.topicName || '').trim().toLowerCase()}_${(r.notes || '').trim().slice(0, 30).toLowerCase()}` === fuzzyKey
          );
          if (existing && !existing.cloudId) {
            existing.cloudId = s.cloudId;
          }
        }
        continue;
      }

      if (fuzzyKey.length > 10) {
        seenFuzzyKeys.add(fuzzyKey);
      }

      result.push(s);
    }

    return result;
  },

  // One-time startup sanitizer to clean mock data and deduplicate any local storage sessions
  sanitizeStorage(): void {
    const SANITIZER_KEY = 'studyforge_clean_v18';
    if (localStorage.getItem(SANITIZER_KEY) !== 'true') {
      const sessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (sessions) {
        try {
          const list = JSON.parse(sessions);
          if (Array.isArray(list)) {
            // Filter out mock sessions, normalize durations, and deduplicate
            const genuine = list
              .filter((s: any) => !/^sess-[1-9]$/.test(s.id))
              .map((s: any) => ({
                ...s,
                durationMinutes: (typeof s.durationMinutes === 'number' && s.durationMinutes > 0 && s.durationMinutes <= 480)
                  ? s.durationMinutes
                  : 60
              }));
            const deduplicated = this.deduplicateSessions(genuine);
            if (deduplicated.length === 0) {
              localStorage.removeItem(STORAGE_KEYS.SESSIONS);
              localStorage.setItem(STORAGE_KEYS.TOTAL_XP, '0');
              localStorage.setItem(STORAGE_KEYS.STREAK, '0');
              localStorage.setItem(STORAGE_KEYS.FREEZE_TOKENS, '0');
            } else {
              localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(deduplicated));
              // Calculate genuine XP
              const genuineXp = deduplicated.reduce((acc, s) => acc + (s.xpEarned || 0), 0);
              const currentXp = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_XP) || '0', 10);
              if (currentXp > genuineXp) {
                localStorage.setItem(STORAGE_KEYS.TOTAL_XP, genuineXp.toString());
              }
            }
          }
        } catch {
          localStorage.removeItem(STORAGE_KEYS.SESSIONS);
        }
      }

      const curSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!curSessions || curSessions === '[]') {
        localStorage.setItem(STORAGE_KEYS.TOTAL_XP, '0');
        localStorage.setItem(STORAGE_KEYS.STREAK, '0');
        localStorage.setItem(STORAGE_KEYS.FREEZE_TOKENS, '0');
      }

      localStorage.setItem(SANITIZER_KEY, 'true');
    }
  },

  // Active Exam
  getActiveExam(): ExamType {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_EXAM);
    return (saved as ExamType) || 'upsc';
  },

  setActiveExam(exam: ExamType): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EXAM, exam);
  },

  // Modules (Built-in + Custom - Deleted)
  getModulesForExam(exam: ExamType): SubjectModule[] {
    const baseModules = EXAMS_DATA[exam]?.modules || [];
    const customJson = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`);
    const customModules: SubjectModule[] = customJson ? JSON.parse(customJson) : [];
    
    const deletedJson = localStorage.getItem(`${STORAGE_KEYS.DELETED_MODULES}_${exam}`);
    const deletedIds: string[] = deletedJson ? JSON.parse(deletedJson) : [];

    const all = [...baseModules, ...customModules];
    return all
      .filter(m => !deletedIds.includes(m.id))
      .map(m => {
        const extraTopicsKey = `custom_topics_${exam}_${m.id}`;
        const extraTopicsJson = localStorage.getItem(extraTopicsKey);
        if (extraTopicsJson) {
          try {
            const extraTopics: TopicProgress[] = JSON.parse(extraTopicsJson);
            return { ...m, topics: [...m.topics, ...extraTopics] };
          } catch {
            return m;
          }
        }
        return m;
      });
  },

  addCustomModule(exam: ExamType, module: SubjectModule): void {
    const customJson = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`);
    const customModules: SubjectModule[] = customJson ? JSON.parse(customJson) : [];
    customModules.push(module);
    localStorage.setItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`, JSON.stringify(customModules));
  },

  addTopicToModule(exam: ExamType, moduleId: string, topic: TopicProgress): void {
    const customJson = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`);
    let customModules: SubjectModule[] = customJson ? JSON.parse(customJson) : [];
    const customMod = customModules.find(m => m.id === moduleId);
    if (customMod) {
      customMod.topics.push(topic);
      localStorage.setItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`, JSON.stringify(customModules));
      return;
    }

    const extraTopicsKey = `custom_topics_${exam}_${moduleId}`;
    const extraTopicsJson = localStorage.getItem(extraTopicsKey);
    const extraTopics: TopicProgress[] = extraTopicsJson ? JSON.parse(extraTopicsJson) : [];
    extraTopics.push(topic);
    localStorage.setItem(extraTopicsKey, JSON.stringify(extraTopics));
  },

  deleteModule(exam: ExamType, moduleId: string): void {
    // Check if it's in custom modules, remove it
    const customJson = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`);
    if (customJson) {
      let customModules: SubjectModule[] = JSON.parse(customJson);
      customModules = customModules.filter(m => m.id !== moduleId);
      localStorage.setItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`, JSON.stringify(customModules));
    }

    // Also add to deleted list to suppress default modules if user deleted a default one
    const deletedJson = localStorage.getItem(`${STORAGE_KEYS.DELETED_MODULES}_${exam}`);
    const deletedIds: string[] = deletedJson ? JSON.parse(deletedJson) : [];
    if (!deletedIds.includes(moduleId)) {
      deletedIds.push(moduleId);
      localStorage.setItem(`${STORAGE_KEYS.DELETED_MODULES}_${exam}`, JSON.stringify(deletedIds));
    }
  },

  resetModulesForExam(exam: ExamType): void {
    localStorage.removeItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`);
    localStorage.removeItem(`${STORAGE_KEYS.DELETED_MODULES}_${exam}`);
  },

  // Auth User & Token
  getAuthUser(): { id: string; username: string; displayName?: string } | null {
    const saved = localStorage.getItem('studyforge_auth_user');
    return saved ? JSON.parse(saved) : null;
  },

  saveAuthUser(user: { id: string; username: string; displayName?: string }): void {
    localStorage.setItem('studyforge_auth_user', JSON.stringify(user));
  },

  getAuthToken(): string | null {
    return localStorage.getItem('studyforge_auth_token');
  },

  saveAuthToken(token: string): void {
    localStorage.setItem('studyforge_auth_token', token);
  },

  clearAuthUser(): void {
    localStorage.removeItem('studyforge_auth_user');
    localStorage.removeItem('studyforge_auth_token');
  },

  // Sessions
  saveSessions(sessions: StudySession[]): void {
    const deduped = this.deduplicateSessions(sessions);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(deduped));
  },

  getSessions(): StudySession[] {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!saved) return [];
    try {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) {
        const genuine = list
          .filter(s => !/^sess-[1-9]$/.test(s.id))
          .map(s => ({
            ...s,
            durationMinutes: (typeof s.durationMinutes === 'number' && s.durationMinutes > 0 && s.durationMinutes <= 480)
              ? s.durationMinutes
              : 60
          }));
        return this.deduplicateSessions(genuine);
      }
      return [];
    } catch {
      return [];
    }
  },

  addSession(session: StudySession): void {
    const list = this.getSessions();
    // Guard against adding duplicates
    const isDup = list.some(s => 
      (s.cloudId && session.cloudId && s.cloudId === session.cloudId) ||
      s.id === session.id ||
      (
        s.date === session.date && 
        s.durationMinutes === session.durationMinutes &&
        (s.moduleName === session.moduleName || s.topicName === session.topicName) &&
        (s.notes && session.notes && s.notes.trim().slice(0, 30) === session.notes.trim().slice(0, 30))
      )
    );
    if (isDup) {
      console.warn('Prevented duplicate session addition:', session.id);
      return;
    }

    list.unshift(session);
    this.saveSessions(list);

    // Update total XP
    const currentXp = this.getTotalXp();
    this.setTotalXp(currentXp + session.xpEarned);
  },

  updateSessionCloudId(localId: string, cloudId: string): void {
    const list = this.getSessions();
    const target = list.find(s => s.id === localId);
    if (target) {
      target.cloudId = cloudId;
      this.saveSessions(list);
    }
  },

  toggleSessionShare(sessionId: string): StudySession | null {
    const list = this.getSessions();
    const target = list.find(s => s.id === sessionId || s.cloudId === sessionId);
    if (!target) return null;

    target.isShared = !target.isShared;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list));
    return target;
  },

  deleteSession(sessionId: string): { deleted: boolean; xpDeducted: number; cloudId?: string } {
    const list = this.getSessions();
    const target = list.find(s => s.id === sessionId || s.cloudId === sessionId);
    if (!target) return { deleted: false, xpDeducted: 0 };

    const updated = list.filter(s => s.id !== target.id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));

    const xpDeducted = target.xpEarned || 0;
    if (xpDeducted > 0) {
      const currentXp = this.getTotalXp();
      this.setTotalXp(Math.max(0, currentXp - xpDeducted));
    }
    const resolvedCloudId = target.cloudId || (!target.id.startsWith('sess-') ? target.id : undefined);
    return { deleted: true, xpDeducted, cloudId: resolvedCloudId };
  },

  getDailyXpGoal(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_XP_GOAL);
    const parsed = saved ? parseInt(saved, 10) : 50;
    return isNaN(parsed) || parsed < 10 ? 50 : parsed;
  },

  setDailyXpGoal(goal: number): void {
    const valid = Math.max(10, Math.min(1000, goal));
    localStorage.setItem(STORAGE_KEYS.DAILY_XP_GOAL, valid.toString());
  },

  // Stats & Week Strip
  getWeekStats(targetDateStr?: string): DayStats[] {
    const sessions = this.getSessions();
    const anchor = targetDateStr ? new Date(targetDateStr) : new Date();
    const day = anchor.getDay(); // 0 is Sun
    const mondayDiff = day === 0 ? -6 : 1 - day;
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() + mondayDiff);

    const days: DayStats[] = [];
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${dayNames[i]} ${d.getDate().toString().padStart(2, '0')}`;
      
      const daySessions = sessions.filter(s => s.date === dateStr);
      const totalMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

      days.push({ date: dateStr, dayLabel, totalHours });
    }

    return days;
  },

  // Gamification
  getStreak(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.STREAK);
    if (saved === '14') {
      localStorage.removeItem(STORAGE_KEYS.STREAK);
      return 0;
    }
    return saved ? parseInt(saved, 10) : 0;
  },

  setStreak(val: number): void {
    localStorage.setItem(STORAGE_KEYS.STREAK, val.toString());
  },

  getFreezeTokens(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.FREEZE_TOKENS);
    if (saved === '2') {
      localStorage.removeItem(STORAGE_KEYS.FREEZE_TOKENS);
      return 0;
    }
    return saved ? parseInt(saved, 10) : 0;
  },

  setFreezeTokens(val: number): void {
    localStorage.setItem(STORAGE_KEYS.FREEZE_TOKENS, val.toString());
  },

  getTotalXp(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.TOTAL_XP);
    if (saved === '4820') {
      localStorage.removeItem(STORAGE_KEYS.TOTAL_XP);
      return 0;
    }
    return saved ? parseInt(saved, 10) : 0;
  },

  setTotalXp(val: number): void {
    localStorage.setItem(STORAGE_KEYS.TOTAL_XP, val.toString());
  },

  // Settings
  getSettings(): UserSettings {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const defaults: UserSettings = {
      geminiApiKey: '',
      theme: 'light',
      notificationsEnabled: true,
      inactivityAlertTime: '20:30',
      streakSaverEnabled: true,
      spacedRevisionAlertEnabled: true,
      appVersion: 'v1.0.17 (Production)',
      buildNumber: '2026.10.20-v18',
    };
    if (!saved) return defaults;
    try {
      const parsed = JSON.parse(saved);
      return { 
        ...defaults, 
        ...parsed, 
        appVersion: defaults.appVersion, 
        buildNumber: defaults.buildNumber 
      };
    } catch {
      return defaults;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Cached Groups & Squads with Hash comparison
  getCachedGroups(): { groups: any[]; hash: string } | null {
    const raw = localStorage.getItem('studyforge_cached_groups');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveCachedGroups(groups: any[], hash: string): void {
    localStorage.setItem('studyforge_cached_groups', JSON.stringify({ groups, hash, cachedAt: Date.now() }));
  },

  getCachedGroupDetail(groupId: string, timeframe: string): { group: any; hash: string } | null {
    const raw = localStorage.getItem(`studyforge_group_${groupId}_${timeframe}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveCachedGroupDetail(groupId: string, timeframe: string, group: any, hash: string): void {
    localStorage.setItem(`studyforge_group_${groupId}_${timeframe}`, JSON.stringify({ group, hash, cachedAt: Date.now() }));
  },

  getCachedGroupChat(groupId: string): { messages: any[]; hash: string } | null {
    const raw = localStorage.getItem(`studyforge_chat_${groupId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveCachedGroupChat(groupId: string, messages: any[], hash: string): void {
    localStorage.setItem(`studyforge_chat_${groupId}`, JSON.stringify({ messages, hash, cachedAt: Date.now() }));
  },

  // Free API Key cached from Database
  getFreeKey(): FreeKeyData | null {
    const raw = localStorage.getItem(STORAGE_KEYS.FREE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveFreeKey(data: FreeKeyData): void {
    localStorage.setItem(STORAGE_KEYS.FREE_KEY, JSON.stringify(data));
  }
};
