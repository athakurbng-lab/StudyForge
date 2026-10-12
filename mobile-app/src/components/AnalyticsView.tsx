import React from 'react';
import { TrendingUp, Clock, Sparkles, BarChart2, Award, Zap, PlusCircle } from 'lucide-react';
import { StudySession } from '../services/storageService';

interface AnalyticsViewProps {
  sessions: StudySession[];
  onOpenLogSession?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ sessions, onOpenLogSession }) => {
  // Aggregate stats dynamically from genuinely logged sessions
  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Real distinct active days
  const distinctDates = Array.from(new Set(sessions.map(s => s.date)));
  const activeDaysCount = distinctDates.length;

  // Real average daily focus
  const avgMinutesPerDay = activeDaysCount > 0 ? Math.round(totalMinutes / activeDaysCount) : 0;
  const avgHours = Math.floor(avgMinutesPerDay / 60);
  const avgRemMinutes = avgMinutesPerDay % 60;

  // Real total XP and averages
  const totalXp = sessions.reduce((acc, s) => acc + (s.xpEarned || 0), 0);
  const avgXpPerSession = sessions.length > 0 ? Math.round(totalXp / sessions.length) : 0;

  // Longest focus sprint
  const longestSprintMinutes = sessions.length > 0 ? Math.max(...sessions.map(s => s.durationMinutes || 0)) : 0;
  const longestHours = Math.floor(longestSprintMinutes / 60);
  const longestMins = longestSprintMinutes % 60;

  // Real mood metrics: count only sessions where user explicitly rated mood
  const ratedSessions = sessions.filter(s => s.mood && ['focused', 'neutral', 'distracted'].includes(s.mood));
  const totalMoods = ratedSessions.length;
  const moodCounts = {
    focused: ratedSessions.filter(s => s.mood === 'focused').length,
    neutral: ratedSessions.filter(s => s.mood === 'neutral').length,
    distracted: ratedSessions.filter(s => s.mood === 'distracted').length,
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-140px)] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            Study Analytics & Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authentic focus metrics, verified XP & telemetry
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span>
          </div>
          {onOpenLogSession && (
            <button
              onClick={onOpenLogSession}
              className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded-full shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State when no sessions exist */}
      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center shadow-2xs space-y-4 my-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-2xl">
            📊
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-1">
              No Study Sessions Logged Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your focus hours, daily averages, learning curve progression, and mood ratings are calculated 100% from your authentic sessions.
            </p>
          </div>
          {onOpenLogSession && (
            <button
              onClick={onOpenLogSession}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              <span>⚡</span>
              <span>+ Log Your First Study Session</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Focus Metrics 4-Card Grid (100% Genuine Data) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Focus Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span className="font-semibold">Total Focus Time</span>
                <Clock className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-50">
                {totalHours}h {remainingMinutes.toString().padStart(2, '0')}m
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                Across {sessions.length} logged {sessions.length === 1 ? 'session' : 'sessions'}
              </div>
            </div>

            {/* Avg Focus/Day Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span className="font-semibold">Avg Focus / Day</span>
                <BarChart2 className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-50">
                {avgHours}h {avgRemMinutes.toString().padStart(2, '0')}m
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                Across {activeDaysCount} active study {activeDaysCount === 1 ? 'day' : 'days'}
              </div>
            </div>

            {/* Total XP Earned Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span className="font-semibold">Total Session XP</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-50">
                {totalXp.toLocaleString()} XP
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                Avg {avgXpPerSession} XP / session
              </div>
            </div>

            {/* Longest Focus Sprint Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                <span className="font-semibold">Longest Sprint</span>
                <Zap className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-50">
                {longestHours > 0 ? `${longestHours}h ${longestMins}m` : `${longestMins}m`}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                Best single session duration
              </div>
            </div>
          </div>

          {/* Focus Quality / Mood Telemetry */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Focus Quality & Mood Ratings
              </h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {totalMoods} rated {totalMoods === 1 ? 'session' : 'sessions'}
              </span>
            </div>

            {totalMoods === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 text-center border border-slate-200/60 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No mood ratings recorded yet. Rate your focus after completing timer sprints or logging sessions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-3">
                  <div className="text-2xl mb-1">🤩</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Focused</div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {moodCounts.focused}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {Math.round((moodCounts.focused / totalMoods) * 100)}%
                  </div>
                </div>

                <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-3">
                  <div className="text-2xl mb-1">🙂</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Neutral</div>
                  <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {moodCounts.neutral}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {Math.round((moodCounts.neutral / totalMoods) * 100)}%
                  </div>
                </div>

                <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 rounded-xl p-3">
                  <div className="text-2xl mb-1">😔</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Distracted</div>
                  <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {moodCounts.distracted}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {Math.round((moodCounts.distracted / totalMoods) * 100)}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5-Session Learning Curve Status */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Continuous 5-Session Learning Curve</span>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                {sessions.length >= 5 ? 'Active Buff' : `${sessions.length}/5 Sessions`}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {sessions.length >= 5
                ? 'Your sustained focus on high-yield modules is actively buffed by the Gemini evaluation engine!'
                : `Log ${5 - sessions.length} more study sprint(s) to activate the continuous 5-session learning curve. Sustained concentration on single modules earns escalating XP bonuses!`}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsView;
