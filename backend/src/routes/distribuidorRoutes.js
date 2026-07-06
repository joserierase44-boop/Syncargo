const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/distribuidorController');
const entregaCtrl = require('../controllers/entregaController');
const { verificarToken, autorizarRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(verificarToken, autorizarRoles(ROLES.DISTRIBUIDOR));

router.get('/horarios-disponibles', ctrl.buscarHorarios);
router.post('/reservas', ctrl.crearReserva);
router.get('/entregas', ctrl.misEntregas);
router.put('/reservas/:id/reprogramar', ctrl.reprogramar);
router.put('/reservas/:id/cancelar', ctrl.cancelarReserva);

router.put('/entregas/:id/asignar-transportista', entregaCtrl.asignarTransportista);
router.put('/entregas/:id/confirmar', entregaCtrl.confirmarEntrega);

module.exports = router;
