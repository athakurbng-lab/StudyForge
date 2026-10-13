import React, { useState, useEffect, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StorageService, StudySession, UserSettings } from './services/storageService';
import { ExamType, SubjectModule } from './data/exams';
import { NotificationService } from './services/notificationService';
import { AlertTriangle, X } from 'lucide-react';

// Components
import { TopHeader } from './components/TopHeader';
import { WeekStrip } from './components/WeekStrip';
import { ByIntentionView } from './components/ByIntentionView';
import { SessionTimeline } from './components/SessionTimeline';
import { FloatingTimerBar } from './components/FloatingTimerBar';
import { SyllabusMasterView } from './components/SyllabusMasterView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { GroupsView } from './components/GroupsView';
import { AuthModal } from './components/AuthModal';
import { LogSessionModal } from './components/LogSessionModal';
import { BottomNav, NavTab } from './components/BottomNav';
import { DailyGoalModal } from './components/DailyGoalModal';
import { FilterModal } from './components/FilterModal';
import { ApiService, AuthUser } from './services/apiService';
import { UpdateService, AppReleaseInfo } from './services/updateService';
import { UpdateModal } from './components/UpdateModal';
import { ActivityChart } from './components/ActivityChart';

StorageService.sanitizeStorage();

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('timer');
  const [activeExam, setActiveExam] = useState<ExamType>(StorageService.getActiveExam());
  const [modules, setModules] = useState<SubjectModule[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [streak, setStreak] = useState<number>(StorageService.getStreak());
  const [freezeTokens, setFreezeTokens] = useState<number>(StorageService.getFreezeTokens());
  const [totalXp, setTotalXp] = useState<number>(StorageService.getTotalXp());
  const [dailyGoal, setDailyGoal] = useState<number>(() => StorageService.getDailyXpGoal());
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(StorageService.getAuthUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isLogSessionOpen, setIsLogSessionOpen] = useState<boolean>(false);
  const [isDailyGoalOpen, setIsDailyGoalOpen] = useState<boolean>(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<{ message: string; details: string } | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<AppReleaseInfo | null>(null);
  const [showHomeGraph, setShowHomeGraph] = useState<boolean>(false);

  // Filter States
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string | null>(null);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const [dateFilterEnabled, setDateFilterEnabled] = useState<boolean>(true);

  // Date Navigation State - defaulted dynamically to today
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showNotesOnly, setShowNotesOnly] = useState<boolean>(false);

  // Load modules whenever activeExam changes
  useEffect(() => {
    const loaded = StorageService.getModulesForExam(activeExam);
    setModules(loaded);
  }, [activeExam]);

  // Load sessions and initialize notifications on mount
  useEffect(() => {
    setSessions(StorageService.getSessions());

    // Auto-sync with live cloud database if user is logged in
    if (currentUser) {
      ApiService.syncWithCloud().then((synced: boolean) => {
        if (synced) {
          setTotalXp(StorageService.getTotalXp());
          setStreak(StorageService.getStreak());
          setFreezeTokens(StorageService.getFreezeTokens());
          setDailyGoal(StorageService.getDailyXpGoal());
          setSessions(StorageService.getSessions());
        }
      });
    }

    // Initialize smart notifications
    NotificationService.init().then(() => {
      const [h, m] = (settings.inactivityAlertTime || '20:30').split(':').map(Number);
      NotificationService.scheduleInactivityAlert(h, m);
    });

  }, []);

  // Check for OTA update on app start and resume
  const checkAppUpdate = useCallback(async () => {
    try {
      const res = await UpdateService.checkForUpdate(true);
      if (res.hasUpdate && res.release) {
        setAvailableUpdate(res.release);
      }
    } catch {
      // Ignore background check errors
    }
  }, []);

  useEffect(() => {
    // 1. Immediately check on app launch
    checkAppUpdate();

    // 2. Also check when user returns to app / screen turns on
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAppUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let isMounted = true;
    let appListener: any = null;
    CapApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        checkAppUpdate();
      }
    }).then((h) => {
      if (!isMounted) {
        h?.remove();
      } else {
        appListener = h;
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (appListener && typeof appListener.remove === 'function') {
        appListener.remove();
      }
    };
  }, [checkAppUpdate]);

  // Theme Sync effect
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Exam change handler
  const handleSelectExam = (exam: ExamType) => {
    setActiveExam(exam);
    StorageService.setActiveExam(exam);
    const loaded = StorageService.getModulesForExam(exam);
    setModules(loaded);
  };

  // Add Dynamic Syllabus Bar
  const handleAddModule = (newModule: SubjectModule) => {
    StorageService.addCustomModule(activeExam, newModule);
    setModules(StorageService.getModulesForExam(activeExam));
  };

  // Delete Dynamic Syllabus Bar
  const handleDeleteModule = (moduleId: string) => {
    StorageService.deleteModule(activeExam, moduleId);
    setModules(StorageService.getModulesForExam(activeExam));
  };

  // Auth User Change handler (syncs UI state immediately upon login/logout)
  const handleUserChanged = (user: AuthUser | null) => {
    setCurrentUser(user);
    setTotalXp(StorageService.getTotalXp());
    setStreak(StorageService.getStreak());
    setFreezeTokens(StorageService.getFreezeTokens());
    setDailyGoal(StorageService.getDailyXpGoal());
    setSessions(StorageService.getSessions());
  };

  // Daily Goal update handler
  const handleUpdateDailyGoal = async (newGoal: number) => {
    StorageService.setDailyXpGoal(newGoal);
    setDailyGoal(newGoal);
    await ApiService.updateDailyGoal(newGoal);
  };

  // Delete session handler (long-press in SessionTimeline)
  const handleDeleteSession = async (sessionId: string) => {
    const res = StorageService.deleteSession(sessionId);
    if (res.deleted) {
      setSessions(StorageService.getSessions());
      setTotalXp(StorageService.getTotalXp());
      const cloudIdToDelete = res.cloudId || sessionId;
      if (cloudIdToDelete) {
        await ApiService.deleteCloudSession(cloudIdToDelete);
      }
    }
  };

  // Toggle session privacy (Public <-> Private)
  const handleToggleShareSession = async (session: StudySession) => {
    const updated = StorageService.toggleSessionShare(session.id);
    if (updated) {
      setSessions(StorageService.getSessions());
      const cloudId = session.cloudId || (!session.id.startsWith('sess-') ? session.id : undefined);
      if (cloudId) {
        await ApiService.toggleSessionShare(cloudId, updated.isShared);
      }
    }
  };

  // Session Completed handler
  const handleSessionCompleted = (newSession: StudySession) => {
    StorageService.addSession(newSession);
    setSessions(StorageService.getSessions());
    setTotalXp(StorageService.getTotalXp());
    setStreak(StorageService.getStreak());
    setFreezeTokens(StorageService.getFreezeTokens());

    // Explicitly notify user if Gemini API key failed before offline logic was used
    if (newSession.usedFallback || (newSession.aiFeedback && newSession.aiFeedback.includes('Live AI API Key Failed'))) {
      const errorMsg = newSession.apiError || 'Live Gemini API key rejected, quota exceeded, or offline.';
      setAiNotice({
        message: 'Live AI Engine Unavailable — Offline Engine Used',
        details: errorMsg
      });
    }

    // Asynchronously sync session to live cloud database
    ApiService.syncSessionToCloud(newSession);
  };

  // Settings update handler
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    const [h, m] = (newSettings.inactivityAlertTime || '20:30').split(':').map(Number);
    NotificationService.scheduleInactivityAlert(h, m);
  };

  // Date jumper helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const weekStats = StorageService.getWeekStats(selectedDate);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayXp = sessions.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.xpEarned, 0);

  // Active Filter calculations
  let activeFilterCount = 0;
  if (selectedModuleFilter) activeFilterCount++;
  if (selectedMoodFilter) activeFilterCount++;
  if (showNotesOnly) activeFilterCount++;
  if (!dateFilterEnabled) activeFilterCount++;

  const handleResetFilters = () => {
    setSelectedModuleFilter(null);
    setSelectedMoodFilter(null);
    setShowNotesOnly(false);
    setDateFilterEnabled(true);
  };

  const getActiveFilterDesc = () => {
    const parts: string[] = [];
    if (selectedModuleFilter) {
      const m = modules.find(mod => mod.id === selectedModuleFilter);
      parts.push(m ? m.name : selectedModuleFilter);
    }
    if (selectedMoodFilter) {
      parts.push(selectedMoodFilter);
    }
    if (showNotesOnly) parts.push('Notes Only');
    if (!dateFilterEnabled) parts.push('All Dates');
    return parts.join(' • ');
  };

  const timelineSessions = sessions.filter((s) => {
    if (dateFilterEnabled && s.date !== selectedDate) return false;
    if (showNotesOnly && (!s.notes || s.notes.trim().length === 0)) return false;
    if (selectedModuleFilter) {
      const matchId = s.moduleId === selectedModuleFilter;
      const matchName = s.moduleName.toLowerCase() === selectedModuleFilter.toLowerCase();
      if (!matchId && !matchName) return false;
    }
    if (selectedMoodFilter && s.mood !== selectedMoodFilter) return false;
    return true;
  });

  const formattedHeaderDate = () => {
    const d = new Date(selectedDate);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors max-w-lg mx-auto shadow-2xl relative select-none">
      {/* Top Header */}
      <TopHeader
        currentDateText={formattedHeaderDate()}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        activeExam={activeExam}
        onSelectExam={handleSelectExam}
        streak={streak}
        freezeTokens={freezeTokens}
        totalXp={totalXp}
        dailyGoal={dailyGoal}
        todayXp={todayXp}
        onOpenDailyGoal={() => setIsDailyGoalOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenLogSession={() => setIsLogSessionOpen(true)}
      />

      {/* Explicit Floating Alert Banner when Gemini API Key Fails */}
      {aiNotice && (
        <div className="fixed top-3 left-3 right-3 z-50 max-w-lg mx-auto bg-amber-500 dark:bg-amber-600 text-white rounded-2xl p-3.5 shadow-2xl border border-amber-300 dark:border-amber-400 flex items-start justify-between gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-100" />
            <div className="space-y-1">
              <h4 className="text-xs font-black tracking-wide flex items-center gap-1.5">
                <span>{aiNotice.message}</span>
              </h4>
              <p className="text-[11px] text-amber-100 leading-snug">
                {aiNotice.details}
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setAiNotice(null);
                  }}
                  className="text-[10px] font-bold bg-white text-amber-800 px-2.5 py-1 rounded-lg shadow-xs hover:bg-amber-50 active:scale-95 transition-all"
                >
                  Configure / Paste Key in Settings →
                </button>
                <button
                  type="button"
                  onClick={() => setAiNotice(null)}
                  className="text-[10px] text-amber-100 hover:text-white underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAiNotice(null)}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-safe-content">
        {activeTab === 'timer' && (
          <div className="space-y-0">
            {/* Week Day-Strip matching Screenshot 1 */}
            <WeekStrip
              stats={weekStats}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              showNotesOnly={showNotesOnly}
              onToggleShowNotesOnly={() => setShowNotesOnly(!showNotesOnly)}
              filterLabel="Filter"
              onOpenFilter={() => setIsFilterModalOpen(true)}
              activeFilterCount={activeFilterCount}
              onResetFilter={handleResetFilters}
              showGraph={showHomeGraph}
              onToggleShowGraph={() => setShowHomeGraph(!showHomeGraph)}
            />

            {/* Expandable Activity Graph on Home View */}
            {showHomeGraph && (
              <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                <ActivityChart sessions={sessions} />
              </div>
            )}

            {/* By Intention View matching Screenshot 1 */}
            <ByIntentionView
              exam={activeExam}
              modules={modules}
              sessions={sessions}
              onAddModule={handleAddModule}
              onDeleteModule={handleDeleteModule}
              onQuickLogSession={(_mod) => {
                setIsLogSessionOpen(true);
              }}
            />

            {/* Session Timeline matching Screenshot 2 */}
            <SessionTimeline
              sessions={timelineSessions}
              showNotesOnly={showNotesOnly}
              isFiltered={activeFilterCount > 0}
              activeFilterDescription={getActiveFilterDesc()}
              onResetFilters={handleResetFilters}
              onOpenLogSession={() => setIsLogSessionOpen(true)}
              onDeleteSession={handleDeleteSession}
              onToggleShareSession={handleToggleShareSession}
            />
          </div>
        )}

        {activeTab === 'syllabus' && (
          <SyllabusMasterView
            exam={activeExam}
            modules={modules}
            onAddModule={handleAddModule}
            onDeleteModule={handleDeleteModule}
            onSessionCompleted={handleSessionCompleted}
            onModulesUpdated={() => setModules(StorageService.getModulesForExam(activeExam))}
          />
        )}

        {activeTab === 'groups' && (
          <GroupsView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            sessions={sessions}
            onOpenLogSession={() => setIsLogSessionOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateDailyGoal={handleUpdateDailyGoal}
          />
        )}
      </main>

      {/* Floating Pomodoro & Stopwatch Timer Bar matching Screenshot 1 */}
      {modules.length > 0 && (
        <FloatingTimerBar
          exam={activeExam}
          modules={modules}
          onSessionCompleted={handleSessionCompleted}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Cloud Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
      />

      {/* Log Study Session Modal (AI Evaluation & Cloud Sync) */}
      <LogSessionModal
        isOpen={isLogSessionOpen}
        onClose={() => setIsLogSessionOpen(false)}
        exam={activeExam}
        modules={modules}
        onSessionCompleted={handleSessionCompleted}
      />

      {/* Daily XP Goal Modal */}
      <DailyGoalModal
        isOpen={isDailyGoalOpen}
        onClose={() => setIsDailyGoalOpen(false)}
        currentGoal={dailyGoal}
        todayXp={todayXp}
        onSaveGoal={handleUpdateDailyGoal}
      />

      {/* Interactive Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        modules={modules}
        selectedModuleId={selectedModuleFilter}
        onSelectModuleId={setSelectedModuleFilter}
        selectedMood={selectedMoodFilter}
        onSelectMood={setSelectedMoodFilter}
        showNotesOnly={showNotesOnly}
        onToggleShowNotesOnly={setShowNotesOnly}
        dateFilterEnabled={dateFilterEnabled}
        onToggleDateFilter={setDateFilterEnabled}
        selectedDate={selectedDate}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* OTA In-App Auto Update Modal */}
      {availableUpdate && (
        <UpdateModal
          release={availableUpdate}
          onClose={() => setAvailableUpdate(null)}
        />
      )}
    </div>
  );
};

export default App;
