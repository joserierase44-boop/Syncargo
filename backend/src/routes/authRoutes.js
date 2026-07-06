const express = require('express');
const router = express.Router();
const { login, registro, perfil, validacionLogin, validacionRegistro } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/auth');

router.post('/login', validacionLogin, login);
router.post('/registro', validacionRegistro, registro);
router.get('/perfil', verificarToken, perfil);

module.exports = router;
