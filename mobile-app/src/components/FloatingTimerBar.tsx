import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Sparkles, X, Globe, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';
import { SubjectModule, ExamType } from '../data/exams';
import { GeminiService } from '../services/geminiService';
import { StudySession } from '../services/storageService';
import { NotificationService } from '../services/notificationService';

interface FloatingTimerBarProps {
  exam: ExamType;
  modules: SubjectModule[];
  onSessionCompleted: (session: StudySession) => void;
  initialModule?: SubjectModule;
}

export const FloatingTimerBar: React.FC<FloatingTimerBarProps> = ({
  exam,
  modules,
  onSessionCompleted,
  initialModule,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialModule?.id || modules[0]?.id || ''
  );
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [pomodoroTargetSeconds, setPomodoroTargetSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 25:00
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Background resilience: absolute timestamps to survive screen-off & process throttling
  const targetEndTimeRef = useRef<number | null>(null);
  const stopwatchStartTimeRef = useRef<number | null>(null);

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [topicName, setTopicName] = useState('');
  const [mood, setMood] = useState<'focused' | 'neutral' | 'distracted'>('focused');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const currentModule = modules.find((m) => m.id === selectedModuleId) || modules[0];

  const triggerCompletionPrompt = useCallback(() => {
    try {
      Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {}
    setShowCompleteModal(true);
  }, []);

  // Sync timer from real wall-clock timestamps
  const syncTimer = useCallback(() => {
    const now = Date.now();
    if (mode === 'pomodoro') {
      if (!targetEndTimeRef.current) return;
      const remaining = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setIsRunning(false);
        targetEndTimeRef.current = null;
        NotificationService.cancelPomodoroAlert();
        localStorage.removeItem('sf_timer_state');
        triggerCompletionPrompt();
      }
    } else {
      if (!stopwatchStartTimeRef.current) return;
      const elapsed = Math.max(0, Math.floor((now - stopwatchStartTimeRef.current) / 1000));
      setElapsedSeconds(elapsed);
    }
  }, [mode, triggerCompletionPrompt]);

  // Restore running timer state if app was killed or reloaded
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sf_timer_state');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.isRunning) {
          if (saved.mode === 'pomodoro' && saved.targetEndTime) {
            const now = Date.now();
            const remaining = Math.max(0, Math.round((saved.targetEndTime - now) / 1000));
            setMode('pomodoro');
            if (saved.pomodoroTargetSeconds) setPomodoroTargetSeconds(saved.pomodoroTargetSeconds);
            if (saved.selectedModuleId) setSelectedModuleId(saved.selectedModuleId);
            if (saved.topicName) setTopicName(saved.topicName);

            if (remaining <= 0) {
              setSecondsLeft(0);
              setIsRunning(false);
              localStorage.removeItem('sf_timer_state');
              triggerCompletionPrompt();
            } else {
              setSecondsLeft(remaining);
              targetEndTimeRef.current = saved.targetEndTime;
              setIsRunning(true);
            }
          } else if (saved.mode === 'stopwatch' && saved.startTime) {
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - saved.startTime) / 1000));
            setMode('stopwatch');
            setElapsedSeconds(elapsed);
            stopwatchStartTimeRef.current = saved.startTime;
            setIsRunning(true);
            if (saved.selectedModuleId) setSelectedModuleId(saved.selectedModuleId);
            if (saved.topicName) setTopicName(saved.topicName);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore running timer state:', e);
    }
  }, [triggerCompletionPrompt]);

  // Sync selected module if modules change
  useEffect(() => {
    if (!selectedModuleId && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  // Foreground tick interval (runs while screen is on)
  useEffect(() => {
    if (!isRunning) return;
    syncTimer();
    const interval = setInterval(() => {
      syncTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, syncTimer]);

  // Screen off / on & App background / resume listeners
  useEffect(() => {
    const handleSync = () => {
      if (isRunning) {
        syncTimer();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleSync);

    let appStateHandle: any = null;
    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        handleSync();
      }
    }).then((handle) => {
      appStateHandle = handle;
    }).catch(() => {});

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleSync);
      if (appStateHandle && typeof appStateHandle.remove === 'function') {
        appStateHandle.remove();
      }
    };
  }, [isRunning, syncTimer]);

  const handleToggleTimer = () => {
    try {
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {}

    if (!isRunning) {
      // STARTING TIMER
      if (mode === 'pomodoro') {
        const target = Date.now() + secondsLeft * 1000;
        targetEndTimeRef.current = target;
        NotificationService.schedulePomodoroAlert(target, currentModule?.name || 'Study Session');
        localStorage.setItem(
          'sf_timer_state',
          JSON.stringify({
            isRunning: true,
            mode: 'pomodoro',
            targetEndTime: target,
            pomodoroTargetSeconds,
            selectedModuleId,
            topicName
          })
        );
      } else {
        const start = Date.now() - elapsedSeconds * 1000;
        stopwatchStartTimeRef.current = start;
        localStorage.setItem(
          'sf_timer_state',
          JSON.stringify({
            isRunning: true,
            mode: 'stopwatch',
            startTime: start,
            selectedModuleId,
            topicName
          })
        );
      }
      setIsRunning(true);
    } else {
      // PAUSING TIMER
      setIsRunning(false);
      if (mode === 'pomodoro') {
        if (targetEndTimeRef.current) {
          const remaining = Math.max(0, Math.round((targetEndTimeRef.current - Date.now()) / 1000));
          setSecondsLeft(remaining);
        }
        targetEndTimeRef.current = null;
        NotificationService.cancelPomodoroAlert();
      } else {
        if (stopwatchStartTimeRef.current) {
          const elapsed = Math.max(0, Math.floor((Date.now() - stopwatchStartTimeRef.current) / 1000));
          setElapsedSeconds(elapsed);
        }
        stopwatchStartTimeRef.current = null;
      }
      localStorage.removeItem('sf_timer_state');
    }
  };

  const handleToggleMode = () => {
    if (isRunning) {
      setIsRunning(false);
      targetEndTimeRef.current = null;
      stopwatchStartTimeRef.current = null;
      NotificationService.cancelPomodoroAlert();
      localStorage.removeItem('sf_timer_state');
    }
    setMode((prev) => (prev === 'pomodoro' ? 'stopwatch' : 'pomodoro'));
  };

  const handleStopAndLog = () => {
    if (isRunning) {
      setIsRunning(false);
      targetEndTimeRef.current = null;
      stopwatchStartTimeRef.current = null;
      NotificationService.cancelPomodoroAlert();
      localStorage.removeItem('sf_timer_state');
    }
    triggerCompletionPrompt();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentDisplayTime = mode === 'pomodoro' ? formatTime(secondsLeft) : formatTime(elapsedSeconds);

  const handleSaveSession = async () => {
    setIsEvaluating(true);

    const actualSecondsSpent = mode === 'pomodoro' ? (pomodoroTargetSeconds - secondsLeft) : elapsedSeconds;
    const durationMinutes = Math.max(1, Math.round(actualSecondsSpent / 60));

    const now = new Date();
    const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const startTimeObj = new Date(now.getTime() - durationMinutes * 60000);
    const startTimeStr = startTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // AI Evaluation
    const evalResult = await GeminiService.evaluateSession({
      exam,
      subject: currentModule?.category || 'General',
      moduleName: currentModule?.name || 'Study Session',
      topicName: topicName.trim() || undefined,
      durationMinutes,
      notes: sessionNotes,
    });

    const newSession: StudySession = {
      id: `sess-${Date.now()}`,
      exam,
      moduleId: currentModule?.id || 'gen',
      moduleName: currentModule?.name || 'General Study',
      topicName: topicName.trim() || undefined,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMinutes,
      xpEarned: evalResult.xp,
      mood,
      notes: sessionNotes,
      aiFeedback: evalResult.feedback,
      date: now.toISOString().split('T')[0],
      category: currentModule?.category || 'General',
      apiError: evalResult.apiError,
      usedFallback: evalResult.usedFallback,
      isShared
    };

    onSessionCompleted(newSession);
    setIsEvaluating(false);

    // Confetti celebration
    try {
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
      Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}

    // Reset timer
    setIsRunning(false);
    targetEndTimeRef.current = null;
    stopwatchStartTimeRef.current = null;
    NotificationService.cancelPomodoroAlert();
    localStorage.removeItem('sf_timer_state');
    setSecondsLeft(pomodoroTargetSeconds);
    setElapsedSeconds(0);
    setSessionNotes('');
    setTopicName('');
    setShowCompleteModal(false);
  };

  const handleAdjustTime = (deltaMinutes: number) => {
    if (mode === 'pomodoro') {
      const nextTarget = Math.max(60, pomodoroTargetSeconds + deltaMinutes * 60);
      const nextLeft = Math.max(0, secondsLeft + deltaMinutes * 60);
      setPomodoroTargetSeconds(nextTarget);
      setSecondsLeft(nextLeft);

      if (isRunning) {
        const newTarget = Date.now() + nextLeft * 1000;
        targetEndTimeRef.current = newTarget;
        NotificationService.schedulePomodoroAlert(newTarget, currentModule?.name || 'Study Session');
        localStorage.setItem(
          'sf_timer_state',
          JSON.stringify({
            isRunning: true,
            mode: 'pomodoro',
            targetEndTime: newTarget,
            pomodoroTargetSeconds: nextTarget,
            selectedModuleId,
            topicName
          })
        );
      }
    }
  };

  return (
    <>
      {/* Floating Timer Bar matching Screenshot 1 */}
      <div className="fixed bottom-safe-bar left-3 right-3 z-30 pointer-events-auto">
        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-700/60 space-y-2 transition-all">
          {/* Top micro-bar: Custom topic input & time quick buttons */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Custom topic (e.g. Anthropology Paper 2, NRP steps)..."
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="flex-1 text-[11px] bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-100 placeholder-slate-400 outline-hidden focus:border-rose-500"
            />
            {mode === 'pomodoro' && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAdjustTime(-5)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-md border border-slate-700"
                  title="Decrease 5 minutes"
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustTime(5)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-400 text-[10px] font-bold rounded-md border border-slate-700"
                  title="Add 5 minutes"
                >
                  +5m
                </button>
              </div>
            )}
          </div>

          {/* Main timer row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Module dropdown */}
            <div className="flex items-center gap-2 max-w-[42%] min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentModule?.color || '#e11d48' }}
              />
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="bg-transparent border-none outline-hidden text-xs font-bold text-slate-100 truncate cursor-pointer w-full"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Center: Timer digits */}
            <button
              onClick={handleToggleMode}
              title="Tap to toggle Pomodoro / Stopwatch"
              className="flex items-center gap-1 font-mono text-base font-black tracking-widest text-slate-100 hover:text-rose-400 transition-colors"
            >
              <span>{currentDisplayTime}</span>
              <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase">
                {mode === 'pomodoro' ? 'pomo' : 'stop'}
              </span>
            </button>

            {/* Right: Play / Stop */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleToggleTimer}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleStopAndLog}
                title="End session & claim XP"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Completion & AI Evaluation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Study Session Complete!
              </h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Logging under: <strong className="text-rose-600">{currentModule?.name}</strong>
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specific Topic / Focus Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kinship Systems, Arterial Blood Gas, DI Shortcuts"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Notes & Concept Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Write a quick summary of what you learned or solved. Gemini AI analyzes this for bonus XP!"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-rose-500 resize-none"
                />
              </div>

              {/* Focus Mood Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Focus Quality & Mood
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMood('focused')}
                    className={`py-2 px-1 text-xs rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      mood === 'focused'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xl">🤩</span>
                    <span className="text-[11px]">Focused</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMood('neutral')}
                    className={`py-2 px-1 text-xs rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      mood === 'neutral'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xl">🙂</span>
                    <span className="text-[11px]">Neutral</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMood('distracted')}
                    className={`py-2 px-1 text-xs rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      mood === 'distracted'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xl">😔</span>
                    <span className="text-[11px]">Distracted</span>
                  </button>
                </div>
              </div>

              {/* Privacy & Sharing Selector */}
              <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isShared ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {isShared ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                      {isShared ? 'Public Log (Visible to Friends)' : 'Private Log (Restricted)'}
                    </span>
                    <span className="text-[9px] text-slate-400 leading-tight block">
                      {isShared ? 'Visible in friends activity & group chats' : 'Visible only to you and approved Watchers'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsShared(!isShared)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isShared ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isShared ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={handleSaveSession}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Evaluating with Gemini 2.5 Flash...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Claim XP & Save Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
