'use strict';
const { computeSkillTwin, updateUserSkill } = require('../services/skillTwinService');
const { z } = require('zod');

async function getMySkillTwin(req, res, next) {
  try {
    const twin = await computeSkillTwin(req.user.id);
    res.json(twin);
  } catch (err) { next(err); }
}

const updateSkillSchema = z.object({
  skillName:    z.string().min(1),
  proficiency:  z.number().min(0).max(100),
  evidence:     z.string().optional(),
});

async function updateSkill(req, res, next) {
  try {
    const { skillName, proficiency, evidence } = updateSkillSchema.parse(req.body);
    const result = await updateUserSkill(req.user.id, skillName, proficiency, evidence);
    res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    next(err);
  }
}

module.exports = { getMySkillTwin, updateSkill };
