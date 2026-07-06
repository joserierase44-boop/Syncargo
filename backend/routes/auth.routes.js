const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.post('/login',            ctrl.login);
router.get('/perfil',            verificarToken, ctrl.perfil);
router.put('/cambiar-password',  verificarToken, ctrl.cambiarPassword);

module.exports = router;
