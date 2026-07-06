const router = require('express').Router();
const ctrl = require('../controllers/ventanas.controller');
const { verificarToken, autorizar } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/disponibles',  ctrl.listarDisponibles);
router.get('/mi-local',     autorizar('local'), ctrl.listarPorLocal);
router.post('/',            autorizar('local','admin'), ctrl.crear);
router.put('/:id/bloquear', autorizar('local','admin'), ctrl.bloquear);
router.delete('/:id',       autorizar('local','admin'), ctrl.eliminar);

module.exports = router;
