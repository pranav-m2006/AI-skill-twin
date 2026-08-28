import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

/**
 * KpiRing — circular progress ring with centered percentage label.
 * Built on recharts RadialBarChart.
 *
 * Props:
 *   value: number (0–100)
 *   label: string — shown below the ring
 *   color: string — hex or tailwind color class value
 *   size: 'sm' | 'md' | 'lg'
 *   subtitle: string — optional small text under value
 */
export default function KpiRing({
  value = 0,
  label = '',
  color = '#3B82F6',
  size = 'md',
  subtitle,
  id,
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  const sizes = {
    sm: { outer: 90,  inner: 62, fontSize: '18px', labelSize: '10px' },
    md: { outer: 120, inner: 84, fontSize: '22px', labelSize: '11px' },
    lg: { outer: 150, inner: 106, fontSize: '28px', labelSize: '12px' },
  };
  const s = sizes[size];

  const data = [
    { name: 'value', value: clamped, fill: color },
    { name: 'bg', value: 100 - clamped, fill: '#22304C' }, // --border
  ];

  return (
    <div id={id} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s.outer, height: s.outer }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius={s.inner / 2}
            outerRadius={s.outer / 2 - 4}
            startAngle={90}
            endAngle={-270}
            data={data}
            barSize={10}
          >
            <RadialBar dataKey="value" cornerRadius={10} isAnimationActive={true} animationDuration={800} />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Centered percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: s.fontSize, color }} className="font-bold leading-none">
            {clamped}%
          </span>
          {subtitle && (
            <span className="text-muted mt-0.5" style={{ fontSize: '9px' }}>{subtitle}</span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-muted font-medium text-center" style={{ fontSize: s.labelSize }}>
          {label}
        </span>
      )}
    </div>
  );
}
