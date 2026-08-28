/**
 * Button.jsx — variant: primary | secondary | ghost | danger
 * Uses lucide-react icons passed as props. No emoji.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight,
  disabled,
  loading,
  onClick,
  type = 'button',
  className = '',
  id,
  ...rest
}) {
  const variants = {
    primary:   'bg-accent-blue hover:bg-blue-500 text-white shadow-glow',
    secondary: 'bg-card border border-border hover:bg-surface text-text',
    ghost:     'hover:bg-card text-muted hover:text-text',
    danger:    'bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/30',
    success:   'bg-accent-green/10 hover:bg-accent-green/20 text-accent-green border border-accent-green/30',
    purple:    'bg-accent-purple hover:bg-purple-500 text-white',
  };

  const sizes = {
    xs: 'text-[11px] px-2.5 py-1.5 gap-1.5',
    sm: 'text-[12px] px-3 py-2 gap-2',
    md: 'text-[13px] px-4 py-2.5 gap-2',
    lg: 'text-[14px] px-5 py-3 gap-2.5',
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
        </svg>
      ) : Icon && <Icon size={size === 'xs' ? 12 : size === 'sm' ? 13 : 14} />}
      {children}
      {iconRight && !loading && <iconRight size={14} />}
    </button>
  );
}
