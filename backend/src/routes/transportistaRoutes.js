const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transportistaController');
const { verificarToken, autorizarRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(verificarToken, autorizarRoles(ROLES.TRANSPORTISTA));

router.get('/entregas', ctrl.misEntregas);
router.get('/entregas/:id', ctrl.detalleEntrega);

router.put('/entregas/:id/confirmar-salida', ctrl.confirmarSalida);
router.put('/entregas/:id/confirmar-llegada', ctrl.confirmarLlegada);
router.put('/entregas/:id/iniciar-descarga', ctrl.iniciarDescarga);
router.put('/entregas/:id/completar', ctrl.confirmarDescargaCompletada);

router.post('/entregas/:id/incidencias', ctrl.registrarIncidencia);

module.exports = router;
