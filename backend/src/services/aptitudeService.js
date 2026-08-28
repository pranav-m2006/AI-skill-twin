'use strict';
/**
 * aptitudeService.js — PlaceMate AI
 *
 * Adaptive difficulty engine for aptitude questions.
 * Difficulty escalates on sustained good performance and
 * drops on struggle. Topic progression gates: next topic
 * only after ≥70% accuracy on current.
 */

const prisma = require('../config/prisma');

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const TOPIC_UNLOCK_THRESHOLD = 0.70; // 70% accuracy to unlock next topic
const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD'];

// Ordered topic progression for Aptitude roadmap (matches §7)
const TOPIC_ORDER = [
  'Number System',
  'Percentages',
  'Profit & Loss',
  'Ratio & Proportion',
  'Averages',
  'Time & Work',
  'Time-Speed-Distance',
  'Simple Interest',
  'Compound Interest',
  'Probability',
  'Permutation & Combination',
  'Data Interpretation',
  'Mixed Practice',
  'Mock Tests',
];

// ─────────────────────────────────────────────
// getAdaptiveDifficulty — computes difficulty from last N attempts
// Returns 'EASY' | 'MEDIUM' | 'HARD'
// ─────────────────────────────────────────────
async function getAdaptiveDifficulty(userId, topic, windowSize = 5) {
  const recent = await prisma.aptitudeAttempt.findMany({
    where: {
      userId,
      question: { topic },
    },
    orderBy: { attemptedAt: 'desc' },
    take: windowSize,
    include: { question: true },
  });

  if (recent.length < 2) return 'EASY'; // not enough data — start easy

  const correctCount = recent.filter(a => a.isCorrect).length;
  const accuracy = correctCount / recent.length;

  // Last difficulty attempted
  const lastDifficulty = recent[0].question.difficulty;

  if (accuracy >= 0.80) {
    // Doing very well — escalate
    const idx = DIFFICULTY_LEVELS.indexOf(lastDifficulty);
    return DIFFICULTY_LEVELS[Math.min(idx + 1, DIFFICULTY_LEVELS.length - 1)];
  } else if (accuracy <= 0.40) {
    // Struggling — drop down
    const idx = DIFFICULTY_LEVELS.indexOf(lastDifficulty);
    return DIFFICULTY_LEVELS[Math.max(idx - 1, 0)];
  }
  return lastDifficulty; // maintain
}

// ─────────────────────────────────────────────
// getTopicAccuracy — overall accuracy for a user on a topic
// ─────────────────────────────────────────────
async function getTopicAccuracy(userId, topic) {
  const attempts = await prisma.aptitudeAttempt.findMany({
    where: { userId, question: { topic } },
  });
  if (attempts.length === 0) return null;
  const correct = attempts.filter(a => a.isCorrect).length;
  return { accuracy: correct / attempts.length, total: attempts.length };
}

// ─────────────────────────────────────────────
// getCurrentTopic — returns the topic the user should be on
// Based on topic order and unlock threshold
// ─────────────────────────────────────────────
async function getCurrentTopic(userId) {
  for (const topic of TOPIC_ORDER) {
    const stats = await getTopicAccuracy(userId, topic);
    if (!stats) return topic; // never attempted — start here
    if (stats.accuracy < TOPIC_UNLOCK_THRESHOLD || stats.total < 5) {
      return topic; // not yet unlocked
    }
  }
  return 'Mixed Practice'; // all topics passed
}

// ─────────────────────────────────────────────
// getNextQuestion — main public API
// Selects an appropriate question for the user
// ─────────────────────────────────────────────
async function getNextQuestion(userId, topicOverride = null) {
  const topic = topicOverride || (await getCurrentTopic(userId));
  const difficulty = await getAdaptiveDifficulty(userId, topic);

  // Get IDs of questions the user has already attempted in the last 50 tries
  const recentAttempts = await prisma.aptitudeAttempt.findMany({
    where: { userId },
    orderBy: { attemptedAt: 'desc' },
    take: 50,
    select: { questionId: true },
  });
  const seenIds = recentAttempts.map(a => a.questionId);

  // Find an unseen question of the correct difficulty
  let question = await prisma.aptitudeQuestion.findFirst({
    where: {
      topic,
      difficulty,
      id: { notIn: seenIds },
    },
    orderBy: { id: 'asc' },
  });

  // Fallback: same topic, any difficulty
  if (!question) {
    question = await prisma.aptitudeQuestion.findFirst({
      where: {
        topic,
        id: { notIn: seenIds },
      },
      orderBy: { id: 'asc' },
    });
  }

  // Fallback: any unseen question
  if (!question) {
    question = await prisma.aptitudeQuestion.findFirst({
      where: { id: { notIn: seenIds } },
    });
  }

  // Last resort: any question (user has seen everything)
  if (!question) {
    question = await prisma.aptitudeQuestion.findFirst({ where: { topic } });
  }

  if (!question) return null;

  return {
    id: question.id,
    topic: question.topic,
    difficulty: question.difficulty,
    content: question.content,
    options: JSON.parse(question.options),
    // Note: answer is NOT sent to client until they submit
    adaptiveDifficulty: difficulty,
    currentTopic: topic,
  };
}

// ─────────────────────────────────────────────
// submitAnswer — records attempt, returns result + explanation
// ─────────────────────────────────────────────
async function submitAnswer(userId, questionId, userAnswer, timeTaken = 0) {
  const question = await prisma.aptitudeQuestion.findUnique({ where: { id: questionId } });
  if (!question) throw new Error('Question not found');

  const isCorrect = userAnswer === question.answer;

  const attempt = await prisma.aptitudeAttempt.create({
    data: {
      userId,
      questionId,
      userAnswer,
      isCorrect,
      timeTaken,
    },
  });

  // Award XP: 10 for correct, 2 for attempted
  const xpAmount = isCorrect ? 10 : 2;
  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: xpAmount } },
  });
  await prisma.xpEvent.create({
    data: { userId, amount: xpAmount, reason: `Aptitude: ${isCorrect ? 'Correct' : 'Attempted'} — ${question.topic}` },
  });

  // Check aptitude badges
  const totalAttempts = await prisma.aptitudeAttempt.count({ where: { userId } });
  const { awardBadge } = require('./badgeEngine');
  if (totalAttempts === 1) await awardBadge(userId, 'APT_FIRST');
  if (totalAttempts >= 100) await awardBadge(userId, 'APT_100');

  return {
    isCorrect,
    correctAnswer: question.answer,
    correctOption: JSON.parse(question.options)[question.answer],
    explanation: question.explanation,
    xpEarned: xpAmount,
  };
}

// ─────────────────────────────────────────────
// getAptitudeStats — summary stats for user
// ─────────────────────────────────────────────
async function getAptitudeStats(userId) {
  const attempts = await prisma.aptitudeAttempt.findMany({
    where: { userId },
    include: { question: true },
  });

  const topicMap = {};
  for (const a of attempts) {
    const t = a.question.topic;
    if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0, topic: t };
    topicMap[t].total++;
    if (a.isCorrect) topicMap[t].correct++;
  }

  const topicStats = Object.values(topicMap).map(t => ({
    topic: t.topic,
    total: t.total,
    correct: t.correct,
    accuracy: t.total > 0 ? +(t.correct / t.total * 100).toFixed(1) : 0,
    unlocked: t.total >= 5 && t.correct / t.total >= TOPIC_UNLOCK_THRESHOLD,
  }));

  const totalCorrect = attempts.filter(a => a.isCorrect).length;

  return {
    totalAttempted: attempts.length,
    totalCorrect,
    overallAccuracy: attempts.length > 0
      ? +(totalCorrect / attempts.length * 100).toFixed(1)
      : 0,
    topicStats,
    topicOrder: TOPIC_ORDER,
    currentTopic: await getCurrentTopic(userId),
  };
}

module.exports = {
  TOPIC_ORDER,
  TOPIC_UNLOCK_THRESHOLD,
  getNextQuestion,
  submitAnswer,
  getAptitudeStats,
  getAdaptiveDifficulty,
  getCurrentTopic,
};
