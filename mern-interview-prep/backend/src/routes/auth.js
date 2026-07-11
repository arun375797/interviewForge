const express = require('express');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post('/login', ctrl.login);
router.post('/google', ctrl.googleLogin);
router.get('/me', ctrl.protect, ctrl.me);
router.get('/users', ctrl.protect, ctrl.requireAdmin, ctrl.listUsers);
router.patch('/users/:id/block', ctrl.protect, ctrl.requireAdmin, ctrl.setUserBlocked);

module.exports = router;
