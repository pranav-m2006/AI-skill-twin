'use strict';
/**
 * notificationService.js — PlaceMate AI
 *
 * Creates and queries Notification records.
 * Called by the controller (HTTP) and server cron (background).
 * Does NOT modify any existing services — purely additive.
 */

const prisma = require('../config/prisma');

// ─────────────────────────────────────────────
// Core: insert a single notification
// ─────────────────────────────────────────────
async function createNotification(userId, { type, title, body, link = null }) {
  return prisma.notification.create({
    data: { userId, type, title, body, link },
  });
}

// ─────────────────────────────────────────────
// Streak Reminder
// Fires once per day per user if they have no activity yet today
// ─────────────────────────────────────────────
async function generateStreakReminder(userId, streakData = {}) {
  const today = new Date().toISOString().slice(0, 10);

  // Check if we already sent a streak reminder today
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: 'STREAK',
      createdAt: { gte: new Date(today + 'T00:00:00Z') },
    },
  });
  if (existing) return null; // Already reminded today

  // Check if user has any activity today
  const activity = await prisma.dailyActivity.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const hasActivityToday = activity && activity.tasksCompleted > 0;
  if (hasActivityToday) return null; // User already active today

  const currentStreak = streakData.currentStreak ?? 0;
  const streakMsg = currentStreak > 0
    ? `You have a 🔥 ${currentStreak}-day streak — don't break it!`
    : `Start your first streak day — complete today's roadmap tasks!`;

  return createNotification(userId, {
    type: 'STREAK',
    title: "Don't forget today's tasks!",
    body: streakMsg,
    link: '/roadmap',
  });
}

// ─────────────────────────────────────────────
// Job Match Notifications
// Fires when new jobs match the user's target role
// ─────────────────────────────────────────────
async function generateJobNotifications(userId, targetRole) {
  if (!targetRole) return [];

  // Find jobs posted in the last 24 hours that match targetRole (case-insensitive)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const newJobs = await prisma.job.findMany({
    where: {
      isActive: true,
      postedAt: { gte: oneDayAgo },
      title: { contains: targetRole.split(' ')[0] }, // simple keyword match
    },
    include: { company: { select: { name: true } } },
    take: 3,
  });

  const created = [];
  for (const job of newJobs) {
    // Avoid duplicate notifications for the same job
    const dup = await prisma.notification.findFirst({
      where: { userId, type: 'JOB', body: { contains: String(job.id) } },
    });
    if (dup) continue;

    const notif = await createNotification(userId, {
      type: 'JOB',
      title: `New job match: ${job.title}`,
      body: `${job.company.name} · ${job.location} [id:${job.id}]`,
      link: '/jobs',
    });
    created.push(notif);
  }
  return created;
}

// ─────────────────────────────────────────────
// Internship Match Notifications
// ─────────────────────────────────────────────
async function generateInternshipNotifications(userId, targetRole) {
  if (!targetRole) return [];

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const newInternships = await prisma.internship.findMany({
    where: {
      isActive: true,
      postedAt: { gte: oneDayAgo },
      title: { contains: targetRole.split(' ')[0] },
    },
    include: { company: { select: { name: true } } },
    take: 2,
  });

  const created = [];
  for (const internship of newInternships) {
    const dup = await prisma.notification.findFirst({
      where: { userId, type: 'INTERNSHIP', body: { contains: String(internship.id) } },
    });
    if (dup) continue;

    const notif = await createNotification(userId, {
      type: 'INTERNSHIP',
      title: `New internship: ${internship.title}`,
      body: `${internship.company.name} · ${internship.duration} [id:${internship.id}]`,
      link: '/internships',
    });
    created.push(notif);
  }
  return created;
}

// ─────────────────────────────────────────────
// Goal / Learning Update Notifications
// Call this when a roadmap day is completed (from roadmapController)
// ─────────────────────────────────────────────
async function notifyGoalProgress(userId, { dayNumber, topic, completionPct, xpEarned = 0 }) {
  return createNotification(userId, {
    type: 'GOAL',
    title: `Day ${dayNumber} completed! 🎯`,
    body: `You finished "${topic}" (${Math.round(completionPct)}% complete) and earned +${xpEarned} XP.`,
    link: '/roadmap',
  });
}

// ─────────────────────────────────────────────
// Badge notification (call from badgeEngine after awarding)
// ─────────────────────────────────────────────
async function notifyBadgeEarned(userId, { badgeName, badgeDescription }) {
  return createNotification(userId, {
    type: 'BADGE',
    title: `🏅 Badge Unlocked: ${badgeName}`,
    body: badgeDescription,
    link: '/streak',
  });
}

// ─────────────────────────────────────────────
// Batch: run all hourly generators for all users
// Called by server cron — safe to run repeatedly
// ─────────────────────────────────────────────
async function runHourlyNotifications() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, targetRole: true },
    });

    for (const user of users) {
      // Streak log for the user
      const streakLog = await prisma.streakLog.findUnique({ where: { userId: user.id } });

      await generateStreakReminder(user.id, {
        currentStreak: streakLog?.currentStreak ?? 0,
      });

      await generateJobNotifications(user.id, user.targetRole);
      await generateInternshipNotifications(user.id, user.targetRole);
    }
  } catch (err) {
    console.error('[NotificationCron] Error:', err.message);
  }
}

module.exports = {
  createNotification,
  generateStreakReminder,
  generateJobNotifications,
  generateInternshipNotifications,
  notifyGoalProgress,
  notifyBadgeEarned,
  runHourlyNotifications,
};
