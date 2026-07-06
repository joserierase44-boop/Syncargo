const router = require('express').Router();
const ctrl = require('../controllers/entregaController');
const { verificarToken, requiereRol } = require('../middleware/auth');

router.use(verificarToken);
router.get('/', requiereRol('admin'), ctrl.todas);
router.get('/mis-entregas', requiereRol('transportista'), ctrl.misEntregas);
router.get('/por-fecha', requiereRol('transportista'), ctrl.porFecha);
router.put('/:id/asignar', requiereRol('admin','distribuidor'), ctrl.asignarTransportista);
router.put('/:id/estado', requiereRol('transportista','admin'), ctrl.actualizarEstado);
router.post('/:id/incidencia', requiereRol('transportista'), ctrl.registrarIncidencia);

module.exports = router;
