'use strict';
/**
 * skillTwinService.js — PlaceMate AI
 *
 * Computes the AI Skill Twin from aggregated evidence:
 *   1. Profile data (domain, targetRole, yearsExp)
 *   2. UserSkills (explicitly declared skills + proficiency)
 *   3. Assessment scores
 *   4. AptitudeAttempts (accuracy per topic)
 *   5. Completed roadmap days
 *
 * Returns a fully explainable readiness object — every score has
 * an evidence string explaining how it was computed.
 */

const prisma = require('../config/prisma');
const { rankSkillGaps, computeMatchScore } = require('./matchingService');

// ─────────────────────────────────────────────
// computeSkillTwin — main public API
// ─────────────────────────────────────────────
async function computeSkillTwin(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userSkills: { include: { skill: true } },
      assessments: { orderBy: { takenAt: 'desc' }, take: 10 },
      aptitudeAttempts: { include: { question: true }, orderBy: { attemptedAt: 'desc' }, take: 50 },
      roadmaps: {
        where: { status: 'ACTIVE' },
        include: {
          phases: {
            include: {
              weeks: {
                include: { days: { where: { status: 'COMPLETED' } } },
              },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!user) throw new Error('User not found');

  // Auto-seed default skills tailored to user domain & target role if empty
  if (user.userSkills.length === 0) {
    const domainLower = (user.domain || '').toLowerCase();
    const roleLower = (user.targetRole || '').toLowerCase();

    let DEFAULT_SKILLS = [];

    if (domainLower.includes('python') || domainLower.includes('data') || roleLower.includes('data')) {
      DEFAULT_SKILLS = [
        { name: 'Python', category: 'Programming', proficiency: 75 },
        { name: 'SQL', category: 'Database', proficiency: 70 },
        { name: 'Data Analysis & Pandas', category: 'Data Science', proficiency: 65 },
        { name: 'Machine Learning', category: 'AI', proficiency: 50 },
        { name: 'Statistics & Math', category: 'Core CS', proficiency: 60 },
        { name: 'Data Structures', category: 'Core CS', proficiency: 55 },
        { name: 'Git', category: 'Tools', proficiency: 80 },
        { name: 'REST API', category: 'Backend', proficiency: 45 },
      ];
    } else if (domainLower.includes('dsa') || domainLower.includes('cpp') || domainLower.includes('java')) {
      DEFAULT_SKILLS = [
        { name: 'Data Structures', category: 'Core CS', proficiency: 75 },
        { name: 'Algorithms & Complexity', category: 'Core CS', proficiency: 70 },
        { name: 'Object Oriented Programming', category: 'Core CS', proficiency: 80 },
        { name: 'C++ / Java Systems', category: 'Programming', proficiency: 70 },
        { name: 'Dynamic Programming', category: 'Problem Solving', proficiency: 45 },
        { name: 'DBMS & SQL', category: 'Database', proficiency: 65 },
        { name: 'Operating Systems', category: 'Core CS', proficiency: 60 },
        { name: 'System Design', category: 'Architecture', proficiency: 40 },
      ];
    } else {
      // Full Stack / Web Development default
      DEFAULT_SKILLS = [
        { name: 'JavaScript', category: 'Programming', proficiency: 75 },
        { name: 'React & Frontend', category: 'Frontend', proficiency: 70 },
        { name: 'Node.js & Express', category: 'Backend', proficiency: 65 },
        { name: 'HTML & CSS', category: 'Frontend', proficiency: 85 },
        { name: 'SQL & Databases', category: 'Database', proficiency: 60 },
        { name: 'Data Structures', category: 'Core CS', proficiency: 55 },
        { name: 'REST API Design', category: 'Backend', proficiency: 70 },
        { name: 'Git & GitHub', category: 'Tools', proficiency: 80 },
      ];
    }

    for (const d of DEFAULT_SKILLS) {
      let sk = await prisma.skill.findUnique({ where: { name: d.name } });
      if (!sk) {
        sk = await prisma.skill.create({ data: { name: d.name, category: d.category } });
      }
      await prisma.userSkill.create({
        data: { userId, skillId: sk.id, proficiency: d.proficiency, evidence: JSON.stringify(['Domain baseline proficiency']) },
      });
    }

    // Re-fetch user with new userSkills
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSkills: { include: { skill: true } },
      },
    });
    user.userSkills = updatedUser.userSkills;
  }

  // ── 1. Current skills & proficiency ──
  const currentSkills = user.userSkills.map(us => {
    let ev = 'Declared proficiency';
    try {
      const parsed = JSON.parse(us.evidence || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) ev = parsed[parsed.length - 1];
    } catch {}
    return {
      id: us.skillId,
      name: us.skill.name,
      category: us.skill.category || 'General',
      proficiency: us.proficiency,
      evidence: ev,
    };
  });

  // ── 2. Aptitude accuracy per topic ──
  const aptitudeByTopic = {};
  for (const attempt of user.aptitudeAttempts) {
    const topic = attempt.question.topic;
    if (!aptitudeByTopic[topic]) aptitudeByTopic[topic] = { correct: 0, total: 0 };
    aptitudeByTopic[topic].total++;
    if (attempt.isCorrect) aptitudeByTopic[topic].correct++;
  }
  const aptitudeTopicScores = Object.entries(aptitudeByTopic).map(([topic, stats]) => ({
    topic,
    accuracy: Math.round((stats.correct / stats.total) * 100),
    questionsAttempted: stats.total,
  }));

  // ── 3. Roadmap progress contribution ──
  const activeRoadmap = user.roadmaps[0] || null;
  let roadmapCompletedDays = 0;
  let roadmapTotalDays = 0;
  let roadmapDomain = user.domain;

  if (activeRoadmap) {
    roadmapTotalDays = activeRoadmap.totalDays;
    roadmapDomain = activeRoadmap.domain;
    for (const phase of activeRoadmap.phases) {
      for (const week of phase.weeks) {
        roadmapCompletedDays += week.days.length; // days with status COMPLETED
      }
    }
  }

  const roadmapPct = roadmapTotalDays > 0
    ? Math.round((roadmapCompletedDays / roadmapTotalDays) * 100)
    : 0;

  // ── 4. Assessment average ──
  const avgAssessmentScore = user.assessments.length > 0
    ? Math.round(user.assessments.reduce((s, a) => s + a.score, 0) / user.assessments.length)
    : 0;

  // ── 5. Overall readiness score ──
  // Weighted: skills 30%, aptitude avg 25%, roadmap progress 30%, assessments 15%
  const avgSkillProficiency = currentSkills.length > 0
    ? Math.round(currentSkills.reduce((s, sk) => s + sk.proficiency, 0) / currentSkills.length)
    : 0;

  const aptitudeAvg = aptitudeTopicScores.length > 0
    ? Math.round(aptitudeTopicScores.reduce((s, t) => s + t.accuracy, 0) / aptitudeTopicScores.length)
    : 0;

  const readinessScore = Math.round(
    avgSkillProficiency * 0.30 +
    aptitudeAvg          * 0.25 +
    roadmapPct           * 0.30 +
    avgAssessmentScore   * 0.15
  );

  // ── 6. Strengths & weak areas ──
  const strengths = currentSkills
    .filter(sk => sk.proficiency >= 70)
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, 5)
    .map(sk => ({
      name: sk.name,
      proficiency: sk.proficiency,
      evidence: `Declared proficiency: ${sk.proficiency}%`,
    }));

  const weakAreas = currentSkills
    .filter(sk => sk.proficiency < 50)
    .sort((a, b) => a.proficiency - b.proficiency)
    .slice(0, 5)
    .map(sk => ({
      name: sk.name,
      proficiency: sk.proficiency,
      evidence: `Proficiency: ${sk.proficiency}% — needs improvement`,
    }));

  // Low aptitude topics are also weak areas
  const weakAptitudeTopics = aptitudeTopicScores
    .filter(t => t.accuracy < 60)
    .map(t => ({
      name: `Aptitude: ${t.topic}`,
      proficiency: t.accuracy,
      evidence: `${t.accuracy}% accuracy across ${t.questionsAttempted} attempts`,
    }));

  const allWeakAreas = [...weakAreas, ...weakAptitudeTopics]
    .sort((a, b) => a.proficiency - b.proficiency)
    .slice(0, 6);

  // ── 7. Skill gap analysis (calls matchingService.rankSkillGaps) ──
  const allSkills = await prisma.skill.findMany();
  const rankedGaps = rankSkillGaps(
    user.userSkills.map(us => ({ ...us, skill: us.skill })),
    `${user.targetRole || ''} ${user.domain || ''}`,
    allSkills
  );

  const missingSkills = rankedGaps
    .filter(g => g.proficiency === 0)
    .slice(0, 8)
    .map(g => ({
      name: g.skill.name,
      category: g.skill.category,
      gap: g.gap,
      relevance: g.relevance,
      reason: g.reason,
    }));

  // ── 8. Dynamic Resume ATS Analysis ──
  let resumeMatchPct = 65;
  let resumeExtractedSkills = currentSkills.map(s => s.name).slice(0, 6);
  let resumeMissingKeywords = missingSkills.map(m => m.name).slice(0, 4);

  if (user.resumeText) {
    resumeMatchPct = computeMatchScore(user.resumeText, user.targetRole || user.domain || 'Software Engineer');
    // Extract keywords present in resume
    const resTextLower = user.resumeText.toLowerCase();
    const foundInResume = currentSkills.filter(s => resTextLower.includes(s.name.toLowerCase()));
    if (foundInResume.length > 0) {
      resumeExtractedSkills = foundInResume.map(s => s.name);
    }
  } else {
    // Dynamic baseline from user's active skills & readiness
    resumeMatchPct = Math.min(95, Math.max(50, Math.round(readinessScore * 0.9 + 15)));
  }

  const resumeAnalysis = {
    atsScore: resumeMatchPct,
    hasResume: !!user.resumeText,
    targetRole: user.targetRole || `${user.domain || 'Software'} Engineer`,
    extractedSkills: resumeExtractedSkills,
    missingKeywords: resumeMissingKeywords,
    summary: user.resumeText
      ? `Resume analyzed for ${user.targetRole || 'Target Role'}. Detected ${resumeExtractedSkills.length} matching skills.`
      : `Resume pending upload for ${user.targetRole || 'Target Role'}. Estimated ATS baseline: ${resumeMatchPct}%.`,
  };

  return {
    userId,
    readinessScore,
    evidenceMap: {
      skillsWeight: '30% — based on declared skill proficiencies',
      aptitudeWeight: '25% — based on aptitude attempt accuracy across topics',
      roadmapWeight: '30% — based on completed roadmap days vs total',
      assessmentsWeight: '15% — based on assessment scores',
    },
    skills: currentSkills,
    currentSkills,
    strengths,
    weakAreas: allWeakAreas,
    missingSkills,
    aptitudeTopicScores,
    roadmapProgress: {
      completedDays: roadmapCompletedDays,
      totalDays: roadmapTotalDays,
      pct: roadmapPct,
      domain: roadmapDomain,
    },
    resumeMatchPct,
    resumeAnalysis,
    avgSkillProficiency,
    aptitudeAvg,
    avgAssessmentScore,
    rankedGaps: rankedGaps.slice(0, 10).map(g => ({
      name: g.skill.name,
      gap: g.gap,
      proficiency: g.proficiency,
      reason: g.reason,
    })),
  };
}

// ─────────────────────────────────────────────
// updateUserSkill — called when an assessment or self-report changes skill proficiency
// ─────────────────────────────────────────────
async function updateUserSkill(userId, skillName, proficiency, evidenceString) {
  let skill = await prisma.skill.findUnique({ where: { name: skillName } });
  if (!skill) {
    skill = await prisma.skill.create({
      data: { name: skillName, category: 'Other' },
    });
  }

  const existing = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId, skillId: skill.id } },
  });

  const evidence = existing ? JSON.parse(existing.evidence || '[]') : [];
  if (evidenceString) evidence.push(evidenceString);

  return prisma.userSkill.upsert({
    where: { userId_skillId: { userId, skillId: skill.id } },
    update: { proficiency, evidence: JSON.stringify(evidence) },
    create: { userId, skillId: skill.id, proficiency, evidence: JSON.stringify(evidence) },
  });
}

module.exports = { computeSkillTwin, updateUserSkill };
