const router = require('express').Router();
const ctrl = require('../controllers/locales.controller');
const { verificarToken, autorizar } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/',        ctrl.listar);
router.get('/mi-local', autorizar('local'), ctrl.miLocal);
router.get('/:id',     ctrl.obtener);
router.post('/',       autorizar('local','admin'), ctrl.crear);
router.put('/:id',     autorizar('local','admin'), ctrl.actualizar);

module.exports = router;
