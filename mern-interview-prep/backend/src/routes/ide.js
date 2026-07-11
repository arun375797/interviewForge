const express = require('express');
const ctrl = require('../controllers/ideController');

const router = express.Router();

router.get('/info', ctrl.getInfo);
router.post('/run', ctrl.runCode);
router.post('/reset', ctrl.resetData);

module.exports = router;
