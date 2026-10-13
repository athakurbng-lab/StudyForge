import React, { useState } from 'react';
import { X, Sparkles, Clock, BookOpen, CheckCircle, AlertCircle, Globe, Lock } from 'lucide-react';
import { ExamType, SubjectModule } from '../data/exams';
import { StudySession } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import confetti from 'canvas-confetti';

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamType;
  modules: SubjectModule[];
  onSessionCompleted: (session: StudySession) => void;
}

export const LogSessionModal: React.FC<LogSessionModalProps> = ({
  isOpen,
  onClose,
  exam,
  modules,
  onSessionCompleted
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [topicName, setTopicName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<'focused' | 'neutral' | 'distracted'>('focused');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentModule = modules.find(m => m.id === selectedModuleId) || modules[0];

  const quickDurations = [15, 25, 45, 60, 90, 120];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim().length < 10) {
      setError('Please provide at least 10 characters describing what you studied.');
      return;
    }
    setError(null);
    setIsEvaluating(true);

    try {
      const now = new Date();
      const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const startTimeObj = new Date(now.getTime() - durationMinutes * 60000);
      const startTimeStr = startTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Run AI evaluation
      const evalResult = await GeminiService.evaluateSession({
        exam,
        subject: currentModule?.category || 'General',
        moduleName: currentModule?.name || 'Study Session',
        topicName: topicName.trim() || undefined,
        durationMinutes,
        notes: notes.trim(),
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
        notes: notes.trim(),
        aiFeedback: evalResult.feedback,
        date: now.toISOString().split('T')[0],
        category: currentModule?.category || 'General',
        apiError: evalResult.apiError,
        usedFallback: evalResult.usedFallback,
        modelUsed: evalResult.modelUsed,
        isShared
      };

      onSessionCompleted(newSession);

      try {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
      } catch {}

      // Reset form and close
      setNotes('');
      setTopicName('');
      setDurationMinutes(30);
      setIsEvaluating(false);
      onClose();
    } catch (err: any) {
      setIsEvaluating(false);
      setError(err?.message || 'Error evaluating session. Saved offline.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Log Study Session
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Record your offline study sprint with AI evaluation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Module / Subject Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Subject Module
            </label>
            <div className="relative">
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {modules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specific Topic (Optional) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Specific Topic (Optional)
            </label>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Fundamental Rights, Thermodynamics, Ratio & Proportion"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Duration Chips & Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Duration (Minutes)
              </label>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                {durationMinutes} min ({Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickDurations.map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    durationMinutes === mins
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Notes / What Did You Study */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              What did you study? (Notes & Takeaways)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Read 35 pages of Laxmikanth, solved 20 MCQ questions on Parliament, revised Article 19 exceptions..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
            <span className="text-[10px] text-slate-400">
              Minimum 10 characters for AI assessment.
            </span>
          </div>

          {/* Focus Quality / Mood Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Focus Quality & Mood
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMood('focused')}
                className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  mood === 'focused'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">🤩</span>
                <span className="text-[11px] font-bold">Deep Focus</span>
              </button>

              <button
                type="button"
                onClick={() => setMood('neutral')}
                className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  mood === 'neutral'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">🙂</span>
                <span className="text-[11px] font-bold">Moderate</span>
              </button>

              <button
                type="button"
                onClick={() => setMood('distracted')}
                className={`py-2 px-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  mood === 'distracted'
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">😔</span>
                <span className="text-[11px] font-bold">Distracted</span>
              </button>
            </div>
          </div>

          {/* Privacy & Sharing Selector */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isShared ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {isShared ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {isShared ? 'Public Log (Visible to Friends)' : 'Private Log (Restricted)'}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block">
                  {isShared
                    ? 'Friends and group members can read notes & feedback'
                    : 'Requires Watcher status or your approval to view'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsShared(!isShared)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isShared ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isShared ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isEvaluating}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEvaluating || notes.trim().length < 10}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              {isEvaluating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Evaluate & Save Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogSessionModal;
