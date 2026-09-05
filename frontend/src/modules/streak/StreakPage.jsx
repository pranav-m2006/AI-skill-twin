import { useState, useEffect } from 'react';
import {
  Flame, Shield, TrendingUp, Award, CheckCircle, Clock, Zap, Target,
  Lock, Check, Sparkles, Compass, Loader2,
} from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import ActivityChart from '../../shared/charts/ActivityChart';
import AdherenceHeatmap from '../../shared/charts/AdherenceHeatmap';
import { useRoadmap } from '../../contexts/RoadmapContext';

const STREAK_MILESTONES = [
  { days: 3, name: '3-Day Starter', xp: 100, icon: Flame },
  { days: 7, name: '7-Day Weekly Warrior', xp: 250, icon: Zap },
  { days: 14, name: '14-Day Fortnight Master', xp: 500, icon: Award },
  { days: 30, name: '30-Day Consistency Legend', xp: 1000, icon: Sparkles },
  { days: 60, name: '60-Day Titan', xp: 2500, icon: Target },
  { days: 100, name: '100-Day Century Master', xp: 5000, icon: Shield },
];

function BadgeCard({ badge }) {
  const earned = !!badge.earnedAt;
  return (
    <div
      id={`badge-${badge.slug || badge.code || badge.id}`}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
        earned
          ? 'bg-gradient-to-b from-accent-blue/15 to-card border-accent-blue/40 shadow-sm'
          : 'bg-card border-border opacity-50'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          earned ? 'bg-accent-blue/20 text-accent-amber' : 'bg-surface text-muted'
        }`}
      >
        {earned ? (
          <Flame size={24} className="text-accent-amber" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' }} />
        ) : (
          <Lock size={20} className="text-muted" />
        )}
      </div>
      <p className="text-[12px] font-bold text-text text-center leading-tight">
        {badge.name}
      </p>
      <p className="text-[10px] text-muted text-center line-clamp-2">
        {badge.description || 'Achieve study goals to unlock'}
      </p>
      {earned ? (
        <Badge color="green" size="xs">
          <Check size={10} className="inline mr-0.5" /> Earned
        </Badge>
      ) : (
        <Badge color="muted" size="xs">
          +{badge.xpReward || 50} XP
        </Badge>
      )}
    </div>
  );
}

function StreakCounter({ current, longest, label = 'Current Day Streak', freezeShields = 1 }) {
  return (
    <Card id="streak-counter" className="flex flex-col items-center py-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-amber/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative">
        <Flame
          size={56}
          className="text-accent-amber mb-2 animate-pulse"
          style={{ filter: 'drop-shadow(0 0 16px rgba(245,158,11,0.6))' }}
        />
        <span className="absolute -top-1 -right-2 bg-accent-amber text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
          HOT
        </span>
      </div>

      <p className="text-[60px] font-black text-text leading-none tracking-tight">
        {current}
      </p>
      <p className="text-[13px] font-semibold text-muted mt-1 text-center">
        {label}
      </p>

      <div className="mt-6 pt-4 border-t border-border w-full flex items-center justify-around">
        <div className="text-center">
          <p className="text-[22px] font-bold text-accent-blue leading-none">{longest}</p>
          <p className="text-[11px] text-muted mt-0.5">Best Streak</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-accent-green">
            <Shield size={16} />
            <span className="text-[16px] font-bold leading-none">{freezeShields}</span>
          </div>
          <p className="text-[11px] text-muted mt-0.5">Freeze Shield</p>
        </div>
      </div>
    </Card>
  );
}

export default function StreakPage() {
  const { roadmaps, activeRoadmapId, selectRoadmap, toggleTaskCompletion } = useRoadmap();
  const [data, setData]                     = useState(null);
  const [dailyActivity, setDailyActivity]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [togglingTaskId, setTogglingTaskId] = useState(null);
  const [calYear, setCalYear]               = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]             = useState(new Date().getMonth() + 1);
  const [calDays, setCalDays]               = useState([]);

  useEffect(() => {
    fetchStreakData(activeRoadmapId);
  }, [activeRoadmapId]);

  useEffect(() => {
    fetchCalendarData(calYear, calMonth, activeRoadmapId);
  }, [calYear, calMonth, activeRoadmapId]);

  const fetchStreakData = async (rmId = null) => {
    setLoading(true);
    try {
      const q = rmId && rmId !== 'all' ? `roadmapId=${rmId}` : '';
      const [streakRes, actRes] = await Promise.all([
        api.get(`/streak${q ? '?' + q : ''}`),
        api.get(`/progress/daily?days=14${q ? '&' + q : ''}`),
      ]);
      setData(streakRes.data);
      setDailyActivity(actRes.data || []);
    } catch (e) {
      console.warn('Failed to load streak data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async (y, m, rmId = null) => {
    try {
      const q = rmId && rmId !== 'all' ? `&roadmapId=${rmId}` : '';
      const { data: res } = await api.get(`/streak/calendar?year=${y}&month=${m}${q}`);
      setCalDays(res.days || []);
    } catch {
      setCalDays([]);
    }
  };

  const handleSelectRoadmap = id => {
    if (id === 'all') {
      selectRoadmap(null);
    } else {
      selectRoadmap(id);
    }
  };

  const handleToggleTask = async (task) => {
    if (!task || !task.id || togglingTaskId) return;
    setTogglingTaskId(task.id);
    try {
      await toggleTaskCompletion(task.id, !task.isCompleted);
      await fetchStreakData(activeRoadmapId);
      await fetchCalendarData(calYear, calMonth, activeRoadmapId);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    } finally {
      setTogglingTaskId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-accent-amber border-t-transparent animate-spin" />
      </div>
    );
  }

  const selectedRoadmapId = activeRoadmapId || 'all';

  const currentStreak = data?.currentStreak || 0;
  const longestStreak = data?.longestStreak || 0;
  const domainName    = data?.roadmapDomain || (selectedRoadmapId !== 'all' ? 'Roadmap' : 'Overall');

  const counterLabel  = selectedRoadmapId !== 'all'
    ? `${domainName} Streak`
    : 'Overall Global Streak';

  // Dynamic Daily Targets directly from DB
  const rawDailyTargets = (data?.todayTasks && data.todayTasks.length > 0)
    ? data.todayTasks
    : [
        { id: 101, title: `Study: ${domainName} Core Concepts`, type: 'LEARN', isCompleted: currentStreak > 0 },
        { id: 102, title: `Practice: ${domainName} Coding Problems`, type: 'PRACTICE', isCompleted: currentStreak > 0 },
        { id: 103, title: 'Aptitude: Timed Quiz & Reasoning', type: 'APTITUDE', isCompleted: false },
        { id: 104, title: 'Revision: Key Notes & Flashcards', type: 'REVISION', isCompleted: currentStreak > 0 },
      ];

  const completedTargetsCount = rawDailyTargets.filter(t => t.isCompleted).length;
  const targetPct = rawDailyTargets.length > 0
    ? Math.round((completedTargetsCount / rawDailyTargets.length) * 100)
    : 0;

  const badges = data?.badges || [];
  const earnedBadges = badges.filter(b => b.earnedAt);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-text flex items-center gap-2">
            <Flame size={22} className="text-accent-amber" />
            Streak &amp; Activity Hub
          </h2>
          <p className="text-[12px] text-muted mt-0.5">
            Track your per-roadmap streak counts, complete daily targets, and unlock achievements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="amber" size="sm">
            <Shield size={12} className="inline mr-1" /> Freeze Shield Active
          </Badge>
        </div>
      </div>

      {/* Per-Roadmap Selector Bar */}
      <div className="bg-surface/80 p-3 rounded-2xl border border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-accent-blue uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={13} /> Select Roadmap for Streak Tracking:
          </span>
          <span className="text-[11px] text-muted font-medium">
            {roadmaps.length} Roadmaps Active
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => handleSelectRoadmap('all')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedRoadmapId === 'all'
                ? 'bg-accent-blue text-white shadow-sm font-semibold'
                : 'bg-card text-muted hover:text-text border border-border'
            }`}
          >
            <GlobeIcon size={12} />
            Overall Global Streak ({currentStreak}d)
          </button>

          {roadmaps.map(rm => {
            const isSelected = String(rm.id) === String(selectedRoadmapId);
            return (
              <button
                key={rm.id}
                onClick={() => handleSelectRoadmap(rm.id)}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-accent-blue text-white shadow-sm font-semibold'
                    : 'bg-card text-muted hover:text-text border border-border'
                }`}
              >
                <Flame size={12} className={isSelected && currentStreak > 0 ? 'text-accent-amber' : ''} />
                {rm.domain} Roadmap
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Streak Counter + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Counter + Freeze Shield + Interactive Daily Targets */}
        <div className="space-y-4">
          <StreakCounter
            current={currentStreak}
            longest={longestStreak}
            label={counterLabel}
            freezeShields={1}
          />

          {/* Freeze Shield Card */}
          <Card className="p-4 bg-gradient-to-r from-accent-blue/10 via-surface to-card border border-accent-blue/20">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/20 flex items-center justify-center text-accent-blue flex-shrink-0 mt-0.5">
                <Shield size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-[13px] font-bold text-text flex items-center justify-between">
                  Streak Freeze Shield
                  <span className="text-[10px] text-accent-green font-bold bg-accent-green/10 px-2 py-0.5 rounded-full">
                    Protected
                  </span>
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  1 Freeze Shield available. Automatically protects your streak if you miss 1 study day.
                </p>
              </div>
            </div>
          </Card>

          {/* Interactive Daily Goal Checklist */}
          <Card className="p-4 space-y-3" id="daily-goals-checklist">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-[13px] font-bold text-text flex items-center gap-1.5">
                  <Target size={15} className="text-accent-blue" />
                  Today's Daily Targets
                </h3>
                <p className="text-[10.5px] text-accent-blue font-semibold mt-0.5 flex items-center gap-1">
                  <Zap size={10} /> {data?.todayTopic ? `Day ${data.todayDayNumber}: ${data.todayTopic}` : `${domainName} Plan`}
                </p>
              </div>
              <span className="text-[11px] font-bold text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-full">
                {targetPct}% Done
              </span>
            </div>

            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all duration-500"
                style={{ width: `${targetPct}%` }}
              />
            </div>

            <div className="space-y-2 pt-1">
              {rawDailyTargets.map((t, index) => {
                const isUpdating = togglingTaskId === t.id;
                return (
                  <button
                    key={t.id || index}
                    type="button"
                    onClick={() => handleToggleTask(t)}
                    disabled={isUpdating}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer hover:border-accent-blue/50 ${
                      t.isCompleted
                        ? 'bg-accent-green/10 border-accent-green/30 text-text'
                        : 'bg-surface border-border text-muted hover:text-text'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                        t.isCompleted ? 'bg-accent-green text-white' : 'border border-border bg-card'
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 size={12} className="animate-spin text-accent-blue" />
                      ) : (
                        t.isCompleted && <Check size={13} />
                      )}
                    </div>
                    <span className={`text-[12px] flex-1 ${t.isCompleted ? 'line-through opacity-85 font-medium' : 'font-medium'}`}>
                      {t.title}
                    </span>
                    {t.isCompleted ? (
                      <span className="text-[10px] font-bold text-accent-green bg-accent-green/15 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle size={10} /> Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded">
                        Click to Complete
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-muted italic text-center pt-1">
              💡 Click any target checkbox to mark completion &amp; update your streak!
            </p>
          </Card>
        </div>

        {/* Right 2 Columns: Activity Calendar + Analytics + Milestones */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 text-center">
              <Clock size={18} className="mx-auto text-accent-blue mb-1" />
              <p className="text-[20px] font-bold text-text leading-none">
                {data?.studyHours !== undefined ? `${data.studyHours}h` : '0h'}
              </p>
              <p className="text-[11px] text-muted mt-0.5">Study Time</p>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle size={18} className="mx-auto text-accent-green mb-1" />
              <p className="text-[20px] font-bold text-text leading-none">
                {data?.totalCompletedDays !== undefined ? `${data.totalCompletedDays} / ${data.totalDays || 30}` : '0 / 30'}
              </p>
              <p className="text-[11px] text-muted mt-0.5">Days Completed</p>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp size={18} className="mx-auto text-accent-purple mb-1" />
              <p className="text-[20px] font-bold text-text leading-none">
                {data?.totalXp !== undefined ? data.totalXp.toLocaleString() : '0'}
              </p>
              <p className="text-[11px] text-muted mt-0.5">Total XP</p>
            </Card>
            <Card className="p-4 text-center">
              <Zap size={18} className="mx-auto text-accent-amber mb-1" />
              <p className="text-[20px] font-bold text-text leading-none">
                {data?.completionPct !== undefined ? `${data.completionPct}%` : '0%'}
              </p>
              <p className="text-[11px] text-muted mt-0.5">Completion</p>
            </Card>
          </div>

          {/* Roadmap Learning Velocity & Task Markings Graph */}
          <Card id="streak-daily-graph-card" className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-[13px] font-bold text-text flex items-center gap-2">
                  <TrendingUp size={16} className="text-accent-blue" />
                  Roadmap Learning Velocity &amp; Streak Markings Graph
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Tracks daily study hours (bars) and streak task completion markings (green line) for {domainName}.
                </p>
              </div>
              <Badge color="blue" size="xs">
                {domainName} Roadmap
              </Badge>
            </div>

            <ActivityChart data={dailyActivity} height={220} id="streak-activity-graph" />
          </Card>

          {/* Activity Heatmap Calendar */}
          <Card id="streak-calendar-card">
            <AdherenceHeatmap
              days={calDays}
              year={calYear}
              month={calMonth}
              onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
              showNav={true}
              title="Activity &amp; Consistency History"
              id="streak-heatmap"
            />
          </Card>

          {/* Streak Milestones Roadmap */}
          <Card p-4 className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-[13px] font-bold text-text flex items-center gap-1.5">
                <Flame size={16} className="text-accent-amber" />
                Streak Milestones &amp; XP Rewards Roadmap
              </h3>
              <span className="text-[11px] text-muted font-medium">
                {currentStreak} Days Completed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {STREAK_MILESTONES.map(m => {
                const isUnlocked = currentStreak >= m.days;
                const Icon = m.icon;
                return (
                  <div
                    key={m.days}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-accent-amber/10 border-accent-amber/30 text-text'
                        : 'bg-surface border-border opacity-65'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isUnlocked ? 'bg-accent-amber/20 text-accent-amber' : 'bg-card text-muted'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold truncate">{m.name}</p>
                      <p className="text-[10px] text-muted">{m.days} Days Streak</p>
                    </div>
                    {isUnlocked ? (
                      <Badge color="amber" size="xs">
                        +{m.xp} XP
                      </Badge>
                    ) : (
                      <Badge color="muted" size="xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Badges Gallery */}
      <Card id="streak-badges-card" className="p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <div>
            <h3 className="text-[14px] font-bold text-text flex items-center gap-2">
              <Award size={18} className="text-accent-amber" />
              Badges &amp; Achievement Gallery
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              Earn badges by maintaining daily study streaks, completing roadmap days, and solving coding problems.
            </p>
          </div>
          <Badge color="green" size="sm">
            {earnedBadges.length}/{badges.length || 6} Badges Unlocked
          </Badge>
        </div>

        {badges.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: 'Consistency Starter', description: 'Complete 3-day streak', xpReward: 100, earnedAt: 'now' },
              { name: 'Weekly Warrior', description: 'Complete 7-day streak', xpReward: 250, earnedAt: null },
              { name: 'Roadmap Explorer', description: 'Complete 10 roadmap tasks', xpReward: 150, earnedAt: 'now' },
              { name: 'Code Samurai', description: 'Solve 10 coding problems', xpReward: 300, earnedAt: null },
              { name: 'Aptitude Ace', description: 'Score >80% in Aptitude', xpReward: 200, earnedAt: 'now' },
              { name: 'Century Master', description: 'Reach 100-day streak', xpReward: 5000, earnedAt: null },
            ].map((b, i) => <BadgeCard key={i} badge={b} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {badges.map((b, i) => (
              <BadgeCard key={b.slug || b.id || i} badge={b} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function GlobeIcon({ size }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}
