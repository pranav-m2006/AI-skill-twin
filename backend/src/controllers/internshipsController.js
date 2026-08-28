'use strict';
const prisma = require('../config/prisma');
const { computeJobMatchScore } = require('../services/matchingService');
const { fetchRealtimeInternshipsForLocation } = require('../services/aiJobService');

async function getInternships(req, res, next) {
  try {
    const { search, workMode, location, page = 1, limit = 20 } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { userSkills: { include: { skill: true } } },
    });

    const targetLocation = location || user?.location || 'PAN India';
    const targetDomain = user?.targetRole || user?.domain || 'Software Engineering';

    const where = { isActive: true };
    if (workMode) where.workMode = workMode;
    if (location) where.location = { contains: location };

    let count = await prisma.internship.count({ where });
    if (count === 0) {
      // If zero records, try quick AI fetch with 1.5s max wait
      await Promise.race([
        fetchRealtimeInternshipsForLocation({
          location: targetLocation,
          domain: targetDomain,
          query: search || '',
        }),
        new Promise(resolve => setTimeout(resolve, 1500)),
      ]).catch(err => console.warn('AI fetch background warning:', err.message));
    } else {
      // If DB already has items, fetch new ones asynchronously in background
      fetchRealtimeInternshipsForLocation({
        location: targetLocation,
        domain: targetDomain,
        query: search || '',
      }).catch(err => console.warn('AI fetch background warning:', err.message));
    }

    const userProfile = {
      resumeText: user ? user.resumeText || '' : '',
      domain: user ? user.domain || '' : '',
      targetRole: user ? user.targetRole || '' : '',
      skills: user ? user.userSkills.map(us => us.skill.name) : [],
    };

    let internships = await prisma.internship.findMany({
      where,
      include: { company: true },
      orderBy: { postedAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    internships = internships.map(i => ({
      ...i,
      skillsRequired: JSON.parse(i.skillsRequired || '[]'),
      matchPct: computeJobMatchScore(userProfile, {
        title: i.title,
        description: i.description,
        skillsRequired: JSON.parse(i.skillsRequired || '[]').join(' '),
      }),
    }));

    if (search) {
      const q = search.toLowerCase();
      internships = internships.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.company.name.toLowerCase().includes(q)
      );
    }

    res.json({ internships, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

async function getMatchedInternships(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { userSkills: { include: { skill: true } } },
    });

    const targetLocation = user?.location || 'PAN India';
    const targetDomain = user?.targetRole || user?.domain || 'Software Engineering';

    await fetchRealtimeInternshipsForLocation({
      location: targetLocation,
      domain: targetDomain,
    });

    const userProfile = {
      resumeText: user.resumeText || '',
      domain: user.domain || '',
      targetRole: user.targetRole || '',
      skills: user.userSkills.map(us => us.skill.name),
    };

    const internships = await prisma.internship.findMany({
      where: { isActive: true },
      include: { company: true },
      take: 50,
    });

    const scored = internships
      .map(i => ({
        ...i,
        skillsRequired: JSON.parse(i.skillsRequired || '[]'),
        matchPct: computeJobMatchScore(userProfile, {
          title: i.title,
          description: i.description,
          skillsRequired: JSON.parse(i.skillsRequired || '[]').join(' '),
        }),
      }))
      .sort((a, b) => b.matchPct - a.matchPct)
      .slice(0, 10);

    res.json(scored);
  } catch (err) { next(err); }
}

module.exports = { getInternships, getMatchedInternships };
