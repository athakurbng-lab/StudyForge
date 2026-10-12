import React, { useState } from 'react';
import { SubjectModule, TopicProgress, ExamType, EXAMS_DATA } from '../data/exams';
import { Plus, Trash2, CheckCircle2, Circle, Sparkles, BookOpen, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService, StudySession } from '../services/storageService';
import { GeminiService } from '../services/geminiService';

interface SyllabusMasterViewProps {
  exam: ExamType;
  modules: SubjectModule[];
  onAddModule: (newModule: SubjectModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onSessionCompleted: (session: StudySession) => void;
  onModulesUpdated?: () => void;
}

export const SyllabusMasterView: React.FC<SyllabusMasterViewProps> = ({
  exam,
  modules,
  onAddModule,
  onDeleteModule,
  onSessionCompleted,
  onModulesUpdated
}) => {
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(modules[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newCategory, setNewCategory] = useState('Core Subject');
  const [newColor, setNewColor] = useState('#6366f1');
  const [studyingTopic, setStudyingTopic] = useState<{ module: SubjectModule; topic: TopicProgress } | null>(null);
  const [studyNotes, setStudyNotes] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [addingTopicModuleId, setAddingTopicModuleId] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');

  const activeExamConfig = EXAMS_DATA[exam];

  const handleToggleModule = (id: string) => {
    setExpandedModuleId(expandedModuleId === id ? null : id);
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;

    const id = `custom_${Date.now()}`;
    const newMod: SubjectModule = {
      id,
      name: newModuleName.trim(),
      category: newCategory.trim() || 'Custom',
      color: newColor,
      topics: [
        { id: `${id}_t1`, name: 'Topic 1: Foundations & Definitions', status: 'not_started', confidence: 1, pyqCount: 0 },
        { id: `${id}_t2`, name: 'Topic 2: Core Analysis & Case Studies', status: 'not_started', confidence: 1, pyqCount: 0 },
        { id: `${id}_t3`, name: 'Topic 3: PYQs & Answer Mastery', status: 'not_started', confidence: 1, pyqCount: 0 },
      ]
    };

    onAddModule(newMod);
    setNewModuleName('');
    setShowAddModal(false);
    setExpandedModuleId(id);
  };

  const handleAddTopicToModule = (moduleId: string) => {
    if (!newTopicName.trim()) return;
    const newTopic: TopicProgress = {
      id: `${moduleId}_t_${Date.now()}`,
      name: newTopicName.trim(),
      status: 'not_started',
      confidence: 1,
      pyqCount: 0
    };
    StorageService.addTopicToModule(exam, moduleId, newTopic);
    const targetModule = modules.find(m => m.id === moduleId);
    if (targetModule) {
      targetModule.topics.push(newTopic);
    }
    onModulesUpdated?.();
    setNewTopicName('');
    setAddingTopicModuleId(null);
  };

  const handleCompleteTopicStudy = async () => {
    if (!studyingTopic) return;
    setIsEvaluating(true);

    const { module, topic } = studyingTopic;
    const durationMinutes = 30; // standard 30 min completion sprint
    const now = new Date();

    const evalResult = await GeminiService.evaluateSession({
      exam,
      subject: module.category,
      moduleName: module.name,
      topicName: topic.name,
      durationMinutes,
      notes: studyNotes,
    });

    const newSession: StudySession = {
      id: `sess-${Date.now()}`,
      exam,
      moduleId: module.id,
      moduleName: module.name,
      topicId: topic.id,
      topicName: topic.name,
      startTime: 'Session',
      endTime: 'Completed',
      durationMinutes,
      xpEarned: evalResult.xp,
      mood: 'focused',
      notes: studyNotes || `Completed syllabus unit: ${topic.name}`,
      aiFeedback: evalResult.feedback,
      date: now.toISOString().split('T')[0],
      category: module.category
    };

    // Update local topic status in module
    topic.status = 'completed';
    topic.confidence = 5;

    onSessionCompleted(newSession);
    setIsEvaluating(false);
    setStudyingTopic(null);
    setStudyNotes('');

    try {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    } catch {}
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-140px)] transition-colors pb-24">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-rose-500" />
            <span>Syllabus Master Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeExamConfig.badge} • Add/Delete bars freely with full XP sync
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bar</span>
        </button>
      </div>

      {/* Modules List */}
      <div className="space-y-3">
        {modules.map((module) => {
          const isExpanded = expandedModuleId === module.id;
          const completedCount = module.topics.filter(t => t.status === 'completed' || t.status === 'mastered').length;
          const totalCount = module.topics.length || 1;
          const progressPercent = Math.round((completedCount / totalCount) * 100);

          return (
            <div
              key={module.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-all"
            >
              {/* Module Header Bar */}
              <div
                onClick={() => handleToggleModule(module.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: module.color || '#6366f1' }}
                  />
                  <div className="truncate">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {module.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {module.category} • {completedCount}/{totalCount} completed ({progressPercent}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteModule(module.id);
                    }}
                    title="Delete syllabus bar"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: module.color || '#6366f1'
                  }}
                />
              </div>

              {/* Expanded Topics List */}
              {isExpanded && (
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {module.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {topic.status === 'completed' || topic.status === 'mastered' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{topic.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 ml-5">
                          <span className="capitalize">{topic.status.replace('_', ' ')}</span>
                          {topic.pyqCount && <span>• {topic.pyqCount} PYQs</span>}
                          <span>• Confidence: {'⭐'.repeat(topic.confidence || 3)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setStudyingTopic({ module, topic })}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-[11px] font-bold hover:bg-indigo-100 transition-colors shrink-0 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Study (+XP)</span>
                      </button>
                    </div>
                  ))}

                  {/* Add Topic / Unit to this Module */}
                  {addingTopicModuleId === module.id ? (
                    <div className="p-3 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Add New Topic / Chapter to {module.name}
                      </div>
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Kinship Systems, Developmental Milestones..."
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTopicToModule(module.id); }}
                        className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden text-slate-800 dark:text-slate-100"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setAddingTopicModuleId(null); setNewTopicName(''); }}
                          className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddTopicToModule(module.id)}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                        >
                          Save Topic
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAddingTopicModuleId(module.id); setNewTopicName(''); }}
                      className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Topic / Chapter to this Bar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Bar Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-500" />
              Add Custom Syllabus Bar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add any custom subject, optional unit or topic bar to {activeExamConfig.title}.
            </p>

            <form onSubmit={handleCreateModule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Bar Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anthropology Paper 2, Speed Math Tricks"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category / Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. Optional Mains, Speed Drills"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  Create Bar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Study Topic & AI XP Modal */}
      {studyingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Complete & Evaluate Topic
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-3">
              {studyingTopic.module.name} • {studyingTopic.topic.name}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Notes & Concepts Learned
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize key formulas, thinkers, clinical criteria, or theories for Gemini AI evaluation..."
                  value={studyNotes}
                  onChange={(e) => setStudyNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={() => setStudyingTopic(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={handleCompleteTopicStudy}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  {isEvaluating ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating AI XP...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim XP (+150)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
