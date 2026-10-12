import React, { useState } from 'react';
import { PenTool, Sparkles, Send, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExamType } from '../data/exams';
import { GeminiService } from '../services/geminiService';
import { StudySession } from '../services/storageService';

interface AnswerWritingStudioProps {
  exam: ExamType;
  onSessionCompleted: (session: StudySession) => void;
}

export const AnswerWritingStudio: React.FC<AnswerWritingStudioProps> = ({
  exam,
  onSessionCompleted
}) => {
  const [question, setQuestion] = useState(
    exam === 'upsc'
      ? 'Q. Critically examine the concept of "Cultural Relativism" and discuss its relevance in contemporary human rights debates, citing anthropological thinkers.'
      : exam === 'neet_pg'
      ? 'Case: A 3-year-old child presents with sudden onset barking cough, inspiratory stridor, and hoarseness. X-ray shows steeple sign. Discuss etiology, differential, and immediate management.'
      : 'Drill: Solve 5 high-level quadratic inequalities and 5 missing term number series under 10 minutes.'
  );

  const [studentAnswer, setStudentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    score: number;
    feedback: string;
    xp: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswer.trim()) return;

    setIsSubmitting(true);
    setEvalResult(null);

    const now = new Date();
    const result = await GeminiService.evaluateSession({
      exam,
      subject: exam === 'upsc' ? 'Mains Answer Writing' : exam === 'neet_pg' ? 'Clinical Vignette' : 'Speed Drill',
      moduleName: exam === 'upsc' ? 'Anthropology Paper 1 Studio' : exam === 'neet_pg' ? 'Clinical Case Studio' : 'Speed Studio',
      topicName: 'Mains Practice / Vignette',
      durationMinutes: 20,
      notes: `Question: ${question}\n\nAnswer: ${studentAnswer}`,
    });

    const session: StudySession = {
      id: `studio-${Date.now()}`,
      exam,
      moduleId: 'studio',
      moduleName: exam === 'upsc' ? 'Mains Answer Writing Studio' : 'Specialized Studio',
      startTime: 'Studio',
      endTime: 'Evaluated',
      durationMinutes: 20,
      xpEarned: result.xp + 40, // Bonus for full answer writing
      mood: 'focused',
      notes: `Studio submission: ${studentAnswer.slice(0, 100)}...`,
      aiFeedback: result.feedback,
      date: now.toISOString().split('T')[0],
      category: 'Studio'
    };

    onSessionCompleted(session);
    setEvalResult({
      score: Math.min(10, Math.round(result.depthScore)),
      feedback: result.feedback,
      xp: result.xp + 40,
    });
    setIsSubmitting(false);

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch {}
  };

  return (
    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-140px)] transition-colors pb-24">
      <div>
        <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-rose-500" />
          <span>
            {exam === 'upsc'
              ? 'Mains & Anthropology Answer Writing Studio'
              : exam === 'neet_pg'
              ? 'Clinical Vignette & Case Studio'
              : 'Speed Pacing & Drill Studio'}
          </span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Instant Gemini 2.5 Flash evaluation with rubric scores & XP rewards
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
          <span>Question Prompt</span>
          <span className="text-[10px] bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
            10 / 15 Marks
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
          {question}
        </p>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Your Response / Solution
          </label>
          <textarea
            rows={7}
            required
            placeholder="Structure your answer with: Introduction, Thinker Citations / Clinical Signs, Case Examples, and Critical Conclusion..."
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
            <span>Words: {studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0}</span>
            <span>Target: 150 - 250 words</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !studentAnswer.trim()}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
              <span>Analyzing Answer via Gemini 2.5 Flash...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit for AI Evaluation & Earn XP</span>
            </>
          )}
        </button>
      </form>

      {/* AI Evaluation Output */}
      {evalResult && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 shadow-md animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
              <Award className="w-4 h-4 text-indigo-500" />
              <span>Gemini Academic Evaluation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                Score: {evalResult.score}/10
              </span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                +{evalResult.xp} XP
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            {evalResult.feedback}
          </p>
        </div>
      )}
    </div>
  );
};
