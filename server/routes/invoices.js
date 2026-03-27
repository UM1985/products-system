const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const controller = require('../controllers/invoiceController');

router.get('/', auth, controller.getAll);
router.post('/', auth, controller.create);
router.delete('/:id', auth, controller.deleteOne);
router.put('/:id', auth, controller.update);

module.exports = router;
