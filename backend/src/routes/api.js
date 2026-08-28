'use strict';
const express = require('express');
const { authenticate } = require('../middleware/auth');
const streak = require('../controllers/streakController');
const progress = require('../controllers/progressController');
const skillTwin = require('../controllers/skillTwinController');
const aptitude = require('../controllers/aptitudeController');
const jobs = require('../controllers/jobsController');
const companies = require('../controllers/companiesController');
const internships = require('../controllers/internshipsController');
const applications = require('../controllers/applicationsController');
const chatbot = require('../controllers/chatbotController');
const codeRunner = require('../controllers/codeRunnerController');
const { getUserBadges } = require('../services/badgeEngine');
const notifications = require('../controllers/notificationsController');

const router = express.Router();
router.use(authenticate);

// Streak
router.get('/streak', streak.getMyStreak);
router.get('/streak/calendar', streak.getCalendar);

// Progress
router.get('/progress/daily', progress.daily);
router.get('/progress/weekly', progress.weekly);
router.get('/progress/monthly', progress.monthly);
router.get('/progress/adherence', progress.adherence);
router.get('/progress/dashboard', progress.dashboard);

// Skill Twin
router.get('/skill-twin', skillTwin.getMySkillTwin);
router.post('/skill-twin/skill', skillTwin.updateSkill);

// Aptitude
router.get('/aptitude/question', aptitude.nextQuestion);
router.post('/aptitude/answer', aptitude.submitAttempt);
router.get('/aptitude/stats', aptitude.stats);

// Jobs
router.get('/jobs', jobs.getJobs);
router.get('/jobs/match', jobs.getMatchedJobs);
router.get('/jobs/:id', jobs.getJob);

// Companies
router.get('/companies', companies.getCompanies);
router.get('/companies/:id', companies.getCompany);

// Internships
router.get('/internships', internships.getInternships);
router.get('/internships/match', internships.getMatchedInternships);

// Applications
router.post('/applications', applications.apply);
router.get('/applications', applications.getMyApplications);

// Badges
router.get('/badges', async (req, res, next) => {
  try { res.json(await getUserBadges(req.user.id)); }
  catch (err) { next(err); }
});

// Chatbot
router.post('/chatbot', chatbot.sendMessage);
router.get('/chatbot/history', chatbot.getHistory);

// Code Runner (local execution & submission — no external API)
router.post('/code/run', codeRunner.runCode);
router.post('/code/submit', codeRunner.submitCode);

// Notifications
router.get('/notifications', notifications.list);
router.get('/notifications/unread-count', notifications.unreadCount);
router.post('/notifications/read-all', notifications.markAllRead);
router.post('/notifications/trigger', notifications.trigger);
router.post('/notifications/:id/read', notifications.markRead);

module.exports = router;
