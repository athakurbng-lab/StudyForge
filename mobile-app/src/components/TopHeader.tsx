import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Snowflake, Award, BookOpen, Target, ChevronDown, X, Check } from 'lucide-react';
import { ExamType, EXAMS_DATA } from '../data/exams';
import { AuthUser } from '../services/apiService';

interface TopHeaderProps {
  currentDateText: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  activeExam: ExamType;
  onSelectExam: (exam: ExamType) => void;
  streak: number;
  freezeTokens: number;
  totalXp: number;
  dailyGoal?: number;
  todayXp?: number;
  onOpenDailyGoal?: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  onOpenLogSession?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentDateText,
  onPrevDay,
  onNextDay,
  activeExam,
  onSelectExam,
  streak,
  freezeTokens,
  totalXp,
  dailyGoal = 50,
  todayXp = 0,
  onOpenDailyGoal,
  currentUser,
  onOpenAuth,
  onOpenLogSession
}) => {
  const [isExamPickerOpen, setIsExamPickerOpen] = useState(false);
  const currentExamConfig = EXAMS_DATA[activeExam];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-safe pb-2.5 sticky top-0 z-30 shadow-xs transition-colors">
      {/* Top Row: Exam Selector & Gamification Stats */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="relative flex-1 max-w-[210px]">
          <button
            type="button"
            onClick={() => setIsExamPickerOpen(true)}
            className="w-full flex items-center justify-between gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold active:scale-95 transition-all text-left shadow-xs cursor-pointer"
            title="Tap to switch stream (UPSC, NEET PG, Banking)"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">
                {activeExam === 'upsc' ? '🏛️ UPSC 2027' : activeExam === 'neet_pg' ? '🩺 NEET PG' : '🏦 Banking 2027'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Gamification Pills */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-400 text-xs font-bold" title="Current Active Streak">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streak}d</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-md text-sky-700 dark:text-sky-400 text-xs font-bold" title="Streak Freeze Tokens">
            <Snowflake className="w-3.5 h-3.5 text-sky-500" />
            <span>{freezeTokens}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-md text-indigo-700 dark:text-indigo-400 text-xs font-bold" title="StudyForge Total XP">
            <Award className="w-3.5 h-3.5 text-indigo-500" />
            <span>{totalXp.toLocaleString()}</span>
          </div>

          {/* Daily XP Goal Pill */}
          <button
            type="button"
            onClick={onOpenDailyGoal}
            className={`flex items-center gap-1 px-2 py-1 border rounded-md text-xs font-bold active:scale-95 transition-all ${
              todayXp >= dailyGoal
                ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            }`}
            title="Daily XP Goal (Tap to set/edit)"
          >
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>{todayXp}/{dailyGoal}</span>
          </button>

          {/* + Log Session Action Button */}
          {onOpenLogSession && (
            <button
              type="button"
              onClick={onOpenLogSession}
              className="px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-2xs flex items-center gap-1 active:scale-95 transition-all"
              title="Log Study Session manually"
            >
              <span>+ Log</span>
            </button>
          )}

          {/* Profile / Cloud Sync Button */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="p-1 rounded-md transition-transform active:scale-95"
              title={currentUser ? `Logged in as ${currentUser.displayName || currentUser.username}` : 'Sign In to Cloud'}
            >
              {currentUser ? (
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center ring-2 ring-emerald-400">
                  {(currentUser.displayName || currentUser.username).slice(0, 1).toUpperCase()}
                </div>
              ) : (
                <div className="px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-bold">
                  Login
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Date Navigation Bar matching Screenshot 1: < Wed, 7 Oct > */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevDay}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {currentDateText}
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {currentExamConfig.title}
          </p>
        </div>

        <button
          onClick={onNextDay}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Exam Switcher Bottom Sheet Modal */}
      {isExamPickerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsExamPickerOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl pb-safe-content max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Select Exam Stream</h3>
                  <p className="text-[11px] text-slate-400">Syllabus, modules & studio adapt instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExamPickerOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'upsc' as ExamType,
                  icon: '🏛️',
                  title: 'UPSC Civil Services 2027',
                  badge: 'CivilsPath',
                  desc: 'Prelims GS 1 & CSAT, Mains GS 1-4, Essay & Anthropology Optional'
                },
                {
                  id: 'neet_pg' as ExamType,
                  icon: '🩺',
                  title: 'NEET PG 2027',
                  badge: 'MedTrack',
                  desc: 'Clinical, Para-Clinical & Pre-Clinical High-Yield Medical Modules'
                },
                {
                  id: 'banking' as ExamType,
                  icon: '🏦',
                  title: 'Banking 2027',
                  badge: 'BankPrep',
                  desc: 'Quantitative Aptitude, Reasoning, English Language, General & Banking Awareness'
                }
              ].map((item) => {
                const isSelected = activeExam === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectExam(item.id);
                      setIsExamPickerOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 active:scale-[0.98] cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
