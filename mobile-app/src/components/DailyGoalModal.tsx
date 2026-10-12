import React, { useState } from 'react';
import { Target, X, Check, Sparkles, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  todayXp: number;
  onSaveGoal: (newGoal: number) => Promise<void> | void;
}

const PRESET_GOALS = [30, 50, 75, 100, 150, 200];

export const DailyGoalModal: React.FC<DailyGoalModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  todayXp,
  onSaveGoal
}) => {
  const [selectedGoal, setSelectedGoal] = useState<number>(currentGoal || 50);
  const [customInput, setCustomInput] = useState<string>(currentGoal.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const percent = Math.min(100, Math.round((todayXp / Math.max(1, selectedGoal)) * 100));
  const isGoalReached = todayXp >= selectedGoal;

  const handleSelectPreset = (g: number) => {
    setSelectedGoal(g);
    setCustomInput(g.toString());
    setSavedSuccess(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 10 && parsed <= 1000) {
      setSelectedGoal(parsed);
    }
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    const finalGoal = Math.max(10, Math.min(1000, selectedGoal));
    setIsSaving(true);
    try {
      await onSaveGoal(finalGoal);
      setSavedSuccess(true);
      if (todayXp >= finalGoal) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
      setTimeout(() => {
        onClose();
        setSavedSuccess(false);
      }, 700);
    } catch (err) {
      console.error('Failed to save daily goal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Daily XP Goal
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Set and track your daily study target
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

        {/* Current Progress Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className={`w-4 h-4 ${isGoalReached ? 'text-amber-500 fill-amber-500' : 'text-emerald-500'}`} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Today's Progress</span>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {todayXp} / {selectedGoal} XP ({percent}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isGoalReached
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {isGoalReached ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Daily goal achieved! Excellent discipline!
              </span>
            ) : (
              <span>Earn <strong>{Math.max(0, selectedGoal - todayXp)} more XP</strong> today to hit your target.</span>
            )}
          </p>
        </div>

        {/* Quick Goal Preset Chips */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Target Presets
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_GOALS.map((g) => {
              const isSelected = selectedGoal === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSelectPreset(g)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{g} XP</span>
                  <span className="text-[9px] font-normal text-slate-400">
                    {g <= 50 ? 'Casual' : g <= 100 ? 'Standard' : 'Intensive'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Goal Input */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Or Custom Goal (10 - 1000 XP)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={1000}
              value={customInput}
              onChange={handleCustomChange}
              placeholder="e.g. 80"
              className="flex-1 px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-emerald-500"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">XP / day</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" />
                <span>Set Goal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
