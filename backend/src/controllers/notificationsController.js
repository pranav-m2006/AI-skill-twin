'use strict';
/**
 * notificationsController.js — PlaceMate AI
 *
 * REST endpoints for the notification system.
 * GET  /api/notifications            — list (paginated)
 * GET  /api/notifications/unread-count
 * POST /api/notifications/:id/read   — mark one read
 * POST /api/notifications/read-all   — mark all read
 * POST /api/notifications/trigger    — manually trigger generation (dev/test)
 */

const prisma = require('../config/prisma');
const {
  generateStreakReminder,
  generateJobNotifications,
  generateInternshipNotifications,
} = require('../services/notificationService');

// GET /api/notifications
async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const type = req.query.type || null; // optional filter: STREAK | JOB | INTERNSHIP | GOAL | BADGE

    const where = { userId, ...(type ? { type } : {}) };

    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      notifications,
      total,
      unreadCount: unread,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
}

// GET /api/notifications/unread-count
async function unreadCount(req, res, next) {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ count });
  } catch (err) { next(err); }
}

// POST /api/notifications/:id/read
async function markRead(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid notification id' });

    // Ensure the notification belongs to this user
    const notif = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

// POST /api/notifications/read-all
async function markAllRead(req, res, next) {
  try {
    const { count } = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ marked: count });
  } catch (err) { next(err); }
}

// POST /api/notifications/trigger  (manual trigger — useful for testing)
async function trigger(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetRole: true },
    });
    const streakLog = await prisma.streakLog.findUnique({ where: { userId } });

    const results = await Promise.allSettled([
      generateStreakReminder(userId, { currentStreak: streakLog?.currentStreak ?? 0 }),
      generateJobNotifications(userId, user?.targetRole),
      generateInternshipNotifications(userId, user?.targetRole),
    ]);

    const created = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
      .flat()
      .filter(Boolean);

    res.json({ generated: created.length, notifications: created });
  } catch (err) { next(err); }
}

module.exports = { list, unreadCount, markRead, markAllRead, trigger };
