const router = require('express').Router();
const ctrl = require('../controllers/localController');
const { verificarToken, requiereRol } = require('../middleware/auth');

router.use(verificarToken);
router.get('/', ctrl.listar);
router.get('/mi-local', requiereRol('local'), ctrl.miLocal);
router.get('/:id', ctrl.obtener);
router.post('/', requiereRol('local','admin'), ctrl.crear);
router.put('/:id', requiereRol('local','admin'), ctrl.actualizar);

module.exports = router;
