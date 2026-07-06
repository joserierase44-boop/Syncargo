const router = require('express').Router();
const ctrl = require('../controllers/entregas.controller');
const { verificarToken, autorizar } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/',                ctrl.todas);
router.get('/mis-entregas',    autorizar('transportista'), ctrl.misEntregas);
router.get('/:id',             ctrl.obtener);
router.put('/:id/asignar',     autorizar('admin','distribuidor'), ctrl.asignarTransportista);
router.put('/:id/estado',      ctrl.actualizarEstado);

module.exports = router;
