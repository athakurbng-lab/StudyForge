import React from 'react';
import { TrendingUp, Clock, Coffee, Scale, Sparkles, BarChart2 } from 'lucide-react';
import { StudySession } from '../services/storageService';

interface AnalyticsViewProps {
  sessions: StudySession[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ sessions }) => {
  // Aggregate stats dynamically from logged sessions
  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Real distinct active days
  const distinctDates = Array.from(new Set(sessions.map(s => s.date)));
  const activeDaysCount = distinctDates.length;

  const avgMinutesPerDay = activeDaysCount > 0 ? Math.round(totalMinutes / activeDaysCount) : 0;
  const avgHours = Math.floor(avgMinutesPerDay / 60);
  const avgRemMinutes = avgMinutesPerDay % 60;

  // Estimated micro-breaks (5m per 25m pomodoro / ~15% focus ratio)
  const totalBreakMinutes = sessions.length > 0 ? Math.round(totalMinutes * 0.15) : 0;
  const focusBreakRatio = totalBreakMinutes > 0 ? (totalMinutes / totalBreakMinutes).toFixed(1) : (totalMinutes > 0 ? '∞' : '0');

  const moodCounts = {
    focused: sessions.filter(s => s.mood === 'focused').length,
    neutral: sessions.filter(s => s.mood === 'neutral').length,
    distracted: sessions.filter(s => s.mood === 'distracted').length,
  };

  const totalMoods = sessions.length;

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-140px)] transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            Study Analytics & Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Deep focus metrics, mood telemetry & pacing ratios
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          <span>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} logged</span>
        </div>
      </div>

      {/* Focus Metrics 4-Card Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Focus Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-semibold">Total Focus</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-50">
            {totalHours}h {remainingMinutes.toString().padStart(2, '0')}m
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            {sessions.length === 0 ? 'Start a sprint to log focus' : `${sessions.length} recorded sessions`}
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
            {activeDaysCount === 0 ? 'No active days yet' : `Across ${activeDaysCount} active ${activeDaysCount === 1 ? 'day' : 'days'}`}
          </div>
        </div>

        {/* Total Break Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-semibold">Total Break</span>
            <Coffee className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-50">
            {totalBreakMinutes}min
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            {totalBreakMinutes === 0 ? 'No breaks logged' : 'Calculated interval recovery'}
          </div>
        </div>

        {/* Focus / Break Ratio Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-semibold">Focus / Break Ratio</span>
            <Scale className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-50">
            {focusBreakRatio} : 1
          </div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
            {totalMinutes === 0 ? 'Awaiting first session' : 'Dynamic focus ratio'}
          </div>
        </div>
      </div>

      {/* Focus Quality / Mood Telemetry */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          Focus Quality & Mood Ratings
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-3">
            <div className="text-2xl mb-1">🤩</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Focused</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {moodCounts.focused}
            </div>
            <div className="text-[10px] text-slate-400">
              {totalMoods > 0 ? Math.round((moodCounts.focused / totalMoods) * 100) : 0}%
            </div>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-3">
            <div className="text-2xl mb-1">🙂</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Neutral</div>
            <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {moodCounts.neutral}
            </div>
            <div className="text-[10px] text-slate-400">
              {totalMoods > 0 ? Math.round((moodCounts.neutral / totalMoods) * 100) : 0}%
            </div>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 rounded-xl p-3">
            <div className="text-2xl mb-1">😔</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Distracted</div>
            <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {moodCounts.distracted}
            </div>
            <div className="text-[10px] text-slate-400">
              {totalMoods > 0 ? Math.round((moodCounts.distracted / totalMoods) * 100) : 0}%
            </div>
          </div>
        </div>
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
            : 'Log your study sprints to activate the continuous 5-session learning curve. Sustained concentration on single modules earns escalating XP bonuses!'}
        </p>
      </div>
    </div>
  );
};
export default AnalyticsView;
