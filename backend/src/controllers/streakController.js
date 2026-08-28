'use strict';
const { getStreakMetrics, getCalendarData } = require('../services/streakEngine');
const { getUserBadges } = require('../services/badgeEngine');

async function getMyStreak(req, res, next) {
  try {
    const roadmapId = req.query.roadmapId || null;
    const metrics = await getStreakMetrics(req.user.id, roadmapId);
    const badges = await getUserBadges(req.user.id);
    res.json({ ...metrics, badges });
  } catch (err) { next(err); }
}

async function getCalendar(req, res, next) {
  try {
    const now = new Date();
    const year  = parseInt(req.query.year  || now.getFullYear());
    const month = parseInt(req.query.month || now.getMonth() + 1);
    const data = await getCalendarData(req.user.id, year, month);
    res.json({ year, month, days: data });
  } catch (err) { next(err); }
}

module.exports = { getMyStreak, getCalendar };
