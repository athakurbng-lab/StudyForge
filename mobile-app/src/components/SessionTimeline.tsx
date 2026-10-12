import React, { useState } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { StudySession } from '../services/storageService';

interface SessionTimelineProps {
  sessions: StudySession[];
  showNotesOnly: boolean;
  onOpenLogSession?: () => void;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ sessions, showNotesOnly, onOpenLogSession }) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const filteredSessions = showNotesOnly
    ? sessions.filter(s => s.notes && s.notes.trim().length > 0)
    : sessions;

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const getMoodIcon = (mood: StudySession['mood']) => {
    switch (mood) {
      case 'focused':
        return <span title="Deeply Focused" className="text-base">🤩</span>;
      case 'neutral':
        return <span title="Neutral Focus" className="text-base">🙂</span>;
      case 'distracted':
        return <span title="Distracted" className="text-base">😔</span>;
    }
  };

  if (filteredSessions.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            No study sessions logged for this day yet.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Start a timer sprint below, or tap Log Session to record offline study.
          </p>
        </div>
        {onOpenLogSession && (
          <button
            onClick={onOpenLogSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <span>⚡</span>
            <span>+ Log Study Session</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Session Timeline ({filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'})
        </h3>
        {onOpenLogSession && (
          <button
            onClick={onOpenLogSession}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>+ Log Session</span>
          </button>
        )}
      </div>

      <div className="relative pl-4 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
        {filteredSessions.map((session) => {
          const isExpanded = expandedSessionId === session.id;

          return (
            <div key={session.id} className="relative group">
              {/* Timeline Bullet */}
              <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-white dark:ring-slate-900" />

              {/* Session Card matching Screenshot 2 */}
              <div
                onClick={() => toggleExpand(session.id)}
                className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  {/* Time Range */}
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {session.startTime} → {session.endTime}
                    <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                      ({Math.floor(session.durationMinutes / 60)}h {session.durationMinutes % 60}m)
                    </span>
                  </span>

                  {/* Mood & XP */}
                  <div className="flex items-center gap-2">
                    {getMoodIcon(session.mood)}
                    <span className="flex items-center gap-0.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-sm">
                      <Sparkles className="w-3 h-3" />
                      +{session.xpEarned} XP
                    </span>
                  </div>
                </div>

                {/* Module & Topic Header */}
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 truncate">
                  <span className="truncate">{session.moduleName}</span>
                  {session.topicName && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                        {session.topicName}
                      </span>
                    </>
                  )}
                </div>

                {/* Notes preview */}
                {session.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                    {session.notes}
                  </p>
                )}

                {/* Expanded AI Evaluation Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 animate-in fade-in duration-200">
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-lg p-2.5 text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold mb-1 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Gemini 2.5 Flash Evaluation</span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed">
                        {session.aiFeedback || 'High retention observed. Concepts synthesized effectively with solid focus stamina.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
