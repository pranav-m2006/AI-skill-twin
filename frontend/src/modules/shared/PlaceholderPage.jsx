/**
 * PlaceholderPage — shown for modules not yet implemented.
 * Shows module name, a construction icon, and a note.
 */
import { Construction } from 'lucide-react';
import Card from '../../shared/components/Card';

export default function PlaceholderPage({ title = 'Module' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="text-center py-16 px-12 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
          <Construction size={28} className="text-accent-blue" />
        </div>
        <h2 className="text-[17px] font-bold text-text mb-2">{title}</h2>
        <p className="text-[12px] text-muted leading-relaxed">
          This module is actively being built. Core functionality for Dashboard, Roadmap, Aptitude, Streak, Skill Twin, and Jobs is ready to use.
        </p>
      </Card>
    </div>
  );
}
