'use strict';
const { getDailyProgress, getWeeklyProgress, getMonthlyProgress, getRoadmapAdherence, getDashboardSummary } = require('../services/progressAnalytics');

async function daily(req, res, next) {
  try {
    const days = parseInt(req.query.days || '14');
    const roadmapId = req.query.roadmapId || null;
    res.json(await getDailyProgress(req.user.id, Math.min(days, 90), roadmapId));
  } catch (err) { next(err); }
}

async function weekly(req, res, next) {
  try {
    const weeks = parseInt(req.query.weeks || '8');
    const roadmapId = req.query.roadmapId || null;
    res.json(await getWeeklyProgress(req.user.id, Math.min(weeks, 52), roadmapId));
  } catch (err) { next(err); }
}

async function monthly(req, res, next) {
  try {
    const months = parseInt(req.query.months || '6');
    const roadmapId = req.query.roadmapId || null;
    res.json(await getMonthlyProgress(req.user.id, Math.min(months, 24), roadmapId));
  } catch (err) { next(err); }
}

async function adherence(req, res, next) {
  try {
    const roadmapId = req.query.roadmapId || null;
    res.json(await getRoadmapAdherence(req.user.id, roadmapId));
  } catch (err) { next(err); }
}

async function dashboard(req, res, next) {
  try {
    const roadmapId = req.query.roadmapId || null;
    res.json(await getDashboardSummary(req.user.id, roadmapId));
  } catch (err) { next(err); }
}

module.exports = { daily, weekly, monthly, adherence, dashboard };
