/**
 * Card.jsx — base card component for AI Skill Twin dark theme.
 * Uses --card bg, --border, 14px radius, generous padding.
 */
export default function Card({ children, className = '', noPad = false, id }) {
  return (
    <div
      id={id}
      className={`bg-card border border-border rounded-card shadow-card ${noPad ? '' : 'p-5'} ${className}`}
    >
      {children}
    </div>
  );
}
