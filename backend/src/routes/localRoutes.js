const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/localController');
const { verificarToken, autorizarRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

// Todas las rutas de este módulo requieren estar autenticado como local_comercial
router.use(verificarToken, autorizarRoles(ROLES.LOCAL_COMERCIAL));

router.get('/mi-local', ctrl.miLocal);
router.put('/mi-local', ctrl.actualizarMiLocal);

router.post('/ventanas', ctrl.crearVentana);
router.post('/ventanas/generar-dia', ctrl.generarVentanasDelDia);

router.get('/agenda', ctrl.agendaDiaria);
router.get('/historial', ctrl.historial);

router.get('/solicitudes', ctrl.solicitudesPendientes);
router.put('/solicitudes/:id/aprobar', ctrl.aprobarReserva);
router.put('/solicitudes/:id/rechazar', ctrl.rechazarReserva);

module.exports = router;
