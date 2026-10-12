import React, { useState, useRef } from 'react';
import { Clock, Sparkles, Trash2, AlertCircle, Filter, RotateCcw } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StudySession } from '../services/storageService';

interface SessionTimelineProps {
  sessions: StudySession[];
  showNotesOnly: boolean;
  isFiltered?: boolean;
  activeFilterDescription?: string;
  onResetFilters?: () => void;
  onOpenLogSession?: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  sessions,
  showNotesOnly,
  isFiltered = false,
  activeFilterDescription,
  onResetFilters,
  onOpenLogSession,
  onDeleteSession
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<StudySession | null>(null);

  const longPressTimerRef = useRef<any>(null);
  const isLongPressActiveRef = useRef<boolean>(false);

  const filteredSessions = showNotesOnly
    ? sessions.filter(s => s.notes && s.notes.trim().length > 0)
    : sessions;

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const handleTouchStart = (session: StudySession) => {
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      setSessionToDelete(session);
    }, 550);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCardClick = (session: StudySession) => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    toggleExpand(session.id);
  };

  const getMoodIcon = (mood: StudySession['mood']) => {
    switch (mood) {
      case 'focused':
        return <span title="Deeply Focused" className="text-base">🤩</span>;
      case 'neutral':
        return <span title="Neutral Focus" className="text-base">🙂</span>;
      case 'distracted':
        return <span title="Distracted" className="text-base">😔</span>;
      default:
        return null;
    }
  };

  if (filteredSessions.length === 0) {
    if (isFiltered) {
      return (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <Filter className="w-8 h-8 mx-auto text-rose-400 dark:text-rose-500" />
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              No sessions match your active filters.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {activeFilterDescription ? `Filtered by ${activeFilterDescription}.` : 'Try clearing filters or switching dates.'}
            </p>
          </div>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Active Filters</span>
            </button>
          )}
        </div>
      );
    }

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
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Session Timeline ({filteredSessions.length})
          </h3>
          {isFiltered && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 hover:underline"
              title="Reset filter"
            >
              <span>{activeFilterDescription || 'Filtered'}</span>
              <span>×</span>
            </button>
          )}
          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-medium">
            Long-press to delete
          </span>
        </div>
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

              {/* Session Card */}
              <div
                onClick={() => handleCardClick(session)}
                onTouchStart={() => handleTouchStart(session)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSessionToDelete(session);
                }}
                className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 cursor-pointer transition-all shadow-2xs select-none active:bg-slate-100/80 dark:active:bg-slate-800/80"
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
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 animate-in fade-in duration-200 space-y-2.5">
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-lg p-2.5 text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold mb-1 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Gemini 2.5 Flash Evaluation</span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed">
                        {session.aiFeedback || 'High retention observed. Concepts synthesized effectively with solid focus stamina.'}
                      </p>
                    </div>

                    {/* Delete action button in drawer */}
                    {onDeleteSession && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Tip: Long press card to delete anytime
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(session);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/40"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Session</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Delete Study Session?</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">This action will deduct earned XP.</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {sessionToDelete.moduleName} {sessionToDelete.topicName ? `• ${sessionToDelete.topicName}` : ''}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{sessionToDelete.startTime} → {sessionToDelete.endTime}</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">-{sessionToDelete.xpEarned} XP</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deleting this session will remove it from your timeline and deduct <strong className="text-rose-600 dark:text-rose-400 font-bold">{sessionToDelete.xpEarned} XP</strong> from your total score.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = sessionToDelete.id;
                  setSessionToDelete(null);
                  onDeleteSession?.(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                Delete (-{sessionToDelete.xpEarned} XP)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
