const express = require('express');
const ctrl = require('../controllers/planController');

const router = express.Router();

router.get('/active', ctrl.getActivePlans);
router.post('/start', ctrl.startPlan);
router.patch('/:id/disable', ctrl.disablePlan);

module.exports = router;
