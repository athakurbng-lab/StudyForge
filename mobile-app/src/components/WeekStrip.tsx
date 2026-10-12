import { Filter } from 'lucide-react';
import { DayStats } from '../services/storageService';

interface WeekStripProps {
  stats: DayStats[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  showNotesOnly: boolean;
  onToggleShowNotesOnly: () => void;
  filterLabel: string;
}

export const WeekStrip: React.FC<WeekStripProps> = ({
  stats,
  selectedDate,
  onSelectDate,
  showNotesOnly,
  onToggleShowNotesOnly,
  filterLabel
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 transition-colors">
      {/* Day Cards Horizontal Strip matching Screenshot 1 */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {stats.map((day) => {
          const isSelected = day.date === selectedDate;
          const [dayName, dayNum] = day.dayLabel.split(' ');

          return (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all ${
                isSelected
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 shadow-xs text-rose-700 dark:text-rose-400 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] tracking-tight text-slate-500 dark:text-slate-400 uppercase font-semibold">
                {dayName}
              </span>
              <span className={`text-xs my-0.5 ${isSelected ? 'font-black text-rose-600 dark:text-rose-400' : 'font-bold'}`}>
                {dayNum}
              </span>
              <span className={`text-[10px] ${day.totalHours > 0 ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                {day.totalHours > 0 ? `${day.totalHours.toFixed(2)}h` : '0.00h'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Notes Row matching Screenshot 1 */}
      <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 px-1 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300 font-medium select-none">
          <input
            type="checkbox"
            checked={showNotesOnly}
            onChange={onToggleShowNotesOnly}
            className="w-3.5 h-3.5 text-rose-600 rounded-sm border-slate-300 dark:border-slate-700 focus:ring-rose-500 focus:ring-offset-0"
          />
          <span className="text-[11px]">Show notes only</span>
        </label>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">
          <span>{filterLabel}</span>
          <Filter className="w-3 h-3 text-slate-400" />
        </div>
      </div>
    </div>
  );
};
