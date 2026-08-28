import { useState, useEffect } from 'react';
import {
  Flame, Shield, TrendingUp, Award, CheckCircle, Clock, Zap, Target,
  Calendar, ChevronRight, Lock, Check, Sparkles, AlertCircle, RefreshCw, Compass, MapPin,
} from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
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

// ─── Calculate Streak for a specific Roadmap ──────────────────────────────────
function calculateRoadmapStreak(roadmap, globalStreak = 0) {
  if (!roadmap || !roadmap.phases) {
    return { streak: globalStreak, maxStreak: globalStreak, completedDays: 0, totalDays: 0, todayTasks: [] };
  }

  const allDays = [];
  roadmap.phases.forEach(ph => {
    (ph.weeks || []).forEach(wk => {
      (wk.days || []).forEach(d => {
        allDays.push(d);
      });
    });
  });

  allDays.sort((a, b) => a.dayNumber - b.dayNumber);

  let tempStreak = 0;
  let maxStreak = 0;
  let completedDays = 0;

  allDays.forEach(d => {
    const isDone = d.status === 'COMPLETED' || d.completionPct >= 70;
    if (isDone) {
      tempStreak++;
      completedDays++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });

  let effectiveStreak = maxStreak;
  if (effectiveStreak === 0 && completedDays > 0) {
    effectiveStreak = completedDays;
  }
  if (effectiveStreak === 0 && globalStreak > 0) {
    effectiveStreak = Math.min(globalStreak, Math.max(1, completedDays));
  }

  let effectiveMaxStreak = Math.max(maxStreak, effectiveStreak, globalStreak);

  const todayDay = allDays.find(d => d.status === 'IN_PROGRESS') ||
                   allDays.find(d => d.status === 'PENDING') ||
                   allDays[allDays.length - 1];

  const todayTasks = todayDay ? (todayDay.tasks || []).map(t => ({
    id: t.id,
    title: t.title,
    type: t.type,
    description: t.description,
    isCompleted: t.isCompleted || todayDay.status === 'COMPLETED',
  })) : [];

  return {
    streak: effectiveStreak,
    maxStreak: effectiveMaxStreak,
    completedDays,
    totalDays: allDays.length,
    todayDay,
    todayTasks,
  };
}

export default function StreakPage() {
  const { roadmaps, activeRoadmapId, selectRoadmap } = useRoadmap();
  const [data, setData]                     = useState(null);
  const [dailyActivity, setDailyActivity]   = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [loading, setLoading]               = useState(true);
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
      const [streakRes, actRes, wkRes] = await Promise.all([
        api.get(`/streak${q ? '?' + q : ''}`),
        api.get(`/progress/daily?days=14${q ? '&' + q : ''}`),
        api.get(`/progress/weekly?weeks=8${q ? '&' + q : ''}`),
      ]);
      setData(streakRes.data);
      setDailyActivity(actRes.data || []);
      setWeeklyActivity(wkRes.data || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-accent-amber border-t-transparent animate-spin" />
      </div>
    );
  }

  const globalStreakVal = data?.currentStreak || 0;
  const globalLongestVal = data?.longestStreak || 0;

  // Selected Roadmap context vs Global
  const selectedRoadmapId = activeRoadmapId || 'all';
  const activeRoadmap = selectedRoadmapId !== 'all'
    ? roadmaps.find(r => String(r.id) === String(selectedRoadmapId))
    : null;

  const rmMetrics = activeRoadmap ? calculateRoadmapStreak(activeRoadmap, globalStreakVal) : null;

  const currentStreak = activeRoadmap
    ? rmMetrics.streak
    : globalStreakVal;

  const longestStreak = activeRoadmap
    ? rmMetrics.maxStreak
    : globalLongestVal;

  const counterLabel = activeRoadmap
    ? `${activeRoadmap.domain} Streak`
    : 'Overall Global Streak';

  // Automated Read-Only Daily Targets from Roadmap
  const rawDailyTargets = activeRoadmap && rmMetrics.todayTasks.length > 0
    ? rmMetrics.todayTasks
    : [
        { id: 1, title: 'Learn: Core Concepts & Practice', isCompleted: currentStreak > 0 },
        { id: 2, title: 'Practice: Coding & Exercises', isCompleted: currentStreak > 0 },
        { id: 3, title: 'Aptitude: Timed Quiz', isCompleted: false },
        { id: 4, title: 'Revision: Notes & Flashcards', isCompleted: currentStreak > 0 },
      ];

  const completedTargetsCount = rawDailyTargets.filter(t => t.isCompleted).length;
  const targetPct = Math.round((completedTargetsCount / rawDailyTargets.length) * 100);

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
            Switch between your roadmaps to track per-roadmap streak counts and view auto-synced daily targets.
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
            Overall Global Streak ({globalStreakVal}d)
          </button>

          {roadmaps.map(rm => {
            const m = calculateRoadmapStreak(rm, globalStreakVal);
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
                <Flame size={12} className={m.streak > 0 ? 'text-accent-amber' : ''} />
                {rm.domain} Roadmap ({m.streak}d streak)
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Streak Counter + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Counter + Freeze Shield + Auto Daily Targets */}
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

          {/* Automated Read-Only Daily Goal Checklist */}
          <Card className="p-4 space-y-3" id="daily-goals-checklist">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-[13px] font-bold text-text flex items-center gap-1.5">
                  <Target size={15} className="text-accent-blue" />
                  Today's Daily Targets
                </h3>
                <p className="text-[10px] text-accent-blue font-semibold mt-0.5 flex items-center gap-1">
                  <Zap size={10} /> Auto-Synced with {activeRoadmap ? `${activeRoadmap.domain} Roadmap` : 'Active Plan'}
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
              {rawDailyTargets.map((t, index) => (
                <div
                  key={t.id || index}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    t.isCompleted
                      ? 'bg-accent-green/10 border-accent-green/30 text-text'
                      : 'bg-surface border-border text-muted opacity-80'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                      t.isCompleted ? 'bg-accent-green text-white' : 'border border-border bg-card'
                    }`}
                  >
                    {t.isCompleted && <Check size={13} />}
                  </div>
                  <span className={`text-[12px] flex-1 ${t.isCompleted ? 'line-through opacity-85 font-medium' : ''}`}>
                    {t.title}
                  </span>
                  {t.isCompleted ? (
                    <span className="text-[10px] font-bold text-accent-green bg-accent-green/15 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle size={10} /> Auto-Done
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted bg-card px-1.5 py-0.5 rounded border border-border">
                      Pending in Roadmap
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted italic text-center pt-1">
              🔒 Targets auto-complete as you study and finish tasks in your Roadmap!
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
                {data?.studyHours !== undefined ? `${data.studyHours}h` : (activeRoadmap ? `${+(rmMetrics.completedDays * 2).toFixed(1)}h` : '0h')}
              </p>
              <p className="text-[11px] text-muted mt-0.5">Study Time</p>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle size={18} className="mx-auto text-accent-green mb-1" />
              <p className="text-[20px] font-bold text-text leading-none">
                {activeRoadmap ? `${rmMetrics.completedDays} / ${rmMetrics.totalDays}` : (data?.totalCompletedDays !== undefined ? `${data.totalCompletedDays}` : '0')}
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                {activeRoadmap ? 'Days Completed' : 'Total Days Done'}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp size={18} className="mx-auto text-accent-purple mb-1" />
              <p className="text-[20px] font-bold text-text leading-none">
                {data?.totalXp !== undefined ? data.totalXp.toLocaleString() : (activeRoadmap ? (rmMetrics.completedDays * 50).toLocaleString() : '0')}
              </p>
              <p className="text-[11px] text-muted mt-0.5">Total XP</p>
            </Card>
            <Card className="p-4 text-center">
              <Zap size={18} className="mx-auto text-accent-amber mb-1" />
              <p className="text-[20px] font-bold text-text leading-none">
                {data?.completionPct !== undefined ? `${data.completionPct}%` : (activeRoadmap ? `${Math.round((rmMetrics.completedDays / (rmMetrics.totalDays || 1)) * 100)}%` : '0%')}
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
                  Tracks daily study hours (bars) and streak task completion markings (green line) per selected roadmap.
                </p>
              </div>
              <Badge color="blue" size="xs">
                {activeRoadmap ? `${activeRoadmap.domain} Roadmap` : 'Overall Profile'}
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
