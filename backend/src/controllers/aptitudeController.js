'use strict';
const { getNextQuestion, submitAnswer, getAptitudeStats } = require('../services/aptitudeService');
const { z } = require('zod');

async function nextQuestion(req, res, next) {
  try {
    const topic = req.query.topic || null;
    const question = await getNextQuestion(req.user.id, topic);
    if (!question) return res.status(404).json({ error: 'No questions available' });
    res.json(question);
  } catch (err) { next(err); }
}

const answerSchema = z.object({
  questionId: z.number().int(),
  answer:     z.number().int().min(0).max(3),
  timeTaken:  z.number().int().min(0).default(0),
});

async function submitAttempt(req, res, next) {
  try {
    const { questionId, answer, timeTaken } = answerSchema.parse(req.body);
    const result = await submitAnswer(req.user.id, questionId, answer, timeTaken);
    res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    res.json(await getAptitudeStats(req.user.id));
  } catch (err) { next(err); }
}

module.exports = { nextQuestion, submitAttempt, stats };
