'use strict';
/**
 * streakEngine.js — PlaceMate AI
 *
 * Owns all streak computation. Single source of truth for the completion
 * threshold and all streak/activity updates. Never mutates badge history.
 */

const prisma = require('../config/prisma');
const { awardStreakBadges } = require('./badgeEngine');

// ─────────────────────────────────────────────
// NAMED CONSTANT — never use 0.7 as a magic number elsewhere
// ─────────────────────────────────────────────
const COMPLETION_THRESHOLD = 0.70; // 70%

/**
 * Format a Date as "YYYY-MM-DD" using local time.
 */
function toDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Count the calendar-day gap between two "YYYY-MM-DD" strings.
 * Returns the number of days between them (always positive).
 */
function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA + 'T00:00:00Z');
  const b = new Date(dateStrB + 'T00:00:00Z');
  return Math.abs(Math.round((b - a) / 86_400_000));
}

// ─────────────────────────────────────────────
// updateDailyActivity
// Call this whenever a task is completed or a day is marked complete.
// ─────────────────────────────────────────────
async function updateDailyActivity(userId, {
  date = toDateString(),
  studyMinutes = 0,
  tasksCompleted = 0,
  tasksTotal = 0,
  aptitudeScore = null,
  xpEarned = 0,
  roadmapTopic = null,
} = {}) {
  // Upsert the activity record for today
  const existing = await prisma.dailyActivity.findUnique({
    where: { userId_date: { userId, date } },
  });

  let record;
  if (existing) {
    record = await prisma.dailyActivity.update({
      where: { userId_date: { userId, date } },
      data: {
        studyMinutes: existing.studyMinutes + studyMinutes,
        tasksCompleted: Math.max(existing.tasksCompleted, tasksCompleted),
        tasksTotal: Math.max(existing.tasksTotal, tasksTotal),
        aptitudeScore: aptitudeScore !== null ? aptitudeScore : existing.aptitudeScore,
        xpEarned: existing.xpEarned + xpEarned,
        roadmapTopic: roadmapTopic || existing.roadmapTopic,
      },
    });
  } else {
    record = await prisma.dailyActivity.create({
      data: { userId, date, studyMinutes, tasksCompleted, tasksTotal, aptitudeScore, xpEarned, roadmapTopic },
    });
  }

  // Recompute completionPct
  const completionPct = record.tasksTotal > 0
    ? (record.tasksCompleted / record.tasksTotal) * 100
    : 0;

  const isStreakDay = completionPct / 100 >= COMPLETION_THRESHOLD;

  record = await prisma.dailyActivity.update({
    where: { userId_date: { userId, date } },
    data: { completionPct, isStreakDay },
  });

  let isNewStreakDay = false;
  // Update streak if this day just became a streak day
  if (isStreakDay) {
    const res = await _updateStreak(userId, date);
    isNewStreakDay = res.isNewStreakDay;
  }

  return { ...record, isNewStreakDay };
}

// ─────────────────────────────────────────────
// _updateStreak (internal)
// Called after a day reaches the COMPLETION_THRESHOLD.
// ─────────────────────────────────────────────
async function _updateStreak(userId, date) {
  let streak = await prisma.streakLog.findUnique({ where: { userId } });

  if (!streak) {
    streak = await prisma.streakLog.create({
      data: { userId, updatedAt: new Date() },
    });
  }

  const last = streak.lastCompletedDate;
  let newCurrent = streak.currentStreak;
  let isNewStreakDay = false;

  if (!last || streak.currentStreak === 0) {
    // First ever streak day or streak was 0
    newCurrent = 1;
    isNewStreakDay = true;
  } else {
    const gap = daysBetween(last, date);
    if (gap === 0) {
      // Same calendar day updated again — keep current streak, do not double increment
      newCurrent = Math.max(1, streak.currentStreak);
      isNewStreakDay = false;
    } else if (gap === 1) {
      // Consecutive day — increment streak
      newCurrent = streak.currentStreak + 1;
      isNewStreakDay = true;
    } else {
      // Gap > 1: streak broken, restart at 1
      newCurrent = 1;
      isNewStreakDay = true;
      const missedCount = gap - 1;
      await prisma.streakLog.update({
        where: { userId },
        data: { totalMissedDays: streak.totalMissedDays + missedCount, updatedAt: new Date() },
      });
    }
  }

  const newLongest = Math.max(streak.longestStreak, newCurrent);

  streak = await prisma.streakLog.update({
    where: { userId },
    data: {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastCompletedDate: date,
      totalCompletedDays: isNewStreakDay ? streak.totalCompletedDays + 1 : streak.totalCompletedDays,
      totalActiveDays: streak.totalActiveDays + 1,
      updatedAt: new Date(),
    },
  });

  // Award any newly reached milestone badges
  await awardStreakBadges(userId, newCurrent);

  return { streak, isNewStreakDay };
}

// ─────────────────────────────────────────────
// getStreakMetrics — public API for controllers
// ─────────────────────────────────────────────
async function getStreakMetrics(userId, roadmapId = null) {
  const globalStreak = await prisma.streakLog.findUnique({ where: { userId } });

  // If a specific roadmap is requested, compute metrics tailored to that roadmap
  if (roadmapId && roadmapId !== 'all') {
    const rmId = parseInt(roadmapId, 10);
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: rmId },
      include: {
        phases: {
          include: {
            weeks: {
              include: {
                days: {
                  include: { tasks: true },
                  orderBy: { dayNumber: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (roadmap && roadmap.userId === userId) {
      const allDays = [];
      for (const phase of roadmap.phases) {
        for (const week of phase.weeks) {
          for (const day of week.days) {
            allDays.push(day);
          }
        }
      }

      allDays.sort((a, b) => a.dayNumber - b.dayNumber);

      let completedDaysCount = 0;
      let totalTasksCount = 0;
      let completedTasksCount = 0;
      let tempStreak = 0;
      let maxStreak = 0;

      allDays.forEach(d => {
        const isDone = d.status === 'COMPLETED' || d.completionPct >= 70;
        if (isDone) {
          completedDaysCount++;
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
          tempStreak = 0;
        }

        const dayTasks = d.tasks || [];
        totalTasksCount += dayTasks.length;
        completedTasksCount += dayTasks.filter(t => t.isCompleted).length;
      });

      const totalDays = allDays.length || 30;
      const currentStreak = maxStreak > 0 ? maxStreak : (completedDaysCount > 0 ? completedDaysCount : (globalStreak?.currentStreak || 0));
      const longestStreak = Math.max(maxStreak, currentStreak, globalStreak?.longestStreak || 0);

      const studyHours = +((completedDaysCount * (roadmap.dailyHours || 2)) + (completedTasksCount * 0.25)).toFixed(1);
      const totalXp = completedDaysCount * 50 + completedTasksCount * 10;
      const completionPct = totalDays > 0 ? Math.round((completedDaysCount / totalDays) * 100) : 0;

      return {
        roadmapId: rmId,
        roadmapDomain: roadmap.domain,
        currentStreak,
        longestStreak,
        lastCompletedDate: globalStreak?.lastCompletedDate || null,
        totalCompletedDays: completedDaysCount,
        totalMissedDays: globalStreak?.totalMissedDays || 0,
        totalActiveDays: completedDaysCount || globalStreak?.totalActiveDays || 0,
        studyHours,
        totalXp,
        completionPct,
        totalDays,
        completedTasks: completedTasksCount,
        totalTasks: totalTasksCount,
      };
    }
  }

  // Default global metrics across all roadmaps
  if (!globalStreak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      totalCompletedDays: 0,
      totalMissedDays: 0,
      totalActiveDays: 0,
      studyHours: 0,
      totalXp: 0,
      completionPct: 0,
      totalDays: 30,
    };
  }

  return {
    currentStreak: globalStreak.currentStreak,
    longestStreak: globalStreak.longestStreak,
    lastCompletedDate: globalStreak.lastCompletedDate,
    totalCompletedDays: globalStreak.totalCompletedDays,
    totalMissedDays: globalStreak.totalMissedDays,
    totalActiveDays: globalStreak.totalActiveDays,
    studyHours: +(globalStreak.totalCompletedDays * 1.5).toFixed(1),
    totalXp: globalStreak.totalCompletedDays * 50,
    completionPct: globalStreak.totalCompletedDays > 0 ? Math.min(100, globalStreak.totalCompletedDays * 3) : 0,
    totalDays: 30,
  };
}

// ─────────────────────────────────────────────
// getCalendarData — returns a month's daily activity
// for the streak calendar heatmap
// ─────────────────────────────────────────────
async function getCalendarData(userId, year, month) {
  // Build date range for the requested month
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0); // last day of month
  const end = toDateString(endDate);

  const activities = await prisma.dailyActivity.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    orderBy: { date: 'asc' },
  });

  return activities.map(a => ({
    date: a.date,
    completionPct: a.completionPct,
    isStreakDay: a.isStreakDay,
    studyMinutes: a.studyMinutes,
    tasksCompleted: a.tasksCompleted,
    tasksTotal: a.tasksTotal,
    aptitudeScore: a.aptitudeScore,
    xpEarned: a.xpEarned,
    roadmapTopic: a.roadmapTopic,
    badgesEarned: JSON.parse(a.badgesEarned || '[]'),
    // Status: 'complete' | 'partial' | 'missed' | 'future'
    status: a.isStreakDay
      ? 'complete'
      : a.completionPct > 0
        ? 'partial'
        : 'missed',
  }));
}

module.exports = {
  COMPLETION_THRESHOLD,
  toDateString,
  daysBetween,
  updateDailyActivity,
  getStreakMetrics,
  getCalendarData,
};
