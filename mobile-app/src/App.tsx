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
import { BottomNav, NavTab } from './components/BottomNav';
import { AuthUser } from './services/apiService';

StorageService.sanitizeStorage();

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('timer');
  const [activeExam, setActiveExam] = useState<ExamType>(StorageService.getActiveExam());
  const [modules, setModules] = useState<SubjectModule[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [streak, setStreak] = useState<number>(StorageService.getStreak());
  const [freezeTokens, setFreezeTokens] = useState<number>(StorageService.getFreezeTokens());
  const [totalXp, setTotalXp] = useState<number>(StorageService.getTotalXp());
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(StorageService.getAuthUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

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

  // Session Completed handler
  const handleSessionCompleted = (newSession: StudySession) => {
    StorageService.addSession(newSession);
    setSessions(StorageService.getSessions());
    setTotalXp(StorageService.getTotalXp());
    setStreak(StorageService.getStreak());
    setFreezeTokens(StorageService.getFreezeTokens());
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
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
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
                setActiveTab('syllabus');
              }}
            />

            {/* Session Timeline matching Screenshot 2 */}
            <SessionTimeline
              sessions={sessions}
              showNotesOnly={showNotesOnly}
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
        onUserChanged={setCurrentUser}
      />
    </div>
  );
};

export default App;
