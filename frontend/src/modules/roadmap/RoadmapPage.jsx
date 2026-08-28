import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronDown, ChevronRight, ChevronUp, Clock, Star, CheckCircle, Circle,
  Sparkles, Target, Flame, ArrowRight, BookOpen, Layers, Zap, Check, Trash2, Calendar, AlertTriangle
} from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import KpiRing from '../../shared/charts/KpiRing';
import DropdownSelect from '../../shared/components/DropdownSelect';
import { useRoadmap } from '../../contexts/RoadmapContext';

const DOMAINS = [
  'Java', 'Python', 'C++', 'JavaScript', 'React', 'Node.js',
  'Full Stack', 'DSA', 'SQL', 'Data Science', 'Machine Learning',
  'Cybersecurity', 'Cloud & DevOps', 'System Design', 'Flutter', 'Aptitude'
];

const LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' }
];

const DAILY_HOURS = ['0.5', '1', '1.5', '2', '3', '4', '5+'].map(h => ({ value: h, label: `${h} hrs/day` }));

const DURATION_WEEKS = [
  { value: '1', label: '1 Week (7 Days)' },
  { value: '2', label: '2 Weeks (14 Days)' },
  { value: '3', label: '3 Weeks (21 Days)' },
  { value: '4', label: '4 Weeks (1 Month)' },
  { value: '6', label: '6 Weeks (42 Days)' },
  { value: '8', label: '8 Weeks (2 Months)' },
  { value: '12', label: '12 Weeks (3 Months)' },
];

const PROMPT_SUGGESTIONS = [
  'Java basics roadmap specifically for 3 weeks',
  '30 days intensive preparation for Amazon SDE-1 interview as a Junior Dev',
  '2 weeks crash course for TCS NQT Aptitude & Technical coding round',
  '4 weeks roadmap for Full Stack Web Developer interview at Wipro / Infosys',
  'Python basics and data structures roadmap for 3 weeks',
];

function GeneratePanel({ onGenerated }) {
  const [tab, setTab]                 = useState('custom');
  const [customGoal, setCustomGoal]   = useState('');
  const [domain, setDomain]           = useState('Java');
  const [level, setLevel]             = useState('BEGINNER');
  const [hours, setHours]             = useState('2');
  const [duration, setDuration]       = useState('3');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const generate = async () => {
    setLoading(true); setError('');
    try {
      if (tab === 'custom' && customGoal.trim()) {
        const { data } = await api.post('/roadmap/generate', {
          domain: domain || 'Placement Prep',
          level,
          dailyHours: parseFloat(hours),
          durationWeeks: parseInt(duration, 10),
          customGoal: customGoal.trim(),
        });
        onGenerated(data);
      } else {
        const { data } = await api.post('/roadmap/generate', {
          domain,
          level,
          dailyHours: parseFloat(hours),
          durationWeeks: parseInt(duration, 10),
        });
        onGenerated(data);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate roadmap');
    } finally { setLoading(false); }
  };

  return (
    <Card id="roadmap-generate-panel" className="max-w-2xl mx-auto p-6 border-accent-blue/30 shadow-glow">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
        <div>
          <h3 className="text-[16px] font-bold text-text flex items-center gap-2">
            <Sparkles size={18} className="text-accent-blue" />
            Create Placement Preparation Roadmap
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            Generate custom company &amp; timeframe-based placement strategy or standard domain curriculum.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface rounded-xl p-1 mb-5">
        <button
          onClick={() => setTab('custom')}
          className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'custom' ? 'bg-accent-blue text-white shadow-sm' : 'text-muted hover:text-text'
          }`}
          id="roadmap-tab-custom"
        >
          <Target size={14} /> Custom Goal &amp; Duration Target
        </button>
        <button
          onClick={() => setTab('standard')}
          className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'standard' ? 'bg-accent-blue text-white shadow-sm' : 'text-muted hover:text-text'
          }`}
          id="roadmap-tab-standard"
        >
          <Layers size={14} /> Standard Domain Roadmap
        </button>
      </div>

      {tab === 'custom' ? (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-muted mb-1 block">
              Describe your target domain, timeframe, and goals:
            </label>
            <textarea
              value={customGoal}
              onChange={e => setCustomGoal(e.target.value)}
              placeholder="e.g. Java basics roadmap for 3 weeks specifically with daily topics and aptitude tasks"
              rows={3}
              className="w-full bg-surface border border-border rounded-xl p-3 text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue"
              id="custom-goal-textarea"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DropdownSelect id="roadmap-custom-duration" label="Target Duration" options={DURATION_WEEKS} value={duration} onChange={setDuration} />
            <DropdownSelect id="roadmap-custom-domain" label="Primary Domain" options={DOMAINS} value={domain} onChange={setDomain} />
          </div>

          {/* Quick Prompt Chips */}
          <div>
            <span className="text-[11px] text-muted block mb-1.5 font-medium">💡 Quick Suggestions (Click to fill):</span>
            <div className="space-y-1.5">
              {PROMPT_SUGGESTIONS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCustomGoal(prompt)}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-surface hover:bg-card border border-border text-[11.5px] text-muted hover:text-accent-blue transition-all flex items-center justify-between group"
                >
                  <span>{prompt}</span>
                  <Zap size={12} className="text-muted group-hover:text-accent-blue flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <DropdownSelect id="roadmap-domain" label="Study Domain" options={DOMAINS} value={domain} onChange={setDomain} />
          <div className="grid grid-cols-3 gap-3">
            <DropdownSelect id="roadmap-duration" label="Duration (Weeks)" options={DURATION_WEEKS} value={duration} onChange={setDuration} />
            <DropdownSelect id="roadmap-level" label="Current Level" options={LEVELS} value={level} onChange={setLevel} />
            <DropdownSelect id="roadmap-hours" label="Daily Study Hours" options={DAILY_HOURS} value={hours} onChange={setHours} />
          </div>
        </div>
      )}

      {error && <p className="text-[12px] text-accent-red mt-3">{error}</p>}

      <div className="mt-5">
        <Button
          id="roadmap-generate-btn"
          variant="primary"
          loading={loading}
          disabled={tab === 'custom' && !customGoal.trim()}
          className="w-full"
          onClick={generate}
          icon={Sparkles}
        >
          {tab === 'custom' ? 'Analyze & Generate AI Placement Strategy' : 'Generate Domain Roadmap'}
        </Button>
      </div>
    </Card>
  );
}

function DayRow({ day }) {
  const statusColors = { COMPLETED: 'green', IN_PROGRESS: 'amber', PENDING: 'muted', MISSED: 'red' };
  const StatusIcon = day.status === 'COMPLETED' ? CheckCircle : Circle;
  const totalMins = (day.learnMinutes || 0) + (day.practiceMinutes || 0) + (day.aptitudeMinutes || 0) + (day.revisionMinutes || 0);

  return (
    <Link
      to={`/roadmap/day/${day.id}`}
      id={`roadmap-day-${day.id}`}
      className="flex items-center gap-4 px-4 py-3 hover:bg-surface rounded-lg transition-colors group"
    >
      <StatusIcon
        size={16}
        className={`flex-shrink-0 ${day.status === 'COMPLETED' ? 'text-accent-green' : day.status === 'IN_PROGRESS' ? 'text-accent-amber' : 'text-border'}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-text group-hover:text-accent-blue truncate">{day.title || day.topic}</p>
        <div className="flex gap-3 text-[10px] text-muted mt-0.5">
          <span><Clock size={9} className="inline mr-0.5" />{totalMins}m</span>
          <span><Star size={9} className="inline mr-0.5" />{day.xpReward || 50} XP</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {day.completionPct > 0 && (
          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-accent-blue rounded-full" style={{ width: `${day.completionPct}%` }} />
          </div>
        )}
        <Badge color={statusColors[day.status] || 'muted'} size="xs" dot>{day.status || 'PENDING'}</Badge>
        <ChevronRight size={12} className="text-muted group-hover:text-accent-blue" />
      </div>
    </Link>
  );
}

function WeekAccordion({ week }) {
  const [open, setOpen] = useState(week.days?.some(d => d.status === 'IN_PROGRESS') || false);
  const completedDays = week.days?.filter(d => d.status === 'COMPLETED').length || 0;
  const totalDaysInWeek = week.days?.length || 7;

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-2">
      <button
        id={`week-${week.id}-toggle`}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-card/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-text">{week.title}</span>
          <Badge color={completedDays === totalDaysInWeek ? 'green' : completedDays > 0 ? 'amber' : 'muted'} size="xs">
            {completedDays}/{totalDaysInWeek}
          </Badge>
        </div>
        {open ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
      </button>
      {open && (
        <div className="divide-y divide-border/50">
          {week.days?.map(day => <DayRow key={day.id} day={day} />)}
        </div>
      )}
    </div>
  );
}

function PhaseAccordion({ phase }) {
  const [open, setOpen] = useState(true);
  const totalDays   = phase.weeks?.reduce((s, w) => s + (w.days?.length || 0), 0) || 0;
  const completeDays = phase.weeks?.reduce((s, w) => s + (w.days?.filter(d => d.status === 'COMPLETED').length || 0), 0) || 0;
  const pct = totalDays > 0 ? Math.round((completeDays / totalDays) * 100) : 0;

  return (
    <div className="mb-4">
      <button
        id={`phase-${phase.id}-toggle`}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-card border border-border rounded-xl mb-2 hover:border-accent-blue/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-bold text-text">{phase.title}</span>
          <Badge color={pct === 100 ? 'green' : pct > 0 ? 'blue' : 'muted'} size="sm" dot>{pct}%</Badge>
        </div>
        {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>
      {open && (
        <div className="pl-4">
          {phase.weeks?.map(week => <WeekAccordion key={week.id} week={week} />)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
export default function RoadmapPage() {
  const {
    roadmaps,
    activeRoadmap: active,
    selectRoadmap,
    fetchMyRoadmaps,
    loading,
  } = useRoadmap();

  const [deletingId, setDeletingId]         = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showGenerate, setShowGenerate]       = useState(false);

  const handleDeleteRoadmap = async (id, e) => {
    if (e) e.stopPropagation();
    setDeletingId(id);
    try {
      await api.delete(`/roadmap/${id}`);
      await fetchMyRoadmaps();
    } catch (err) {
      alert('Failed to delete roadmap: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading && roadmaps.length === 0) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" /></div>;
  }

  if (!active && roadmaps.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-[16px] font-bold text-text">My Roadmap</h2>
        <GeneratePanel onGenerated={async r => {
          setShowGenerate(false);
          await fetchMyRoadmaps();
          await selectRoadmap(r.id);
        }} />
      </div>
    );
  }

  const totalDays = active?.totalDays || 0;
  const completedDays = active?.completedDays || 0;
  const completedPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  const totalWeeks = Math.max(1, Math.round(totalDays / 7));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Saved Roadmaps Switcher Bar */}
      {roadmaps.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto bg-surface/60 p-2 rounded-xl border border-border no-scrollbar">
          <span className="text-[11px] font-semibold text-muted flex items-center gap-1 px-2 whitespace-nowrap">
            <Layers size={12} /> Select Active Roadmap:
          </span>
          {roadmaps.map(rm => {
            const isSelected = active?.id === rm.id;
            const rmTotalDays = rm.totalDays || 0;
            const pct = rmTotalDays > 0 ? Math.round(((rm.completedDays || 0) / rmTotalDays) * 100) : 0;
            const rmWeeks = Math.max(1, Math.round(rmTotalDays / 7));
            return (
              <div key={rm.id} className="flex items-center gap-1">
                <button
                  onClick={() => { setShowGenerate(false); selectRoadmap(rm.id); }}
                  id={`roadmap-switch-${rm.id}`}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected && !showGenerate
                      ? 'bg-accent-blue text-white shadow-sm font-semibold'
                      : 'text-muted hover:text-text bg-card border border-border'
                  }`}
                >
                  <span>{rm.domain} ({rmWeeks}w)</span>
                  <span className="opacity-80 text-[10px]">({pct}%)</span>
                </button>
                <button
                  type="button"
                  title="Delete Roadmap"
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(rm.id); }}
                  className="p-1 text-muted hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => setShowGenerate(true)}
            id="roadmap-create-new-tab"
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1 text-accent-blue bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/20 ${
              showGenerate ? 'ring-2 ring-accent-blue font-semibold' : ''
            }`}
          >
            <Sparkles size={11} /> + Create New / Custom Goal
          </button>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 border-accent-red/40 animate-fade-in shadow-2xl">
            <div className="flex items-center gap-3 text-accent-red">
              <AlertTriangle size={24} />
              <h3 className="text-[16px] font-bold text-text">Delete Roadmap?</h3>
            </div>
            <p className="text-[13px] text-muted leading-relaxed">
              Are you sure you want to delete this roadmap? All progress records and daily tasks for this roadmap will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deletingId === confirmDeleteId}
                onClick={(e) => handleDeleteRoadmap(confirmDeleteId, e)}
                icon={Trash2}
              >
                Delete Roadmap
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      {active && !showGenerate ? (
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-bold text-text">{active.domain} Roadmap</h2>
              <Badge color="blue" size="sm">{totalWeeks} Weeks ({totalDays} Days)</Badge>
            </div>
            <p className="text-[12px] text-muted mt-0.5">
              {active.dailyHours || 2} hrs/day · {active.level || 'Intermediate'} · Created on {new Date(active.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <KpiRing value={completedPct} color="#3B82F6" size="sm" label="Complete" />
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setConfirmDeleteId(active.id)}
            >
              Delete
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowGenerate(true)} id="roadmap-new-btn">
              + New Custom Goal
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-text">Create Placement Roadmap</h2>
            <p className="text-[12px] text-muted mt-0.5">Choose your domain, level, and exact duration (e.g. 3 weeks)</p>
          </div>
        </div>
      )}

      {/* Overview stats if active */}
      {active && !showGenerate && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Duration', value: `${totalWeeks} Weeks (${totalDays} Days)`, color: 'text-text' },
            { label: 'Completed Days', value: completedDays, color: 'text-accent-green' },
            { label: 'Remaining Days', value: Math.max(0, totalDays - completedDays), color: 'text-accent-amber' },
            { label: 'Est. End Date',  value: active.estimatedEndDate ? new Date(active.estimatedEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', color: 'text-text' },
          ].map(stat => (
            <Card key={stat.label} className="text-center py-3">
              <p className={`text-[16px] font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-muted mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* New roadmap panel if toggled */}
      {showGenerate && (
        <GeneratePanel onGenerated={async r => {
          setShowGenerate(false);
          await fetchMyRoadmaps();
          await selectRoadmap(r.id);
        }} />
      )}

      {/* Phase accordion */}
      {active && !showGenerate && active.phases?.map(phase => (
        <PhaseAccordion key={phase.id} phase={phase} />
      ))}
    </div>
  );
}
