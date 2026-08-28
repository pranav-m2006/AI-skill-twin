import { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, Flame, CheckCircle, BarChart2 } from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import KpiRing from '../../shared/charts/KpiRing';
import ActivityChart from '../../shared/charts/ActivityChart';
import AdherenceHeatmap from '../../shared/charts/AdherenceHeatmap';

import { useRoadmap } from '../../contexts/RoadmapContext';
import { Compass } from 'lucide-react';

export default function ProgressPage() {
  const { roadmaps, activeRoadmapId, selectRoadmap } = useRoadmap();
  const [data, setData] = useState({
    summary: {},
    activity: [],
    adherence: {},
    calendarDays: [],
  });
  const [loading, setLoading] = useState(true);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadProgress(activeRoadmapId);
  }, [activeRoadmapId]);

  useEffect(() => {
    fetchCalendar(calYear, calMonth, activeRoadmapId);
  }, [calYear, calMonth, activeRoadmapId]);

  const loadProgress = async (rmId = null) => {
    setLoading(true);
    try {
      const q = rmId && rmId !== 'all' ? `roadmapId=${rmId}` : '';
      const [summary, activity, adherence] = await Promise.allSettled([
        api.get(`/progress/dashboard${q ? '?' + q : ''}`),
        api.get(`/progress/daily?days=14${q ? '&' + q : ''}`),
        api.get(`/progress/adherence${q ? '?' + q : ''}`),
      ]);

      setData(d => ({
        ...d,
        summary: summary.value?.data || {},
        activity: activity.value?.data || [],
        adherence: adherence.value?.data || {},
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async (y, m, rmId = null) => {
    try {
      const q = rmId && rmId !== 'all' ? `&roadmapId=${rmId}` : '';
      const { data: cal } = await api.get(`/streak/calendar?year=${y}&month=${m}${q}`);
      setData(d => ({ ...d, calendarDays: cal.days || [] }));
    } catch {}
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" /></div>;
  }

  const { summary, activity, calendarDays } = data;
  const roadmapPct = summary.roadmapPct || 0;
  const currentStreak = summary.currentStreak || 0;
  const longestStreak = summary.longestStreak || 0;
  const totalXp = summary.xp || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-[18px] font-bold text-text flex items-center gap-2">
          <TrendingUp size={20} className="text-accent-blue" />
          Progress & Analytics
        </h2>
        <p className="text-[12px] text-muted mt-0.5">
          Detailed metrics tracking your study velocity, roadmap completion, and streak history.
        </p>
      </div>

      {/* Per-Roadmap Selector Bar */}
      <div className="bg-surface/80 p-3 rounded-2xl border border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-accent-blue uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={13} /> Select Active Domain Roadmap:
          </span>
          <span className="text-[11px] text-muted font-medium">
            {roadmaps.length} Roadmaps Active
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => selectRoadmap(null)}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              !activeRoadmapId || activeRoadmapId === 'all'
                ? 'bg-accent-blue text-white shadow-sm font-semibold'
                : 'bg-card text-muted hover:text-text border border-border'
            }`}
          >
            Overall Progress Overview
          </button>

          {roadmaps.map(rm => {
            const isSelected = String(rm.id) === String(activeRoadmapId);
            return (
              <button
                key={rm.id}
                onClick={() => selectRoadmap(rm.id)}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-accent-blue text-white shadow-sm font-semibold'
                    : 'bg-card text-muted hover:text-text border border-border'
                }`}
              >
                <Flame size={12} className="text-accent-amber" />
                {rm.domain} Roadmap Progress
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <KpiRing value={roadmapPct} color="#3B82F6" size="sm" />
          <div>
            <p className="text-[18px] font-bold text-text">{roadmapPct}%</p>
            <p className="text-[11px] text-muted mt-0.5">Roadmap Progress</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-amber/10 flex items-center justify-center text-accent-amber">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-text">{currentStreak} Days</p>
            <p className="text-[11px] text-muted mt-0.5">Current Streak (Best: {longestStreak})</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-text">{totalXp} XP</p>
            <p className="text-[11px] text-muted mt-0.5">Experience Points</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-text">{summary.todayStudyMinutes || 60}m</p>
            <p className="text-[11px] text-muted mt-0.5">Study Time Today</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Activity Chart & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Daily Learning Velocity */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-[14px] font-semibold text-text mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-accent-blue" />
            14-Day Learning Velocity (Minutes/Day)
          </h3>
          <ActivityChart data={activity} />
        </Card>

        {/* Right 1 col: Roadmap Adherence */}
        <Card className="p-6">
          <h3 className="text-[14px] font-semibold text-text mb-4">Adherence Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
              <span className="text-[12px] text-muted">Active Domain</span>
              <Badge color="blue" size="sm">{summary.roadmapDomain || 'Full Stack'}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
              <span className="text-[12px] text-muted">Completion Rate</span>
              <span className="text-[13px] font-bold text-accent-green">{roadmapPct}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
              <span className="text-[12px] text-muted">Daily Goal Target</span>
              <span className="text-[13px] font-bold text-text">70% Tasks</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom: Adherence Calendar */}
      <Card className="p-6">
        <AdherenceHeatmap
          days={calendarDays}
          year={calYear}
          month={calMonth}
          onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
          showNav={true}
          title="Monthly Activity Heatmap"
        />
      </Card>
    </div>
  );
}
