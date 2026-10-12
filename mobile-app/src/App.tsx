import React, { useState, useEffect } from 'react';
import { StorageService, StudySession, UserSettings } from './services/storageService';
import { ExamType, SubjectModule } from './data/exams';
import { NotificationService } from './services/notificationService';

// Components
import { TopHeader } from './components/TopHeader';
import { WeekStrip } from './components/WeekStrip';
import { ByIntentionView } from './components/ByIntentionView';
import { SessionTimeline } from './components/SessionTimeline';
import { FloatingTimerBar } from './components/FloatingTimerBar';
import { SyllabusMasterView } from './components/SyllabusMasterView';
import { AnswerWritingStudio } from './components/AnswerWritingStudio';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { GroupsView } from './components/GroupsView';
import { AuthModal } from './components/AuthModal';
import { LogSessionModal } from './components/LogSessionModal';
import { BottomNav, NavTab } from './components/BottomNav';
import { DailyGoalModal } from './components/DailyGoalModal';
import { ApiService, AuthUser } from './services/apiService';

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
      await ApiService.deleteCloudSession(sessionId);
    }
  };

  // Session Completed handler
  const handleSessionCompleted = (newSession: StudySession) => {
    StorageService.addSession(newSession);
    setSessions(StorageService.getSessions());
    setTotalXp(StorageService.getTotalXp());
    setStreak(StorageService.getStreak());
    setFreezeTokens(StorageService.getFreezeTokens());

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
            />

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
              sessions={sessions}
              showNotesOnly={showNotesOnly}
              onOpenLogSession={() => setIsLogSessionOpen(true)}
              onDeleteSession={handleDeleteSession}
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
          />
        )}

        {activeTab === 'groups' && (
          <GroupsView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'studio' && (
          <AnswerWritingStudio
            exam={activeExam}
            onSessionCompleted={handleSessionCompleted}
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
    </div>
  );
};

export default App;
