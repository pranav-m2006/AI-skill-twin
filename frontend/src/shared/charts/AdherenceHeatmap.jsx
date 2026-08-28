import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * AdherenceHeatmap — contribution-style compact calendar heatmap with day numbers.
 */
const DAY_COLORS = {
  complete: { bg: 'bg-accent-green text-white font-bold', ring: 'ring-accent-green/50' },
  partial:  { bg: 'bg-accent-amber text-slate-950 font-bold', ring: 'ring-accent-amber/50' },
  missed:   { bg: 'bg-accent-red/40 text-accent-red font-medium', ring: 'ring-accent-red/30' },
  future:   { bg: 'bg-surface text-muted/60', ring: '' },
  empty:    { bg: 'bg-transparent', ring: '' },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildCalendarGrid(year, month, days) {
  const dayMap = {};
  for (const d of days) dayMap[d.date] = d;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);
  const today    = new Date().toISOString().slice(0, 10);

  let startOffset = firstDay.getDay(); // 0=Sun
  startOffset = startOffset === 0 ? 6 : startOffset - 1; // convert to Mon=0

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const activity = dayMap[dateStr];
    const isFuture = dateStr > today;
    const status = isFuture ? 'future' : (activity?.completionPct >= 70 ? 'complete' : activity?.completionPct > 0 ? 'partial' : 'missed');
    cells.push({ day: d, date: dateStr, status, activity });
  }

  return cells;
}

export default function AdherenceHeatmap({
  days = [],
  year,
  month,
  onMonthChange,
  onDayClick,
  showNav = true,
  title = 'Streak Activity Calendar',
  id,
}) {
  const now = new Date();
  const [activeCell, setActiveCell] = useState(null);

  const currentYear  = year  || now.getFullYear();
  const currentMonth = month || now.getMonth() + 1;

  const cells = buildCalendarGrid(currentYear, currentMonth, days);

  const handlePrev = () => {
    let m = currentMonth - 1, y = currentYear;
    if (m < 1) { m = 12; y--; }
    onMonthChange?.(y, m);
  };

  const handleNext = () => {
    let m = currentMonth + 1, y = currentYear;
    if (m > 12) { m = 1; y++; }
    onMonthChange?.(y, m);
  };

  return (
    <div id={id} className="select-none max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-text">{title}</span>
        {showNav && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              id={`${id}-prev`}
              className="p-1 rounded bg-card hover:bg-surface text-muted hover:text-text border border-border transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-[11px] font-semibold text-text min-w-[100px] text-center">
              {MONTHS[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={handleNext}
              id={`${id}-next`}
              className="p-1 rounded bg-card hover:bg-surface text-muted hover:text-text border border-border transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-[10px] font-bold text-muted uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Compact Day Grid with Day Numbers */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} className="h-7 w-7" />;

          const colors = DAY_COLORS[cell.status] || DAY_COLORS.empty;
          const isToday = cell.date === new Date().toISOString().slice(0, 10);

          return (
            <button
              key={cell.date}
              id={`heatmap-day-${cell.date}`}
              onClick={() => { setActiveCell(cell); onDayClick?.(cell); }}
              title={`${cell.date}: Day ${cell.day} (${cell.status})`}
              className={`
                h-7 w-7 sm:h-8 sm:w-8 mx-auto rounded-md flex items-center justify-center text-[10px] transition-all duration-150 border border-border/40
                ${colors.bg} ${colors.ring}
                ${isToday ? 'ring-2 ring-accent-blue border-accent-blue font-black' : ''}
                ${cell.status !== 'future' ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
              `}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Compact Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-border/60">
        {[
          { status: 'complete', label: 'Done (≥70%)', color: 'bg-accent-green' },
          { status: 'partial',  label: 'Partial',     color: 'bg-accent-amber' },
          { status: 'missed',   label: 'Missed',      color: 'bg-accent-red/40' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[9px] text-muted font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
