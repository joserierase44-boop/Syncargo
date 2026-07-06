const router = require('express').Router();
const ctrl = require('../controllers/incidencias.controller');
const { verificarToken, autorizar } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/',    ctrl.listar);
router.post('/',   autorizar('transportista'), ctrl.crear);

module.exports = router;
