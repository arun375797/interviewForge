const express = require('express');
const ctrl = require('../controllers/questionController');

const router = express.Router();

router.get('/subjects', ctrl.getSubjects);
router.get('/subjects/:subject/topics', ctrl.getTopics);
router.get('/stats', ctrl.getStats);
router.get('/random', ctrl.getRandomQuestion);
router.get('/', ctrl.getQuestions);
router.get('/:id', ctrl.getQuestionById);
router.post('/', ctrl.createQuestion);
router.put('/:id', ctrl.updateQuestion);
router.delete('/:id', ctrl.deleteQuestion);
router.patch('/:id/bookmark', ctrl.toggleBookmark);
router.patch('/:id/mastered', ctrl.toggleMastered);

module.exports = router;
