'use strict';
const { z } = require('zod');
const prisma = require('../config/prisma');

const applySchema = z.object({
  jobId:        z.number().int().optional(),
  internshipId: z.number().int().optional(),
}).refine(d => d.jobId || d.internshipId, { message: 'Must provide jobId or internshipId' });

async function apply(req, res, next) {
  try {
    const data = applySchema.parse(req.body);

    // Prevent duplicate application
    const existing = await prisma.application.findFirst({
      where: { userId: req.user.id, jobId: data.jobId, internshipId: data.internshipId },
    });
    if (existing) return res.status(409).json({ error: 'Already applied' });

    const app = await prisma.application.create({
      data: { userId: req.user.id, ...data },
    });
    res.status(201).json(app);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    next(err);
  }
}

async function getMyApplications(req, res, next) {
  try {
    const apps = await prisma.application.findMany({
      where: { userId: req.user.id },
      include: {
        job: { include: { company: true } },
        internship: { include: { company: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
    res.json(apps);
  } catch (err) { next(err); }
}

module.exports = { apply, getMyApplications };
