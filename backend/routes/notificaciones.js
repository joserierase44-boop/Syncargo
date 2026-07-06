const router = require('express').Router();
const ctrl = require('../controllers/notificacionController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);
router.get('/', ctrl.mis);
router.put('/:id/leer', ctrl.marcarLeida);
router.put('/leer-todas', ctrl.marcarTodasLeidas);

module.exports = router;
