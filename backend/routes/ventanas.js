const router = require('express').Router();
const ctrl = require('../controllers/ventanaController');
const { verificarToken, requiereRol } = require('../middleware/auth');

router.use(verificarToken);
router.get('/disponibles', ctrl.disponibles);
router.get('/mi-local', requiereRol('local'), ctrl.porLocal);
router.post('/', requiereRol('local'), ctrl.crear);
router.post('/multiple', requiereRol('local'), ctrl.crearMultiple);
router.delete('/:id', requiereRol('local','admin'), ctrl.eliminar);

module.exports = router;
