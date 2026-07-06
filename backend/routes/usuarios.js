const router = require('express').Router();
const ctrl = require('../controllers/usuarioController');
const { verificarToken, requiereRol } = require('../middleware/auth');

router.use(verificarToken);
router.get('/', requiereRol('admin'), ctrl.listar);
router.get('/estadisticas', requiereRol('admin'), ctrl.estadisticas);
router.get('/:id', requiereRol('admin'), ctrl.obtener);
router.post('/', requiereRol('admin'), ctrl.crear);
router.put('/:id', requiereRol('admin'), ctrl.actualizar);
router.patch('/:id/toggle', requiereRol('admin'), ctrl.toggleActivo);

module.exports = router;
