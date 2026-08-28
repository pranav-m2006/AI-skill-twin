import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, X, ChevronRight, Briefcase, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRoadmap } from '../../contexts/RoadmapContext';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import KpiRing from '../../shared/charts/KpiRing';
import ActivityChart from '../../shared/charts/ActivityChart';
import AdherenceHeatmap from '../../shared/charts/AdherenceHeatmap';

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function KpiCard({ value, label, color, subtitle, id }) {
  return (
    <Card className="flex flex-col items-center justify-center py-6" id={id}>
      <KpiRing value={value} label={label} color={color} size="md" subtitle={subtitle} />
    </Card>
  );
}

function StreakFlame({ current, longest }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Flame size={28} className="text-accent-amber" />
        <div>
          <p className="text-[28px] font-bold text-text leading-none">{current}</p>
          <p className="text-[11px] text-muted">day streak</p>
        </div>
      </div>
      <div className="w-px h-10 bg-border" />
      <div>
        <p className="text-[18px] font-bold text-text leading-none">{longest}</p>
        <p className="text-[11px] text-muted">best streak</p>
      </div>
    </div>
  );
}

function AdherenceBreakdown({ onTrack = 0, behind = 0, ahead = 0 }) {
  const items = [
    { label: 'On Track',    pct: onTrack, color: 'bg-accent-green',  dot: 'bg-accent-green' },
    { label: 'Behind',      pct: behind,  color: 'bg-accent-red',    dot: 'bg-accent-red' },
    { label: 'Ahead',       pct: ahead,   color: 'bg-accent-blue',   dot: 'bg-accent-blue' },
  ];
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
          <span className="text-[12px] text-text flex-1">{item.label}</span>
          <span className="text-[12px] font-semibold text-text">{item.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function TipBanner({ tip, id, onDismiss }) {
  return (
    <div id={id} className="flex items-start gap-3 bg-accent-blue/10 border border-accent-blue/20 rounded-xl px-4 py-3 animate-fade-in">
      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-1.5 flex-shrink-0" />
      <p className="text-[12px] text-text flex-1">{tip}</p>
      <button onClick={onDismiss} className="text-muted hover:text-text mt-0.5" aria-label="Dismiss tip">
        <X size={13} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// DashboardPage
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { activeRoadmap, fetchMyRoadmaps } = useRoadmap();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary:     {},
    streak:      { currentStreak: 0, longestStreak: 0 },
    skillTwin:   { readinessScore: 0, resumeMatchPct: 0 },
    aptitude:    { overallAccuracy: 0 },
    jobMatch:    0,
    activity:    [],
    adherence:   { onTrack: 0, behind: 0, ahead: 0 },
    recommendations: [],
  });
  const [tips, setTips] = useState([
    { id: 1, text: `Complete today's learning task to maintain your streak.` },
    { id: 2, text: 'Your Skill Twin is ready — check your skill gap analysis.' },
    { id: 3, text: 'New jobs matching your profile are available.' },
  ]);

  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [streakSuccess, setStreakSuccess]   = useState('');

  // Extract today's task from active roadmap in Context
  let activeTodayTask = null;
  let activeDomain = activeRoadmap?.domain || null;
  let activePct = activeRoadmap && activeRoadmap.totalDays > 0
    ? Math.round((activeRoadmap.completedDays / activeRoadmap.totalDays) * 100)
    : 0;

  if (activeRoadmap && activeRoadmap.phases) {
    for (const p of activeRoadmap.phases) {
      for (const w of (p.weeks || [])) {
        for (const d of (w.days || [])) {
          if (!activeTodayTask && d.status !== 'COMPLETED') {
            activeTodayTask = d;
            break;
          }
        }
        if (activeTodayTask) break;
      }
      if (activeTodayTask) break;
    }
  }

  const handleCompleteTodayTask = async () => {
    const dayId = activeTodayTask?.id;
    if (!dayId) return;

    setSubmittingTask(true);
    setStreakSuccess('');
    try {
      const { data: res } = await api.post(`/roadmap/day/${dayId}/complete`, {
        completionPct: 100,
        studyMinutes: 60,
      });

      const newStreak = res.streak?.currentStreak || ((data.streak?.currentStreak || 0) + 1);
      setStreakSuccess(`🔥 Task completed & streak saved! Current Streak: ${newStreak} Days (+${res.day?.xpReward || 50} XP)`);

      await fetchAll();
      await fetchMyRoadmaps();
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setSubmittingTask(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchCalendar(calYear, calMonth);
  }, [calYear, calMonth]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [summary, streak, skillTwin, aptitude, activity, adherence, jobs] = await Promise.allSettled([
        api.get('/progress/dashboard'),
        api.get('/streak'),
        api.get('/skill-twin'),
        api.get('/aptitude/stats'),
        api.get('/progress/daily?days=14'),
        api.get('/progress/adherence'),
        api.get('/jobs/match'),
      ]);

      const topJobMatch = jobs.value?.data?.[0]?.matchPct || 0;

      setData(d => ({
        ...d,
        summary:      summary.value?.data || {},
        streak:       streak.value?.data || d.streak,
        skillTwin:    skillTwin.value?.data || d.skillTwin,
        aptitude:     aptitude.value?.data || d.aptitude,
        activity:     activity.value?.data || [],
        adherence:    adherence.value?.data || d.adherence,
        jobMatch:     topJobMatch,
        recommendations: (jobs.value?.data || []).slice(0, 3),
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async (y, m) => {
    try {
      const { data: cal } = await api.get(`/streak/calendar?year=${y}&month=${m}`);
      setData(d => ({ ...d, calendarDays: cal.days || [] }));
    } catch {}
  };

  const dismissTip = id => setTips(t => t.filter(tip => tip.id !== id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  const { streak, skillTwin, aptitude, activity, adherence, recommendations } = data;
  const displayDomain = activeDomain || data.summary.roadmapDomain || 'No active roadmap';
  const displayPct = activeRoadmap ? activePct : (data.summary.roadmapPct || 0);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── KPI Ring Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          id="kpi-roadmap"
          value={displayPct}
          label="Roadmap Progress"
          color="#3B82F6"
          subtitle={displayDomain}
        />
        <KpiCard
          id="kpi-resume"
          value={skillTwin.resumeMatchPct || 0}
          label="Resume Match"
          color="#8B5CF6"
          subtitle="vs. target role"
        />
        <KpiCard
          id="kpi-aptitude"
          value={aptitude.overallAccuracy || 0}
          label="Aptitude Readiness"
          color="#F59E0B"
          subtitle={`${aptitude.totalAttempted || 0} questions`}
        />
        <KpiCard
          id="kpi-job-match"
          value={data.jobMatch}
          label="Top Job Match"
          color="#22C55E"
          subtitle="best match %"
        />
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left 2/3 column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Today's roadmap task */}
          <Card id="dashboard-today-task">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-[13px] font-semibold text-text">
                  Today's Learning Task ({displayDomain})
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  {activeTodayTask ? `Day ${activeTodayTask.dayNumber}` : 'No active task'}
                </p>
              </div>
              <Link to="/roadmap" className="text-[11px] text-accent-blue hover:underline flex items-center gap-1" id="dashboard-view-roadmap">
                View roadmap <ChevronRight size={11} />
              </Link>
            </div>

            {activeTodayTask ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-semibold text-text">{activeTodayTask.topic || activeTodayTask.title}</p>
                  <Badge color={activeTodayTask.status === 'COMPLETED' ? 'green' : 'amber'} size="xs" dot>
                    {activeTodayTask.status || 'PENDING'}
                  </Badge>
                </div>
                <div className="flex gap-4 text-[11px] text-muted mb-3">
                  <span>Learn: <strong className="text-text">{activeTodayTask.learnMinutes || 25}m</strong></span>
                  <span>Practice: <strong className="text-text">{activeTodayTask.practiceMinutes || 20}m</strong></span>
                  <span>Aptitude: <strong className="text-text">{activeTodayTask.aptitudeMinutes || 10}m</strong></span>
                  <span>Revision: <strong className="text-text">{activeTodayTask.revisionMinutes || 5}m</strong></span>
                </div>
                {/* Completion bar */}
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-accent-blue rounded-full transition-all duration-500"
                    style={{ width: `${activeTodayTask.completionPct || 0}%` }}
                  />
                </div>

                {streakSuccess && (
                  <p className="text-[11px] text-accent-green font-semibold mb-2 bg-accent-green/10 p-2.5 rounded-lg border border-accent-green/30 animate-fade-in">
                    {streakSuccess}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
                  <Link to={`/roadmap/day/${activeTodayTask.id}`} className="text-[11px] text-accent-blue hover:underline">
                    View Task Checklist →
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submittingTask}
                    disabled={activeTodayTask.status === 'COMPLETED'}
                    onClick={handleCompleteTodayTask}
                    icon={CheckCircle}
                    id="dashboard-submit-task-btn"
                  >
                    {activeTodayTask.status === 'COMPLETED' ? 'Completed (+1 Streak)' : 'Complete Task & Save Streak'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-[12px] text-muted mb-3">No active task for this roadmap</p>
                <Link to="/roadmap" className="text-[12px] text-accent-blue hover:underline" id="dashboard-generate-roadmap">
                  View or create a roadmap
                </Link>
              </div>
            )}
          </Card>

          {/* Streak + Daily Goal Ring */}
          <Card id="dashboard-streak">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-text">Streak</h3>
              <Link to="/streak" className="text-[11px] text-accent-blue hover:underline flex items-center gap-1" id="dashboard-view-streak">
                View all <ChevronRight size={11} />
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <StreakFlame
                current={streak.currentStreak || 0}
                longest={streak.longestStreak || 0}
              />
              <div className="flex flex-col items-center gap-1">
                <KpiRing
                  value={data.summary.todayCompletionPct || 0}
                  color="#22C55E"
                  size="sm"
                  subtitle="today"
                />
                <span className="text-[10px] text-muted">Daily Goal</span>
              </div>
            </div>
          </Card>

          {/* Activity Chart */}
          <Card id="dashboard-activity-chart">
            <h3 className="text-[13px] font-semibold text-text mb-4">Study Activity (Last 14 Days)</h3>
            <ActivityChart data={activity} height={180} id="chart-activity" />
          </Card>
        </div>

        {/* Right 1/3 column */}
        <div className="space-y-4">

          {/* Roadmap Adherence Breakdown */}
          <Card id="dashboard-adherence">
            <h3 className="text-[13px] font-semibold text-text mb-4">Roadmap Adherence ({displayDomain})</h3>
            <AdherenceBreakdown
              onTrack={adherence.onTrack || 0}
              behind={adherence.behind || 0}
              ahead={adherence.ahead || 0}
            />
            <div className="mt-4 h-1.5 bg-border rounded-full overflow-hidden flex">
              <div className="bg-accent-green h-full rounded-l-full" style={{ width: `${adherence.onTrack}%` }} />
              <div className="bg-accent-blue h-full" style={{ width: `${adherence.ahead}%` }} />
              <div className="bg-accent-red h-full rounded-r-full" style={{ width: `${adherence.behind}%` }} />
            </div>
          </Card>

          {/* Streak Calendar */}
          <Card id="dashboard-calendar">
            <AdherenceHeatmap
              days={data.calendarDays}
              year={calYear}
              month={calMonth}
              onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
              showNav={true}
              title="Activity Calendar"
              id="heatmap-calendar"
            />
          </Card>

          {/* Recommended Jobs/Internships */}
          <Card id="dashboard-recommendations">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-text">Recommended for You</h3>
              <Link to="/jobs" className="text-[11px] text-accent-blue flex items-center gap-0.5" id="dashboard-view-jobs">
                All <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2">
              {recommendations.length > 0 ? recommendations.map((job, i) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  id={`dashboard-job-${i}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={13} className="text-accent-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-text truncate group-hover:text-accent-blue">{job.title}</p>
                    <p className="text-[10px] text-muted">{job.company?.name}</p>
                  </div>
                  <Badge color="green" size="xs">{job.matchPct}%</Badge>
                </Link>
              )) : (
                <p className="text-[12px] text-muted text-center py-4">
                  Complete your profile to see job recommendations
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Tip Banners ── */}
      {tips.length > 0 && (
        <div className="space-y-2">
          {tips.map(tip => (
            <TipBanner
              key={tip.id}
              id={`tip-${tip.id}`}
              tip={tip.text}
              onDismiss={() => dismissTip(tip.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
