import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  vaultPath: string | null;
  onOpenDailyNote: (date: string) => void;
  existingDailyNotes: string[]; // YYYY-MM-DD strings
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarWidget({ vaultPath, onOpenDailyNote, existingDailyNotes }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const noteSet = useMemo(() => new Set(existingDailyNotes), [existingDailyNotes]);

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long' });

  // Build the calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) cells.push(null);
    // Day numbers
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return cells;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  return (
    <div className="bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-xl p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={goToToday}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-main)] hover:text-[var(--accent)] transition-colors"
        >
          <Calendar size={12} className="text-[var(--accent)]" />
          <span>{monthName} {viewYear}</span>
        </button>
        <button
          onClick={goToNextMonth}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 text-center">
        {DAY_LABELS.map(label => (
          <div key={label} className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 text-center gap-y-0.5">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-7" />;
          }

          const dateStr = formatDateStr(viewYear, viewMonth, day);
          const isToday = dateStr === todayStr;
          const hasNote = noteSet.has(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onOpenDailyNote(dateStr)}
              className={cn(
                "relative flex flex-col items-center justify-center h-7 rounded-lg text-[11px] font-medium transition-all",
                isToday
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              {day}
              {hasNote && (
                <span
                  className={cn(
                    "absolute bottom-0.5 w-1 h-1 rounded-full",
                    isToday ? "bg-white/80" : "bg-[var(--accent)]"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
