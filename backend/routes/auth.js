const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.post('/registro', ctrl.registro);
router.get('/perfil', verificarToken, ctrl.perfil);
router.put('/cambiar-password', verificarToken, ctrl.cambiarPassword);

module.exports = router;
