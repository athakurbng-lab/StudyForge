import { ChevronLeft, ChevronRight, Flame, Snowflake, Award, BookOpen } from 'lucide-react';
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
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
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
  currentUser,
  onOpenAuth
}) => {
  const currentExamConfig = EXAMS_DATA[activeExam];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-safe pb-2.5 sticky top-0 z-30 shadow-xs transition-colors">
      {/* Top Row: Exam Selector & Gamification Stats */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="relative flex-1 max-w-[210px]">
          <label className="sr-only" htmlFor="exam-select">Select Exam</label>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <select
              id="exam-select"
              value={activeExam}
              onChange={(e) => onSelectExam(e.target.value as ExamType)}
              className="bg-transparent border-none outline-hidden cursor-pointer text-xs font-semibold w-full truncate"
            >
              <option value="upsc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                🏛️ UPSC 2027 (CivilsPath)
              </option>
              <option value="neet_pg" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                🩺 NEET PG 2027 (MedTrack)
              </option>
              <option value="banking" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                🏦 Banking 2027 (BankPrep)
              </option>
            </select>
          </div>
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
    </header>
  );
};
