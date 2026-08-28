'use strict';
const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/roadmapController');
const router = express.Router();

router.use(authenticate);
router.post('/generate', ctrl.generate);
router.get('/my', ctrl.getMyRoadmaps);
router.get('/today', ctrl.getTodayPlan);
router.get('/:id', ctrl.getRoadmap);
router.delete('/:id', ctrl.deleteRoadmap);

router.post('/:id/reschedule', ctrl.reschedule);
router.post('/day/:dayId/complete', ctrl.markDayComplete);
router.patch('/day/:dayId/complete', ctrl.markDayComplete);
router.post('/task/:taskId/complete', ctrl.markTaskComplete);
router.patch('/task/:taskId/complete', ctrl.markTaskComplete);

module.exports = router;
