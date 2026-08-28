'use strict';
/**
 * progressAnalytics.js — PlaceMate AI
 *
 * Aggregates DailyActivity records into chart-ready series for the
 * Progress Analytics page and Dashboard.
 */

const prisma = require('../config/prisma');

// ─────────────────────────────────────────────
// getDailyProgress — last N days of activity
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// getDailyProgress — activity starting from user sign-in date
// ─────────────────────────────────────────────
async function getDailyProgress(userId, days = 14, roadmapId = null) {
  const today = new Date();

  // Fetch user sign-in date (createdAt)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  let startDate;
  if (user && user.createdAt) {
    startDate = new Date(user.createdAt);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));
  }

  // Calculate total days from user sign-in date up to today
  const diffTime = Math.max(0, today - startDate);
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const start = startDate.toISOString().slice(0, 10);
  const end = today.toISOString().slice(0, 10);

  // Fetch roadmap (either requested roadmapId or active user roadmap)
  let targetRoadmap = null;
  if (roadmapId && roadmapId !== 'all') {
    targetRoadmap = await prisma.roadmap.findUnique({
      where: { id: parseInt(roadmapId, 10) },
      include: {
        phases: {
          include: {
            weeks: {
              include: { days: { include: { tasks: true } } },
            },
          },
        },
      },
    });
  }

  if (!targetRoadmap) {
    targetRoadmap = await prisma.roadmap.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        phases: {
          include: {
            weeks: {
              include: { days: { include: { tasks: true } } },
            },
          },
        },
      },
    });
  }

  const activities = await prisma.dailyActivity.findMany({
    where: { userId, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' },
  });

  const streakLog = await prisma.streakLog.findUnique({ where: { userId } });
  
  // Calculate completed days specifically for targetRoadmap if requested
  const isSpecificRoadmap = roadmapId && roadmapId !== 'all';
  const rmCompletedDays = targetRoadmap ? targetRoadmap.completedDays : (streakLog?.totalCompletedDays || 0);

  const result = [];
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);
    const activity = activities.find(a => a.date === dateStr);

    if (!isSpecificRoadmap && activity && activity.tasksCompleted > 0) {
      // Overall global activity
      const markingLevel = Math.min(4, Math.max(1, activity.tasksCompleted));
      result.push({
        date: dateStr,
        studyHours: +(activity.studyMinutes / 60).toFixed(1),
        tasksCompleted: markingLevel,
        tasksTotal: 4,
        completionPct: +activity.completionPct.toFixed(1),
        aptitudeScore: activity.aptitudeScore,
        xpEarned: activity.xpEarned,
        isStreakDay: activity.isStreakDay || activity.completionPct >= 70,
      });
    } else {
      // Per-Roadmap Specific Streak Graph starting from Sign-In Date:
      const daysFromEnd = totalDays - 1 - d;
      const isStreakObtainedDayForThisRoadmap = daysFromEnd < rmCompletedDays && daysFromEnd >= 0;

      if (isStreakObtainedDayForThisRoadmap && rmCompletedDays > 0) {
        // Obtained streak day for THIS roadmap starting from sign-in
        result.push({
          date: dateStr,
          studyHours: targetRoadmap ? targetRoadmap.dailyHours || 2 : 2.0,
          tasksCompleted: 4,
          tasksTotal: 4,
          completionPct: 100,
          aptitudeScore: 85,
          xpEarned: 50,
          isStreakDay: true,
        });
      } else {
        // Uncompleted / remaining days since sign-in: 0 markings
        result.push({
          date: dateStr,
          studyHours: 0,
          tasksCompleted: 0,
          tasksTotal: 4,
          completionPct: 0,
          aptitudeScore: null,
          xpEarned: 0,
          isStreakDay: false,
        });
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────
// getWeeklyProgress — weekly progress of individual roadmaps
// ─────────────────────────────────────────────
async function getWeeklyProgress(userId, weeks = 8, roadmapId = null) {
  let targetRoadmap = null;
  if (roadmapId && roadmapId !== 'all') {
    targetRoadmap = await prisma.roadmap.findUnique({
      where: { id: parseInt(roadmapId, 10) },
      include: {
        phases: {
          include: {
            weeks: {
              include: { days: { include: { tasks: true } } },
            },
          },
        },
      },
    });
  }

  if (!targetRoadmap) {
    targetRoadmap = await prisma.roadmap.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        phases: {
          include: {
            weeks: {
              include: { days: { include: { tasks: true } } },
            },
          },
        },
      },
    });
  }

  if (targetRoadmap && targetRoadmap.phases && targetRoadmap.phases.length > 0) {
    const weeklyData = [];
    let weekIndex = 1;

    for (const phase of targetRoadmap.phases) {
      for (const wk of phase.weeks || []) {
        const daysInWeek = wk.days || [];
        const completedDaysCount = daysInWeek.filter(d => d.status === 'COMPLETED' || d.completionPct >= 70).length;
        const totalDaysCount = daysInWeek.length || 7;
        const completionPct = Math.round((completedDaysCount / totalDaysCount) * 100);

        weeklyData.push({
          weekLabel: `Week ${weekIndex}`,
          completedDays: completedDaysCount,
          totalDays: totalDaysCount,
          completionPct,
          tasksCompleted: completedDaysCount, // completed streak days in this week (0 to 7)
          isCompleted: completionPct > 0,
        });
        weekIndex++;
      }
    }

    if (weeklyData.length > 0) return weeklyData;
  }

  // Fallback if no specific roadmap weeks exist
  const result = [];
  for (let w = 1; w <= weeks; w++) {
    result.push({
      weekLabel: `Week ${w}`,
      completedDays: 0,
      totalDays: 7,
      completionPct: 0,
      tasksCompleted: 0,
      isCompleted: false,
    });
  }
  return result;
}

// ─────────────────────────────────────────────
// getMonthlyProgress — aggregated by calendar month
// ─────────────────────────────────────────────
async function getMonthlyProgress(userId, months = 6, roadmapId = null) {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);
  const start = startDate.toISOString().slice(0, 10);

  const activities = await prisma.dailyActivity.findMany({
    where: { userId, date: { gte: start } },
    orderBy: { date: 'asc' },
  });

  const monthMap = {};
  for (const a of activities) {
    const key = a.date.slice(0, 7);
    if (!monthMap[key]) {
      monthMap[key] = {
        month: key,
        studyHours: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
        xpEarned: 0,
        streakDays: 0,
        aptitudeScores: [],
      };
    }
    monthMap[key].studyHours += a.studyMinutes / 60;
    monthMap[key].tasksCompleted += a.tasksCompleted;
    monthMap[key].tasksTotal += a.tasksTotal;
    monthMap[key].xpEarned += a.xpEarned;
    if (a.isStreakDay) monthMap[key].streakDays++;
    if (a.aptitudeScore !== null) monthMap[key].aptitudeScores.push(a.aptitudeScore);
  }

  return Object.values(monthMap).map(m => ({
    ...m,
    studyHours: +m.studyHours.toFixed(1),
    adherencePct: m.tasksTotal > 0
      ? +((m.tasksCompleted / m.tasksTotal) * 100).toFixed(1)
      : 0,
    avgAptitude: m.aptitudeScores.length > 0
      ? +(m.aptitudeScores.reduce((a, b) => a + b, 0) / m.aptitudeScores.length).toFixed(1)
      : null,
  }));
}

// ─────────────────────────────────────────────
// getRoadmapAdherence — full roadmap history adherence
// ─────────────────────────────────────────────
async function getRoadmapAdherence(userId, roadmapId = null) {
  let roadmap = null;
  if (roadmapId && roadmapId !== 'all') {
    roadmap = await prisma.roadmap.findUnique({
      where: { id: parseInt(roadmapId, 10) },
      include: {
        phases: {
          include: {
            weeks: {
              include: { days: { orderBy: { dayNumber: 'asc' } } },
            },
          },
        },
      },
    });
  }

  if (!roadmap) {
    roadmap = await prisma.roadmap.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        phases: {
          include: {
            weeks: {
              include: { days: { orderBy: { dayNumber: 'asc' } } },
            },
          },
        },
      },
    });
  }

  if (!roadmap) return { days: [], onTrack: 0, behind: 0, ahead: 0, adherencePct: 0 };

  const allDays = [];
  for (const phase of roadmap.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        allDays.push({
          dayNumber: day.dayNumber,
          date: day.scheduledDate ? day.scheduledDate.toISOString().slice(0, 10) : null,
          status: day.status,
          completionPct: day.completionPct,
          topic: day.topic,
        });
      }
    }
  }

  const past = allDays.filter(d => d.date && d.date <= new Date().toISOString().slice(0, 10));
  const completed = past.filter(d => d.status === 'COMPLETED').length;
  const missed = past.filter(d => d.status === 'MISSED').length;
  const total = past.length;

  return {
    roadmapDomain: roadmap.domain,
    days: allDays,
    onTrack: total > 0 ? Math.round((completed / total) * 100) : 0,
    behind: total > 0 ? Math.round((missed / total) * 100) : 0,
    ahead: 0,
    adherencePct: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// ─────────────────────────────────────────────
// getDashboardSummary — KPI metrics for dashboard
// ─────────────────────────────────────────────
async function getDashboardSummary(userId, roadmapId = null) {
  let targetRoadmap = null;
  if (roadmapId && roadmapId !== 'all') {
    targetRoadmap = await prisma.roadmap.findUnique({
      where: { id: parseInt(roadmapId, 10) },
      select: { totalDays: true, completedDays: true, domain: true },
    });
  }

  if (!targetRoadmap) {
    targetRoadmap = await prisma.roadmap.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { totalDays: true, completedDays: true, domain: true },
    });
  }

  const [streakLog, user] = await Promise.all([
    prisma.streakLog.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { xp: true, resumeText: true, domain: true, targetRole: true } }),
  ]);

  const roadmapPct = targetRoadmap
    ? Math.round((targetRoadmap.completedDays / targetRoadmap.totalDays) * 100)
    : 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayActivity = await prisma.dailyActivity.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  return {
    roadmapPct,
    currentStreak: streakLog?.currentStreak || 0,
    longestStreak: streakLog?.longestStreak || 0,
    xp: user?.xp || 0,
    todayCompletionPct: todayActivity?.completionPct || 0,
    todayStudyMinutes: todayActivity?.studyMinutes || 0,
    roadmapDomain: targetRoadmap?.domain || user?.domain || null,
  };
}

// ─────────────────────────────────────────────
// Helper: get ISO week key "YYYY-W{WW}"
// ─────────────────────────────────────────────
function getISOWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

module.exports = {
  getDailyProgress,
  getWeeklyProgress,
  getMonthlyProgress,
  getRoadmapAdherence,
  getDashboardSummary,
};
