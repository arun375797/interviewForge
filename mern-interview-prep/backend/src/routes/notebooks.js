const express = require('express');
const ctrl = require('../controllers/notebookController');

const router = express.Router();

router.get('/', ctrl.listNotebooks);
router.post('/', ctrl.createNotebook);
router.get('/:id', ctrl.getNotebook);
router.put('/:id', ctrl.updateNotebook);
router.delete('/:id', ctrl.deleteNotebook);

router.post('/:id/pages', ctrl.createPage);
router.get('/:id/pages/:pageId', ctrl.getPage);
router.put('/:id/pages/:pageId', ctrl.updatePage);
router.delete('/:id/pages/:pageId', ctrl.deletePage);

module.exports = router;
