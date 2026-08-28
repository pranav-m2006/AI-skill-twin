/**
 * Badge.jsx — status pill / chip using colored divs, not emoji.
 * color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'muted'
 */
export default function Badge({ children, color = 'blue', size = 'sm', dot = false, className = '' }) {
  const colors = {
    blue:   'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
    green:  'bg-accent-green/15 text-accent-green border-accent-green/30',
    amber:  'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
    red:    'bg-accent-red/15 text-accent-red border-accent-red/30',
    purple: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
    muted:  'bg-border/50 text-muted border-border',
  };

  const dotColors = {
    blue:   'bg-accent-blue',
    green:  'bg-accent-green',
    amber:  'bg-accent-amber',
    red:    'bg-accent-red',
    purple: 'bg-accent-purple',
    muted:  'bg-muted',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-[12px] px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-pill border font-medium
        ${colors[color]} ${sizes[size]} ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[color]}`} />}
      {children}
    </span>
  );
}
