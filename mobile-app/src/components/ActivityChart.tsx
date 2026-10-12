import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, Zap, Clock, Info } from 'lucide-react';
import { StudySession } from '../services/storageService';

interface ActivityChartProps {
  sessions: StudySession[];
}

type TimeRange = 7 | 14 | 30;
type MetricType = 'xp' | 'time';

interface DayData {
  dateKey: string;      // YYYY-MM-DD
  label: string;        // Oct 12
  fullDate: string;     // Sunday, Oct 12, 2026
  xp: number;
  minutes: number;
  sessionCount: number;
  moods: string[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ sessions }) => {
  const [range, setRange] = useState<TimeRange>(30);
  const [metric, setMetric] = useState<MetricType>('xp');
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Build daily data for the selected range
  const chartData = useMemo(() => {
    const days: DayData[] = [];
    const now = new Date();

    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

      // Aggregate sessions on this date
      const daysSessions = sessions.filter(s => s.date === dateKey);
      const xp = daysSessions.reduce((acc, s) => acc + (s.xpEarned || 0), 0);
      const minutes = daysSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      const moods = daysSessions.map(s => s.mood).filter(Boolean) as string[];

      days.push({
        dateKey,
        label,
        fullDate,
        xp,
        minutes,
        sessionCount: daysSessions.length,
        moods
      });
    }

    return days;
  }, [sessions, range]);

interface ChartStats {
  totalXp: number;
  totalMinutes: number;
  totalHours: string;
  activeDays: number;
  avgValue: number;
  peakDay: DayData | null;
  maxVal: number;
}

  // Overall statistics for the selected range
  const stats = useMemo<ChartStats>(() => {
    const totalXp = chartData.reduce((acc, d) => acc + d.xp, 0);
    const totalMinutes = chartData.reduce((acc, d) => acc + d.minutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const activeDays = chartData.filter(d => (metric === 'xp' ? d.xp > 0 : d.minutes > 0)).length;

    const avgValue = range > 0 ? (metric === 'xp' ? Math.round(totalXp / range) : Math.round(totalMinutes / range)) : 0;
    
    let peakDay: DayData | null = null;
    let maxVal = 0;
    for (const d of chartData) {
      const val = metric === 'xp' ? d.xp : d.minutes;
      if (val > maxVal) {
        maxVal = val;
        peakDay = d;
      }
    }

    return { totalXp, totalMinutes, totalHours, activeDays, avgValue, peakDay, maxVal };
  }, [chartData, metric, range]);

  // SVG Chart Dimensions & Scaling
  const width = 360;
  const height = 180;
  const paddingLeft = 38;
  const paddingRight = 12;
  const paddingTop = 20;
  const paddingBottom = 26;

  const chartInnerWidth = width - paddingLeft - paddingRight;
  const chartInnerHeight = height - paddingTop - paddingBottom;

  // Max scale calculation
  const maxMetricValue = useMemo(() => {
    const values = chartData.map(d => (metric === 'xp' ? d.xp : d.minutes));
    const highest = Math.max(...values, 0);
    if (highest === 0) return metric === 'xp' ? 100 : 60;
    // Add 20% headroom and round nicely
    const rawCeil = highest * 1.25;
    return metric === 'xp' ? Math.ceil(rawCeil / 25) * 25 : Math.ceil(rawCeil / 30) * 30;
  }, [chartData, metric]);

  const barWidth = Math.max(3, Math.min(18, (chartInnerWidth / range) * 0.72));
  const slotWidth = chartInnerWidth / range;

  // Y-axis tick intervals (4 lines)
  const yTicks = [
    maxMetricValue,
    Math.round(maxMetricValue * 0.66),
    Math.round(maxMetricValue * 0.33),
    0
  ];

  // X-axis label step interval to avoid crowding
  const labelStep = range === 7 ? 1 : range === 14 ? 3 : 6;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3.5 transition-colors">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Activity & Focus Graph
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {range}-day daily distribution like web dashboard
            </p>
          </div>
        </div>

        {/* Metric & Range Selectors */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* XP vs Time Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              onClick={() => { setMetric('xp'); setSelectedDay(null); }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                metric === 'xp'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>XP</span>
            </button>
            <button
              onClick={() => { setMetric('time'); setSelectedDay(null); }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                metric === 'time'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3 h-3 text-cyan-500" />
              <span>Time</span>
            </button>
          </div>

          {/* Range Pills (7D / 14D / 30D) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            {([7, 14, 30] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => { setRange(r); setSelectedDay(null); }}
                className={`px-2 py-1 rounded-md transition-all ${
                  range === r
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {r}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">Total {metric === 'xp' ? 'XP' : 'Hours'}</span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
            {metric === 'xp' ? `${stats.totalXp.toLocaleString()} XP` : `${stats.totalHours} hrs`}
          </span>
        </div>
        <div className="border-x border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">Daily Avg</span>
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
            {metric === 'xp' ? `${stats.avgValue} XP` : `${stats.avgValue}m`}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">Peak Day</span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
            {stats.peakDay ? (metric === 'xp' ? `${stats.peakDay.xp} XP` : `${stats.peakDay.minutes}m`) : '0'}
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Gradient for XP Bars */}
            <linearGradient id="xpBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            {/* Gradient for Time Bars */}
            <linearGradient id="timeBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Highlighted active bar gradient */}
            <linearGradient id="activeBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((val) => {
            const y = paddingTop + chartInnerHeight - (val / maxMetricValue) * chartInnerHeight;
            const labelStr = metric === 'xp' ? `${val}` : val >= 60 ? `${(val / 60).toFixed(0)}h` : `${val}m`;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[9px] font-mono font-medium"
                >
                  {labelStr}
                </text>
              </g>
            );
          })}

          {/* Average Reference Line (Dashed) */}
          {stats.avgValue > 0 && (
            <line
              x1={paddingLeft}
              y1={paddingTop + chartInnerHeight - (stats.avgValue / maxMetricValue) * chartInnerHeight}
              x2={width - paddingRight}
              y2={paddingTop + chartInnerHeight - (stats.avgValue / maxMetricValue) * chartInnerHeight}
              stroke="#f59e0b"
              strokeOpacity="0.45"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
          )}

          {/* Bars */}
          {chartData.map((day, idx) => {
            const val = metric === 'xp' ? day.xp : day.minutes;
            const barHeight = val > 0 ? Math.max(4, (val / maxMetricValue) * chartInnerHeight) : 2;
            const x = paddingLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = paddingTop + chartInnerHeight - barHeight;
            const isSelected = selectedDay?.dateKey === day.dateKey;
            const isToday = idx === chartData.length - 1;

            return (
              <g
                key={day.dateKey}
                className="cursor-pointer group"
                onClick={() => setSelectedDay(isSelected ? null : day)}
              >
                {/* Invisible wider touch hitbox */}
                <rect
                  x={paddingLeft + idx * slotWidth}
                  y={paddingTop}
                  width={slotWidth}
                  height={chartInnerHeight + paddingBottom}
                  fill="transparent"
                />

                {/* Actual Visual Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={Math.min(3, barWidth / 2)}
                  fill={
                    isSelected
                      ? 'url(#activeBarGradient)'
                      : val === 0
                      ? 'currentColor'
                      : metric === 'xp'
                      ? 'url(#xpBarGradient)'
                      : 'url(#timeBarGradient)'
                  }
                  fillOpacity={val === 0 ? 0.08 : 1}
                  className="transition-all duration-200 group-hover:opacity-80"
                />

                {/* Subtle indicator dot for Today */}
                {isToday && (
                  <circle
                    cx={x + barWidth / 2}
                    cy={paddingTop + chartInnerHeight + 16}
                    r="1.8"
                    className="fill-indigo-600 dark:fill-indigo-400"
                  />
                )}

                {/* X-axis date labels */}
                {idx % labelStep === 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={paddingTop + chartInnerHeight + 14}
                    textAnchor="middle"
                    className={`text-[8.5px] font-sans ${
                      isSelected
                        ? 'fill-amber-500 font-bold'
                        : isToday
                        ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {day.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Interactive Floating Tooltip (Shown when bar is tapped/selected) */}
        {selectedDay && (
          <div className="mt-2 p-2.5 bg-slate-900 dark:bg-slate-950 text-white rounded-xl shadow-lg border border-slate-700/80 animate-in fade-in slide-in-from-top-1 duration-150 flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">
                {selectedDay.fullDate}
              </div>
              <div className="font-bold flex items-center gap-2 mt-0.5">
                <span className="text-amber-400 font-mono">⚡ {selectedDay.xp} XP</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-400 font-mono">⏱️ {selectedDay.minutes} min</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                {selectedDay.sessionCount} {selectedDay.sessionCount === 1 ? 'session' : 'sessions'}
              </span>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          <span>Tap any bar to inspect daily sessions</span>
        </span>
        <span className="font-medium text-slate-500 dark:text-slate-400">
          {stats.activeDays} of {range} days active
        </span>
      </div>
    </div>
  );
};
