const router = require('express').Router();
const ctrl = require('../controllers/reservaController');
const { verificarToken, requiereRol } = require('../middleware/auth');

router.use(verificarToken);
router.post('/', requiereRol('distribuidor'), ctrl.crear);
router.get('/mis-reservas', requiereRol('distribuidor'), ctrl.misReservas);
router.get('/pendientes', requiereRol('local'), ctrl.pendientesLocal);
router.put('/:id/responder', requiereRol('local'), ctrl.responder);
router.put('/:id/cancelar', ctrl.cancelar);

module.exports = router;
