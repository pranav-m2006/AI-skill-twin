import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-card text-[12px] z-50">
      <p className="text-muted font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-text font-semibold">
            {p.name}: <strong>{p.value}</strong> {p.dataKey === 'studyHours' ? 'hrs' : 'markings'}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * ActivityChart — Dual-Series ComposedChart (Study Hours Bar + Tasks Done Line).
 * Evaluates roadmap activity dynamically per selected roadmap.
 */
export default function ActivityChart({ data = [], height = 240, id }) {
  const chartData = (data && data.length > 0) ? data.map(d => ({
    ...d,
    label: d.weekLabel || (d.date ? d.date.slice(5) : ''),
    studyHours: +(d.studyHours || (d.completedDays ? +(d.completedDays * 0.8).toFixed(1) : 0)),
    tasksCompleted: +(d.tasksCompleted !== undefined ? d.tasksCompleted : (d.completedDays || 0)),
  })) : [];

  if (chartData.length === 0) {
    return (
      <div id={id} className="flex items-center justify-center h-[200px] text-muted text-[12px] bg-surface/40 rounded-xl border border-dashed border-border p-4 text-center">
        No activity recorded yet for this roadmap. Complete daily tasks to fill the graph!
      </div>
    );
  }

  return (
    <div id={id} className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#22304C" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#8B96AD', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="hours"
            tick={{ fill: '#8B96AD', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
          />
          <YAxis
            yAxisId="tasks"
            orientation="right"
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fill: '#22C55E', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v} Markings`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#8B96AD', paddingTop: '8px' }}
          />
          <Bar
            yAxisId="hours"
            dataKey="studyHours"
            name="Study Hours"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.8}
            maxBarSize={28}
          />
          <Line
            yAxisId="tasks"
            type="monotone"
            dataKey="tasksCompleted"
            name="Streak Tasks Done (0-4)"
            stroke="#22C55E"
            strokeWidth={2.5}
            dot={{ fill: '#22C55E', strokeWidth: 1.5, stroke: '#0d1117', r: 3.5 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
