import { ExamType, SubjectModule, EXAMS_DATA } from '../data/exams';

export interface StudySession {
  id: string;
  exam: ExamType;
  moduleId: string;
  moduleName: string;
  topicId?: string;
  topicName?: string;
  startTime: string; // ISO string or e.g. "09:58 PM"
  endTime: string;   // e.g. "11:20 PM"
  durationMinutes: number;
  xpEarned: number;
  mood: 'focused' | 'neutral' | 'distracted'; // 🤩, 🙂, 😔
  notes: string;
  aiFeedback?: string;
  date: string; // YYYY-MM-DD
  category: string;
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

const STORAGE_KEYS = {
  ACTIVE_EXAM: 'studyforge_active_exam',
  CUSTOM_MODULES: 'studyforge_custom_modules',
  DELETED_MODULES: 'studyforge_deleted_modules',
  SESSIONS: 'studyforge_sessions',
  SETTINGS: 'studyforge_settings',
  STREAK: 'studyforge_streak',
  FREEZE_TOKENS: 'studyforge_freeze_tokens',
  TOTAL_XP: 'studyforge_total_xp',
};

// Initial sample sessions matching the user's uploaded screenshots
const DEFAULT_SESSIONS: StudySession[] = [
  {
    id: 'sess-1',
    exam: 'neet_pg',
    moduleId: 'med_pedia',
    moduleName: 'General: Pedia',
    topicName: 'Growth, Development & Milestones',
    startTime: '08:00 AM',
    endTime: '09:30 AM',
    durationMinutes: 90,
    xpEarned: 180,
    mood: 'focused',
    notes: 'Covered Denver developmental milestones and gross motor milestones.',
    aiFeedback: 'Excellent retention on fine motor vs gross motor timelines. High-yield concept!',
    date: '2026-10-07',
    category: 'General'
  },
  {
    id: 'sess-2',
    exam: 'neet_pg',
    moduleId: 'med_pedia',
    moduleName: 'General: Pedia',
    topicName: 'Neonatology & Neonatal Resuscitation',
    startTime: '10:00 AM',
    endTime: '12:12 PM',
    durationMinutes: 132,
    xpEarned: 240,
    mood: 'focused',
    notes: 'NRP 8th edition algorithm, T-piece resuscitator vs self-inflating bag.',
    aiFeedback: 'Strong mastery of resuscitation steps. Deep focus maintained for 2+ hours.',
    date: '2026-10-07',
    category: 'General'
  },
  {
    id: 'sess-3',
    exam: 'neet_pg',
    moduleId: 'med_radio',
    moduleName: 'General: Radiology',
    topicName: 'Chest X-Ray Patterns & Silhouette Sign',
    startTime: '01:30 PM',
    endTime: '03:15 PM',
    durationMinutes: 105,
    xpEarned: 195,
    mood: 'neutral',
    notes: 'Right middle lobe collapse vs right lower lobe consolidation silhouette sign.',
    aiFeedback: 'Clear differentiation of cardiophrenic borders. Keep revising diaphragm sign.',
    date: '2026-10-07',
    category: 'General'
  },
  {
    id: 'sess-4',
    exam: 'neet_pg',
    moduleId: 'med_radio',
    moduleName: 'General: Radiology',
    topicName: 'CT & MRI Brain (Strokes, Tumors)',
    startTime: '03:45 PM',
    endTime: '05:06 PM',
    durationMinutes: 81,
    xpEarned: 155,
    mood: 'focused',
    notes: 'DWI restriction in acute ischemic stroke, FLAIR suppression for subarachnoid.',
    aiFeedback: 'Great diagnostic acuity. Remember penumbra DWI-FLAIR mismatch.',
    date: '2026-10-07',
    category: 'General'
  },
  {
    id: 'sess-5',
    exam: 'neet_pg',
    moduleId: 'med_biochem',
    moduleName: 'General: Biochemistry',
    topicName: 'Carbohydrate Metabolism & Glycolysis',
    startTime: '06:15 PM',
    endTime: '07:35 PM',
    durationMinutes: 80,
    xpEarned: 160,
    mood: 'focused',
    notes: 'PFK-1 regulation by F-2,6-BP, Pyruvate dehydrogenase complex regulation.',
    aiFeedback: 'Solid understanding of allosteric regulation under fed vs fasting states.',
    date: '2026-10-07',
    category: 'General'
  },
  {
    id: 'sess-6',
    exam: 'neet_pg',
    moduleId: 'med_biochem',
    moduleName: 'General: Biochemistry',
    topicName: 'Lipid Metabolism & Storage Disorders',
    startTime: '08:00 PM',
    endTime: '09:22 PM',
    durationMinutes: 82,
    xpEarned: 165,
    mood: 'distracted',
    notes: 'Tay-Sachs vs Niemann-Pick cherry red spot differentiation, Gaucher cells.',
    aiFeedback: 'Good effort despite slight distraction. High yield for NEET PG clinical vignettes.',
    date: '2026-10-07',
    category: 'General'
  },
  {
    id: 'sess-7',
    exam: 'neet_pg',
    moduleId: 'med_anatomy_path',
    moduleName: 'General: Anatomy+Path',
    topicName: 'Circle of Willis & Neoplasia',
    startTime: '09:58 PM',
    endTime: '11:20 PM',
    durationMinutes: 82,
    xpEarned: 150,
    mood: 'focused',
    notes: 'Aneurysm locations (ACom most common), Berry aneurysm rupture mechanics.',
    aiFeedback: 'Strong late night sprint. Total focus for today crossed 11 hours!',
    date: '2026-10-07',
    category: 'General'
  }
];

export const StorageService = {
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
    return all.filter(m => !deletedIds.includes(m.id));
  },

  addCustomModule(exam: ExamType, module: SubjectModule): void {
    const customJson = localStorage.getItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`);
    const customModules: SubjectModule[] = customJson ? JSON.parse(customJson) : [];
    customModules.push(module);
    localStorage.setItem(`${STORAGE_KEYS.CUSTOM_MODULES}_${exam}`, JSON.stringify(customModules));
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

  // Sessions
  getSessions(): StudySession[] {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!saved) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_SESSIONS));
      return DEFAULT_SESSIONS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_SESSIONS;
    }
  },

  addSession(session: StudySession): void {
    const list = this.getSessions();
    list.unshift(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list));

    // Update total XP
    const currentXp = this.getTotalXp();
    this.setTotalXp(currentXp + session.xpEarned);
  },

  // Stats & Week Strip
  getWeekStats(): DayStats[] {
    // Reference week matching the user's screenshot
    return [
      { date: '2026-10-05', dayLabel: 'MON 05', totalHours: 8.48 },
      { date: '2026-10-06', dayLabel: 'TUE 06', totalHours: 8.10 },
      { date: '2026-10-07', dayLabel: 'WED 07', totalHours: 11.07 },
      { date: '2026-10-08', dayLabel: 'THU 08', totalHours: 6.18 },
      { date: '2026-10-09', dayLabel: 'FRI 09', totalHours: 1.56 },
      { date: '2026-10-10', dayLabel: 'SAT 10', totalHours: 0.00 },
      { date: '2026-10-11', dayLabel: 'SUN 11', totalHours: 0.00 },
    ];
  },

  // Gamification
  getStreak(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.STREAK);
    return saved ? parseInt(saved, 10) : 14;
  },

  setStreak(val: number): void {
    localStorage.setItem(STORAGE_KEYS.STREAK, val.toString());
  },

  getFreezeTokens(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.FREEZE_TOKENS);
    return saved ? parseInt(saved, 10) : 2;
  },

  setFreezeTokens(val: number): void {
    localStorage.setItem(STORAGE_KEYS.FREEZE_TOKENS, val.toString());
  },

  getTotalXp(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.TOTAL_XP);
    return saved ? parseInt(saved, 10) : 4820;
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
      appVersion: 'v1.0.0 (Release Candidate)',
      buildNumber: '2026.10.12-Native',
    };
    if (!saved) return defaults;
    try {
      return { ...defaults, ...JSON.parse(saved) };
    } catch {
      return defaults;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};
