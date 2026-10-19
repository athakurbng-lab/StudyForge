import React from 'react';
import { Sparkles, Sliders, RotateCcw, Info, CheckCircle2 } from 'lucide-react';
import { calculateSessionXP } from '../services/storageService';

export interface EvaluationCriterion {
  key: string;
  name: string;
  shortName: string;
  icon: string;
  question: string;
  description: string;
}

export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    key: 'evalProductivity',
    name: 'Productivity / Work Volume',
    shortName: 'Productivity',
    icon: '📈',
    question: 'How much work did you produce compared with your personal baseline?',
    description: 'Measured against your own typical pace on comparable tasks, not raw volume alone.'
  },
  {
    key: 'evalDifficulty',
    name: 'Difficulty & Complexity',
    shortName: 'Difficulty',
    icon: '🧠',
    question: 'How challenging and complex was the material or task?',
    description: '1-2: Routine, 3-4: Relatively easy, 5-6: Moderate, 7-8: Difficult, 9-10: Exceptionally complex.'
  },
  {
    key: 'evalAccuracy',
    name: 'Accuracy & Correctness',
    shortName: 'Accuracy',
    icon: '🎯',
    question: 'How many answers, calculations, or results were correct?',
    description: 'Based on answer keys, factual correctness, and error-free execution.'
  },
  {
    key: 'evalDepth',
    name: 'Depth of Work',
    shortName: 'Depth',
    icon: '🔬',
    question: 'How deeply was the subject or concept explored?',
    description: 'Distinguish between merely reading vs understanding underlying logic and exceptions.'
  },
  {
    key: 'evalMastery',
    name: 'Demonstrated Mastery',
    shortName: 'Mastery',
    icon: '🏆',
    question: 'Can you recall and explain the core concepts without looking at notes?',
    description: 'Closed-book recall, spontaneous synthesis, or clear conceptual explanation.'
  },
  {
    key: 'evalApplication',
    name: 'Application to Unfamiliar Problems',
    shortName: 'Application',
    icon: '💡',
    question: 'Can you apply knowledge to new questions or real scenarios?',
    description: 'Testing against fresh PYQs, unseen problem sets, or case scenarios.'
  },
  {
    key: 'evalOutputQuality',
    name: 'Output Quality & Organization',
    shortName: 'Quality',
    icon: '📝',
    question: 'How clear, structured, and usable are your notes or solutions?',
    description: 'Clarity, conciseness, visual organization, and future revision usability.'
  },
  {
    key: 'evalProblemSolving',
    name: 'Problem-Solving & Method',
    shortName: 'Problem-Solving',
    icon: '⚡',
    question: 'How effectively did you solve challenging obstacles or adopt better approaches?',
    description: 'Demonstrating effective, reasoned methods rather than brute-force memorization.'
  },
  {
    key: 'evalIndependence',
    name: 'Independence & Self-Reliance',
    shortName: 'Independence',
    icon: '🦅',
    question: 'How much did you accomplish without prompts, hints, or assistance?',
    description: 'Independent problem-solving vs relying heavily on solutions or guidance.'
  },
  {
    key: 'evalGoalRelevance',
    name: 'Goal Relevance & Impact',
    shortName: 'Relevance',
    icon: '🎯',
    question: 'How directly does this session contribute to your target exam score?',
    description: 'High-yield syllabus topics, core exam requirements, and weak-area mastery.'
  }
];

export interface EvaluationScores {
  evalProductivity: number;
  evalDifficulty: number;
  evalAccuracy: number;
  evalDepth: number;
  evalMastery: number;
  evalApplication: number;
  evalOutputQuality: number;
  evalProblemSolving: number;
  evalIndependence: number;
  evalGoalRelevance: number;
}

export const DEFAULT_EVAL_SCORES: EvaluationScores = {
  evalProductivity: 5,
  evalDifficulty: 5,
  evalAccuracy: 5,
  evalDepth: 5,
  evalMastery: 5,
  evalApplication: 5,
  evalOutputQuality: 5,
  evalProblemSolving: 5,
  evalIndependence: 5,
  evalGoalRelevance: 5
};

interface EvaluationSlidersProps {
  scores: EvaluationScores;
  onChange: (key: keyof EvaluationScores, value: number) => void;
  onSetAll?: (scores: EvaluationScores) => void;
  durationMinutes: number;
  mode: 'manual' | 'ai';
  onModeToggle?: (mode: 'manual' | 'ai') => void;
  isEvaluatingAi?: boolean;
  onTriggerAi?: () => void;
  canTriggerAi?: boolean;
  readOnly?: boolean;
}

export const EvaluationSliders: React.FC<EvaluationSlidersProps> = ({
  scores,
  onChange,
  onSetAll,
  durationMinutes,
  mode,
  onModeToggle,
  isEvaluatingAi = false,
  onTriggerAi,
  canTriggerAi = true,
  readOnly = false
}) => {
  const totalMarks = Object.values(scores).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const focusedHours = durationMinutes / 60;
  const calculatedXP = calculateSessionXP(durationMinutes, totalMarks);

  const getScoreBadgeColor = (val: number) => {
    if (val >= 9) return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    if (val >= 7) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    if (val >= 4) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  };

  const getScoreTrackColor = (val: number) => {
    if (val >= 8) return 'accent-emerald-600';
    if (val >= 5) return 'accent-indigo-600';
    if (val >= 3) return 'accent-amber-500';
    return 'accent-rose-500';
  };

  const handleResetToBaseline = () => {
    if (onSetAll) {
      onSetAll({ ...DEFAULT_EVAL_SCORES });
    } else {
      EVALUATION_CRITERIA.forEach(c => {
        onChange(c.key as keyof EvaluationScores, 5);
      });
    }
  };

  return (
    <div className="space-y-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              10-Criteria Evaluation
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Rate each factor from 1 to 10. Marks sum to 100.
          </p>
        </div>

        {/* Mode Selector Pill */}
        {onModeToggle && (
          <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onModeToggle('manual')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                mode === 'manual'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Self-Rating (Default)</span>
            </button>
            <button
              type="button"
              onClick={() => onModeToggle('ai')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                mode === 'ai'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Evaluator</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Mode Banner if selected */}
      {mode === 'ai' && onTriggerAi && (
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="text-[11px] text-indigo-900 dark:text-indigo-200">
              <span className="font-bold">AI Auto-Scoring Mode:</span> Analyzes notes & auto-calibrates the 10 criteria.
            </div>
          </div>
          <button
            type="button"
            onClick={onTriggerAi}
            disabled={isEvaluatingAi || !canTriggerAi}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all active:scale-95"
          >
            {isEvaluatingAi ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Evaluate Notes</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 10 Sliders List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {EVALUATION_CRITERIA.map((criterion, idx) => {
          const currentVal = Number(scores[criterion.key as keyof EvaluationScores]) || 5;

          return (
            <div
              key={criterion.key}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-1.5"
            >
              {/* Criterion Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{criterion.icon}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {idx + 1}. {criterion.name}
                  </span>
                </div>
                <div className={`px-2 py-0.5 rounded-lg text-xs font-black border ${getScoreBadgeColor(currentVal)}`}>
                  {currentVal} / 10
                </div>
              </div>

              {/* Guiding Question */}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {criterion.question}
              </p>

              {/* Range Slider */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] font-bold text-slate-400">1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={currentVal}
                  disabled={readOnly}
                  onChange={(e) => onChange(criterion.key as keyof EvaluationScores, Number(e.target.value))}
                  className={`w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer ${getScoreTrackColor(currentVal)}`}
                />
                <span className="text-[10px] font-bold text-slate-400">10</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action & Reset */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleResetToBaseline}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All to Neutral (5)</span>
        </button>

        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          Evaluation Marks: <strong className="text-indigo-600 dark:text-indigo-400 text-xs font-black">{totalMarks} / 100</strong>
        </span>
      </div>

      {/* Live XP Formula Calculation Card */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 block">
            Verified Formula: Focused Hours × Evaluation Marks
          </span>
          <div className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
            <span className="font-semibold">{focusedHours.toFixed(2)}h</span> ({durationMinutes}m) × <span className="font-semibold">{totalMarks} marks</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
            Total XP Earned
          </span>
          <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">
            +{calculatedXP} <span className="text-xs font-bold">XP</span>
          </span>
        </div>
      </div>
    </div>
  );
};
