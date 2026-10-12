import React from 'react';
import { Filter, X, RotateCcw, Check, Calendar, BookOpen, Smile, FileText } from 'lucide-react';
import { SubjectModule } from '../data/exams';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: SubjectModule[];
  availableCategories?: string[];
  selectedModuleId: string | null;
  onSelectModuleId: (id: string | null) => void;
  selectedMood: string | null;
  onSelectMood: (mood: string | null) => void;
  showNotesOnly: boolean;
  onToggleShowNotesOnly: (val: boolean) => void;
  dateFilterEnabled: boolean;
  onToggleDateFilter: (val: boolean) => void;
  selectedDate: string;
  onResetFilters: () => void;
  activeFilterCount: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  modules,
  selectedModuleId,
  onSelectModuleId,
  selectedMood,
  onSelectMood,
  showNotesOnly,
  onToggleShowNotesOnly,
  dateFilterEnabled,
  onToggleDateFilter,
  selectedDate,
  onResetFilters,
  activeFilterCount
}) => {
  if (!isOpen) return null;

  const moods = [
    { id: 'focused', label: '🤩 Deeply Focused' },
    { id: 'neutral', label: '🙂 Neutral' },
    { id: 'distracted', label: '😔 Distracted' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Filter Sessions</span>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    {activeFilterCount} active
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Filter your timeline by subject, mood, or date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Date Scope */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date Scope</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleDateFilter(true)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                dateFilterEnabled
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
              }`}
            >
              Selected Date ({selectedDate})
            </button>
            <button
              type="button"
              onClick={() => onToggleDateFilter(false)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                !dateFilterEnabled
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Days (Complete History)
            </button>
          </div>
        </div>

        {/* 2. Subject / Module Filter */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Subject / Module</span>
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onSelectModuleId(null)}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                selectedModuleId === null
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Subjects
            </button>
            {modules.map((mod) => {
              const isSelected = selectedModuleId === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModuleId(isSelected ? null : mod.id)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all truncate max-w-[170px] ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={{
                    borderLeftColor: isSelected ? undefined : mod.color,
                    borderLeftWidth: isSelected ? undefined : '3px'
                  }}
                >
                  {mod.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Mood / Focus Filter */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Smile className="w-3.5 h-3.5 text-slate-400" />
            <span>Focus & Mood</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectMood(null)}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                selectedMood === null
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Moods
            </button>
            {moods.map((m) => {
              const isSelected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMood(isSelected ? null : m.id)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all text-center ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Notes Only Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Show Notes Only
              </span>
              <p className="text-[10px] text-slate-400">
                Hide sessions without study notes
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showNotesOnly}
              onChange={(e) => onToggleShowNotesOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Filters ({activeFilterCount > 0 ? activeFilterCount : 'All'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
