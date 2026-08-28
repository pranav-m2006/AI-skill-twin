'use strict';
/**
 * badgeEngine.js — PlaceMate AI
 *
 * Append-only badge award system. Never mutates existing UserBadge records.
 * Called by streakEngine, roadmapEngine, and XP events.
 */

const prisma = require('../config/prisma');

// ─────────────────────────────────────────────
// Badge definitions
// ─────────────────────────────────────────────
const STREAK_BADGES = [
  { code: 'STREAK_3',   name: 'Consistency Starter',  days: 3,   xp: 50,  icon: 'Flame' },
  { code: 'STREAK_7',   name: 'Weekly Warrior',        days: 7,   xp: 100, icon: 'Zap' },
  { code: 'STREAK_14',  name: 'Consistency Builder',   days: 14,  xp: 200, icon: 'Shield' },
  { code: 'STREAK_30',  name: 'Monthly Master',        days: 30,  xp: 500, icon: 'Star' },
  { code: 'STREAK_50',  name: 'Streak Champion',       days: 50,  xp: 750, icon: 'Trophy' },
  { code: 'STREAK_100', name: 'Century Learner',       days: 100, xp: 1500, icon: 'Award' },
  { code: 'STREAK_365', name: 'Year-Long Learner',     days: 365, xp: 5000, icon: 'Crown' },
];

const ROADMAP_BADGES = [
  { code: 'ROADMAP_25',  name: 'Quarter Way',          pct: 25,  xp: 100, icon: 'BookOpen' },
  { code: 'ROADMAP_50',  name: 'Halfway Hero',          pct: 50,  xp: 250, icon: 'BookMarked' },
  { code: 'ROADMAP_75',  name: 'Almost There',          pct: 75,  xp: 400, icon: 'CheckCircle' },
  { code: 'ROADMAP_100', name: 'Roadmap Complete',      pct: 100, xp: 1000, icon: 'GraduationCap' },
];

const XP_BADGES = [
  { code: 'XP_500',   name: 'Learner',             xp: 500,   icon: 'Sparkles' },
  { code: 'XP_1000',  name: 'Scholar',             xp: 1000,  icon: 'Brain' },
  { code: 'XP_5000',  name: 'Expert',              xp: 5000,  icon: 'Lightbulb' },
  { code: 'XP_10000', name: 'Master',              xp: 10000, icon: 'Crown' },
];

const APTITUDE_BADGES = [
  { code: 'APT_FIRST',   name: 'First Step',         icon: 'Target' },
  { code: 'APT_100',     name: 'Century Solver',     icon: 'Hash' },
  { code: 'APT_PERFECT', name: 'Flawless Round',     icon: 'CheckCircle2' },
];

// ─────────────────────────────────────────────
// Ensure badge definitions exist in DB (idempotent bootstrap)
// ─────────────────────────────────────────────
async function ensureBadgesExist() {
  const allDefs = [
    ...STREAK_BADGES.map(b => ({ ...b, category: 'STREAK', description: `Maintain a ${b.days}-day streak` })),
    ...ROADMAP_BADGES.map(b => ({ ...b, category: 'ROADMAP', description: `Complete ${b.pct}% of your roadmap` })),
    ...XP_BADGES.map(b => ({ ...b, category: 'XP', description: `Earn ${b.xp} XP` })),
    { code: 'APT_FIRST',   name: 'First Step',     category: 'APTITUDE', description: 'Complete your first aptitude question', xp: 10,  icon: 'Target' },
    { code: 'APT_100',     name: 'Century Solver', category: 'APTITUDE', description: 'Answer 100 aptitude questions',          xp: 200, icon: 'Hash' },
    { code: 'APT_PERFECT', name: 'Flawless Round', category: 'APTITUDE', description: 'Score 100% in an aptitude session',       xp: 150, icon: 'CheckCircle2' },
  ];

  for (const def of allDefs) {
    await prisma.badge.upsert({
      where: { code: def.code },
      update: {},
      create: {
        code: def.code,
        name: def.name,
        description: def.description,
        category: def.category,
        xpReward: def.xp || 0,
        iconName: def.icon,
      },
    });
  }
}

// ─────────────────────────────────────────────
// Core award function — idempotent, append-only
// ─────────────────────────────────────────────
async function awardBadge(userId, badgeCode) {
  const badge = await prisma.badge.findUnique({ where: { code: badgeCode } });
  if (!badge) return null;

  // Check if already awarded
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return null; // already awarded — do nothing

  // Award badge
  const userBadge = await prisma.userBadge.create({
    data: { userId, badgeId: badge.id },
    include: { badge: true },
  });

  // Grant XP if applicable
  if (badge.xpReward > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: badge.xpReward } },
    });
    await prisma.xpEvent.create({
      data: { userId, amount: badge.xpReward, reason: `Badge: ${badge.name}` },
    });
  }

  // Add to today's DailyActivity badgesEarned JSON
  const today = new Date().toISOString().slice(0, 10);
  const activity = await prisma.dailyActivity.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (activity) {
    const earned = JSON.parse(activity.badgesEarned || '[]');
    earned.push(badgeCode);
    await prisma.dailyActivity.update({
      where: { userId_date: { userId, date: today } },
      data: { badgesEarned: JSON.stringify(earned) },
    });
  }

  return userBadge;
}

// ─────────────────────────────────────────────
// awardStreakBadges — called by streakEngine
// Checks all streak milestones against current streak count
// ─────────────────────────────────────────────
async function awardStreakBadges(userId, currentStreak) {
  const awarded = [];
  for (const def of STREAK_BADGES) {
    if (currentStreak >= def.days) {
      const result = await awardBadge(userId, def.code);
      if (result) awarded.push(result);
    }
  }
  return awarded;
}

// ─────────────────────────────────────────────
// awardRoadmapBadges — called by roadmapEngine
// ─────────────────────────────────────────────
async function awardRoadmapBadges(userId, completionPct) {
  const awarded = [];
  for (const def of ROADMAP_BADGES) {
    if (completionPct >= def.pct) {
      const result = await awardBadge(userId, def.code);
      if (result) awarded.push(result);
    }
  }
  return awarded;
}

// ─────────────────────────────────────────────
// awardXpBadges — called after any XP increment
// ─────────────────────────────────────────────
async function awardXpBadges(userId, totalXp) {
  const awarded = [];
  for (const def of XP_BADGES) {
    if (totalXp >= def.xp) {
      const result = await awardBadge(userId, def.code);
      if (result) awarded.push(result);
    }
  }
  return awarded;
}

// ─────────────────────────────────────────────
// getUserBadges — returns all badges a user has earned
// ─────────────────────────────────────────────
async function getUserBadges(userId) {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  });
  return userBadges.map(ub => ({
    code: ub.badge.code,
    name: ub.badge.name,
    description: ub.badge.description,
    category: ub.badge.category,
    xpReward: ub.badge.xpReward,
    iconName: ub.badge.iconName,
    earnedAt: ub.earnedAt,
  }));
}

module.exports = {
  STREAK_BADGES,
  ROADMAP_BADGES,
  XP_BADGES,
  ensureBadgesExist,
  awardBadge,
  awardStreakBadges,
  awardRoadmapBadges,
  awardXpBadges,
  getUserBadges,
};
