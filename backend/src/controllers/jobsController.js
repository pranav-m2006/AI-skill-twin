'use strict';
const prisma = require('../config/prisma');
const { computeJobMatchScore } = require('../services/matchingService');
const { fetchRealtimeJobsForLocation } = require('../services/aiJobService');

async function getJobs(req, res, next) {
  try {
    const { search, workMode, location, page = 1, limit = 20 } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { userSkills: { include: { skill: true } } },
    });

    const targetLocation = location || user?.location || 'PAN India';
    const targetDomain = user?.targetRole || user?.domain || 'Software Engineer';

    // Trigger AI real-time job fetch if location/search is provided or existing count is low
    const where = { isActive: true };
    if (workMode) where.workMode = workMode;
    if (location) where.location = { contains: location };

    let count = await prisma.job.count({ where });
    if (count === 0) {
      await Promise.race([
        fetchRealtimeJobsForLocation({
          location: targetLocation,
          domain: targetDomain,
          query: search || '',
        }),
        new Promise(resolve => setTimeout(resolve, 1500)),
      ]).catch(err => console.warn('AI job fetch warning:', err.message));
    } else {
      fetchRealtimeJobsForLocation({
        location: targetLocation,
        domain: targetDomain,
        query: search || '',
      }).catch(err => console.warn('AI job fetch warning:', err.message));
    }

    let jobs = await prisma.job.findMany({
      where,
      include: { company: true },
      orderBy: { postedAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const userProfile = {
      resumeText: user ? user.resumeText || '' : '',
      domain: user ? user.domain || '' : '',
      targetRole: user ? user.targetRole || '' : '',
      skills: user ? user.userSkills.map(us => us.skill.name) : [],
    };

    jobs = jobs.map(job => ({
      ...job,
      skillsRequired: JSON.parse(job.skillsRequired || '[]'),
      matchPct: computeJobMatchScore(userProfile, {
        title: job.title,
        description: job.description,
        skillsRequired: JSON.parse(job.skillsRequired || '[]').join(' '),
      }),
    }));

    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.name.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
      );
    }

    const total = await prisma.job.count({ where });
    res.json({ jobs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

async function getJob(req, res, next) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { company: { include: { jobs: { where: { isActive: true }, take: 5 }, internships: { where: { isActive: true }, take: 5 } } } },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ ...job, skillsRequired: JSON.parse(job.skillsRequired || '[]') });
  } catch (err) { next(err); }
}

async function getMatchedJobs(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { userSkills: { include: { skill: true } } },
    });

    const targetLocation = user?.location || 'PAN India';
    const targetDomain = user?.targetRole || user?.domain || 'Software Engineer';

    // Auto fetch real-time jobs matching user profile
    await fetchRealtimeJobsForLocation({
      location: targetLocation,
      domain: targetDomain,
    });

    const userProfile = {
      resumeText: user.resumeText || '',
      domain: user.domain || '',
      targetRole: user.targetRole || '',
      skills: user.userSkills.map(us => us.skill.name),
    };

    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      include: { company: true },
      take: 50,
    });

    const scored = jobs
      .map(j => ({
        ...j,
        skillsRequired: JSON.parse(j.skillsRequired || '[]'),
        matchPct: computeJobMatchScore(userProfile, {
          title: j.title,
          description: j.description,
          skillsRequired: JSON.parse(j.skillsRequired || '[]').join(' '),
        }),
      }))
      .sort((a, b) => b.matchPct - a.matchPct)
      .slice(0, 20);

    res.json(scored);
  } catch (err) { next(err); }
}

module.exports = { getJobs, getJob, getMatchedJobs };
