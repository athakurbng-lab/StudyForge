"use client";

import React, { useState } from 'react';
import { Target, Pencil, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DailyGoalWidgetProps {
  todayXp: number;
  initialGoal: number;
}

export function DailyGoalWidget({ todayXp, initialGoal }: DailyGoalWidgetProps) {
  const router = useRouter();
  const [goal, setGoal] = useState<number>(initialGoal);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [newGoalInput, setNewGoalInput] = useState<string>(initialGoal.toString());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const progress = Math.min(100, Math.round((todayXp / goal) * 100));

  const quickGoals = [30, 50, 75, 100, 150, 200];

  const handleSaveGoal = async (targetValue?: number) => {
    const val = targetValue !== undefined ? targetValue : parseInt(newGoalInput, 10);
    if (isNaN(val) || val < 10 || val > 1000) {
      setError('Goal must be between 10 and 1000 XP');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/user/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyXpGoal: val })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update goal');
      }

      setGoal(data.dailyXpGoal);
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error updating goal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full sm:w-72 bg-black/30 rounded-xl p-4 border border-white/10 relative">
      <div className="flex justify-between items-center text-sm mb-2">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Target className="w-3.5 h-3.5 text-indigo-400" />
          <span>Daily Goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-indigo-400">{todayXp} / {goal} XP</span>
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setNewGoalInput(goal.toString());
              setError(null);
            }}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            title="Edit Daily XP Goal"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden mb-1">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-3 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="text-[10px] text-slate-400 text-right font-medium">
        {progress}% completed today
      </div>

      {/* Inline Goal Editor Modal / Popover */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-in fade-in duration-150">
          <div className="text-xs text-slate-300 font-medium">Set Daily XP Target:</div>
          <div className="flex flex-wrap gap-1.5">
            {quickGoals.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => handleSaveGoal(q)}
                disabled={isSaving}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  goal === q 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              min="10"
              max="1000"
              value={newGoalInput}
              onChange={(e) => setNewGoalInput(e.target.value)}
              className="w-20 bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="XP"
            />
            <button
              onClick={() => handleSaveGoal()}
              disabled={isSaving}
              className="p-1 rounded-lg bg-green-600/30 text-green-400 hover:bg-green-600/50 border border-green-500/40 text-xs font-bold flex items-center gap-1 px-2 transition-colors"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <div className="text-[10px] text-rose-400 mt-1">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
