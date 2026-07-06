const router = require('express').Router();
const ctrl = require('../controllers/reporteController');
const { verificarToken, requiereRol } = require('../middleware/auth');

router.use(verificarToken, requiereRol('admin'));
router.get('/resumen', ctrl.resumen);
router.get('/por-estado', ctrl.porEstado);

module.exports = router;
