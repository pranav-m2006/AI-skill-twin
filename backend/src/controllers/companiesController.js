'use strict';
const prisma = require('../config/prisma');

async function getCompanies(req, res, next) {
  try {
    const { search, industry, page = 1, limit = 20 } = req.query;
    const where = {};
    if (industry) where.industry = industry;

    let companies = await prisma.company.findMany({
      where,
      include: {
        _count: { select: { jobs: true, internships: true } },
      },
      orderBy: { name: 'asc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    if (search) {
      const q = search.toLowerCase();
      companies = companies.filter(c => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q));
    }

    res.json({ companies, total: companies.length });
  } catch (err) { next(err); }
}

async function getCompany(req, res, next) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        jobs: { where: { isActive: true }, orderBy: { postedAt: 'desc' } },
        internships: { where: { isActive: true }, orderBy: { postedAt: 'desc' } },
      },
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const jobsWithSkills = company.jobs.map(j => ({ ...j, skillsRequired: JSON.parse(j.skillsRequired || '[]') }));
    const internshipsWithSkills = company.internships.map(i => ({ ...i, skillsRequired: JSON.parse(i.skillsRequired || '[]') }));

    res.json({ ...company, jobs: jobsWithSkills, internships: internshipsWithSkills });
  } catch (err) { next(err); }
}

module.exports = { getCompanies, getCompany };
