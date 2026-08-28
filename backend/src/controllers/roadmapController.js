'use strict';
const { z } = require('zod');
const prisma = require('../config/prisma');
const { generateRoadmap, completeDay, rescheduleFromDay } = require('../services/roadmapEngine');
const { updateDailyActivity } = require('../services/streakEngine');

const generateSchema = z.object({
  domain:        z.string().min(1),
  level:         z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  dailyHours:    z.number().min(0.5).max(12).default(2),
  durationWeeks: z.number().min(1).max(52).optional(),
  customGoal:    z.string().optional(),
});

async function generate(req, res, next) {
  try {
    const data = generateSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const roadmap = await generateRoadmap(req.user.id, { ...data, role: user.role });
    res.status(201).json(roadmap);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    next(err);
  }
}

async function deleteRoadmap(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.roadmap.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Roadmap not found or unauthorized' });
    }

    // Cascade delete phases, weeks, days, tasks
    await prisma.roadmap.delete({ where: { id } });
    res.json({ success: true, message: 'Roadmap deleted successfully', id });
  } catch (err) { next(err); }
}


async function getRoadmap(req, res, next) {
  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        phases: {
          include: {
            weeks: {
              include: { days: { include: { tasks: true }, orderBy: { dayNumber: 'asc' } } },
              orderBy: { weekNumber: 'asc' },
            },
          },
          orderBy: { phaseNumber: 'asc' },
        },
      },
    });
    if (!roadmap || roadmap.userId !== req.user.id) return res.status(404).json({ error: 'Roadmap not found' });
    res.json(roadmap);
  } catch (err) { next(err); }
}

async function getMyRoadmaps(req, res, next) {
  try {
    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(roadmaps);
  } catch (err) { next(err); }
}

async function markDayComplete(req, res, next) {
  try {
    const dayId = parseInt(req.params.dayId);
    const { completionPct = 100, studyMinutes = 0, aptitudeScore = null } = req.body;

    const result = await completeDay(req.user.id, dayId, { completionPct });

    let isNewStreakDay = true;
    try {
      const streakRecord = await updateDailyActivity(req.user.id, {
        studyMinutes: studyMinutes || 45,
        tasksCompleted: Math.round((completionPct / 100) * 4),
        tasksTotal: 4,
        aptitudeScore,
        xpEarned: result.day.xpReward || 50,
        roadmapTopic: result.day.topic,
      });
      isNewStreakDay = streakRecord.isNewStreakDay;
    } catch (e) {
      console.warn('Streak activity update:', e.message);
    }

    // Always fetch the real streakLog from database
    let currentStreak = 1;
    let longestStreak = 1;
    try {
      const streakLog = await prisma.streakLog.findUnique({ where: { userId: req.user.id } });
      if (streakLog) {
        currentStreak = streakLog.currentStreak;
        longestStreak = streakLog.longestStreak;
      }
    } catch (_) {}

    res.json({
      ...result,
      currentStreak,
      longestStreak,
      completedDaysCount: result.completedDaysCount || 1,
      totalDays: result.totalDays || 30,
      isNewStreakDay,
    });
  } catch (err) { next(err); }
}

async function markTaskComplete(req, res, next) {
  try {
    const taskId = parseInt(req.params.taskId);
    const task = await prisma.dayTask.update({
      where: { id: taskId },
      data: { isCompleted: true, completedAt: new Date() },
      include: { day: { include: { week: { include: { phase: { include: { roadmap: true } } } } } } },
    });

    if (task.day.week.phase.roadmap.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorised' });
    }

    // Recompute day completion pct
    const allTasks = await prisma.dayTask.findMany({ where: { dayId: task.dayId } });
    const completedCount = allTasks.filter(t => t.isCompleted).length;
    const pct = Math.round((completedCount / allTasks.length) * 100);

    await prisma.roadmapDay.update({
      where: { id: task.dayId },
      data: { completionPct: pct, status: pct >= 70 ? 'IN_PROGRESS' : 'PENDING' },
    });

    // Update daily activity (partial signal)
    await updateDailyActivity(req.user.id, {
      tasksCompleted: completedCount,
      tasksTotal: allTasks.length,
      studyMinutes: 30, // partial time credit per task
      xpEarned: 10,
    });

    res.json({ task, dayCompletionPct: pct });
  } catch (err) { next(err); }
}

async function reschedule(req, res, next) {
  try {
    const roadmapId = parseInt(req.params.id);
    const { fromDayNumber = 1 } = req.body;
    await rescheduleFromDay(roadmapId, fromDayNumber);
    res.json({ message: 'Roadmap rescheduled successfully' });
  } catch (err) { next(err); }
}

async function getTodayPlan(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    let todayDay = await prisma.roadmapDay.findFirst({
      where: {
        week: { phase: { roadmap: { userId: req.user.id, status: 'ACTIVE' } } },
        scheduledDate: { gte: new Date(today + 'T00:00:00Z'), lte: new Date(today + 'T23:59:59Z') },
      },
      include: { tasks: true, week: { include: { phase: { include: { roadmap: true } } } } },
    });

    if (!todayDay) {
      // Fallback 1: First pending day in active roadmap
      todayDay = await prisma.roadmapDay.findFirst({
        where: {
          week: { phase: { roadmap: { userId: req.user.id, status: 'ACTIVE' } } },
          status: 'PENDING',
        },
        orderBy: { dayNumber: 'asc' },
        include: { tasks: true, week: { include: { phase: { include: { roadmap: true } } } } },
      });
    }

    if (!todayDay) {
      // Fallback 2: Any day in active roadmap
      todayDay = await prisma.roadmapDay.findFirst({
        where: {
          week: { phase: { roadmap: { userId: req.user.id, status: 'ACTIVE' } } },
        },
        orderBy: { dayNumber: 'asc' },
        include: { tasks: true, week: { include: { phase: { include: { roadmap: true } } } } },
      });
    }

    res.json(todayDay || null);
  } catch (err) { next(err); }
}

module.exports = { generate, getRoadmap, getMyRoadmaps, markDayComplete, markTaskComplete, reschedule, getTodayPlan, deleteRoadmap };

