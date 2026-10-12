import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Layers, Check } from 'lucide-react';
import { SubjectModule, ExamType } from '../data/exams';
import { StudySession } from '../services/storageService';

interface ByIntentionViewProps {
  exam: ExamType;
  modules: SubjectModule[];
  sessions: StudySession[];
  onAddModule: (newModule: SubjectModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onQuickLogSession: (module: SubjectModule) => void;
}

export const ByIntentionView: React.FC<ByIntentionViewProps> = ({
  exam,
  modules,
  sessions,
  onAddModule,
  onDeleteModule,
  onQuickLogSession,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newCategory, setNewCategory] = useState('Core Subject');
  const [newColor, setNewColor] = useState('#e11d48');

  // Compute duration and sessions per module
  const moduleStats = modules.map((mod) => {
    const modSessions = sessions.filter((s) => s.moduleId === mod.id);
    const totalMinutes = modSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const sessionCount = modSessions.length;
    return {
      module: mod,
      minutes: totalMinutes,
      sessionCount,
    };
  });

  const allMinutes = moduleStats.reduce((acc, m) => acc + m.minutes, 0);

  const formatHoursMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m.toString().padStart(2, '0')}min`;
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;

    const id = `custom_${Date.now()}`;
    const created: SubjectModule = {
      id,
      name: newModuleName.trim(),
      category: newCategory.trim() || 'Custom',
      color: newColor,
      topics: [
        { id: `${id}_t1`, name: 'Topic 1: Fundamental Concepts', status: 'not_started', confidence: 3 },
        { id: `${id}_t2`, name: 'Topic 2: Advanced Analysis & PYQs', status: 'not_started', confidence: 2 },
      ]
    };

    onAddModule(created);
    setNewModuleName('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Header Row: "By Intention" + "+ Add Syllabus Bar" */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <span>By Intention</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold lowercase">
            {modules.length} bars
          </span>
        </h2>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Syllabus Bar</span>
        </button>
      </div>

      {/* Module Bars List matching Screenshot 1 */}
      <div className="space-y-3.5">
        {moduleStats.map(({ module, minutes, sessionCount }) => {
          const percentage = allMinutes > 0 ? Math.round((minutes / allMinutes) * 100) : 0;

          return (
            <div key={module.id} className="group relative">
              {/* Top Label: Title, Percentage, Session count, Time */}
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 truncate max-w-[55%]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: module.color || '#e11d48' }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {module.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {percentage}%
                  </span>
                  <span>|</span>
                  <span>{sessionCount} sess</span>
                  <span>|</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatHoursMinutes(minutes)}
                  </span>

                  {/* Actions: Log Session / Delete */}
                  <div className="flex items-center gap-1 ml-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onQuickLogSession(module)}
                      title="Log Study Session for this Syllabus Bar (+XP)"
                      className="p-1 rounded-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteModule(module.id)}
                      title="Delete this syllabus bar"
                      className="p-1 rounded-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar matching Screenshot 1 */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(percentage, minutes > 0 ? 5 : 0)}%`,
                    backgroundColor: module.color || '#e11d48'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Syllabus Bar Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-500" />
              Add Custom Syllabus Bar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add any custom syllabus subject or optional paper. Every session logged here will earn XP via the Gemini API!
            </p>

            <form onSubmit={handleCreateModule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Syllabus Bar / Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anthropology Paper 1, Quant Mock Drills"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category / Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. Optional Mains, Speed Section, Clinical"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bar Accent Color
                </label>
                <div className="flex items-center gap-2.5">
                  {['#e11d48', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center ${
                        newColor === c ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {newColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-xs transition-colors"
                >
                  Create Bar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
