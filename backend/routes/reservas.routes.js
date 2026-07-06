const router = require('express').Router();
const ctrl = require('../controllers/reservas.controller');
const { verificarToken, autorizar } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/mias',            autorizar('distribuidor'), ctrl.listarMias);
router.post('/',               autorizar('distribuidor'), ctrl.crear);
router.put('/:id/responder',   autorizar('local'), ctrl.responder);
router.put('/:id/cancelar',    ctrl.cancelar);

module.exports = router;
