const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Local = require('../models/Local');
const { generarToken } = require('../utils/jwt');
const { asyncHandler } = require('../middlewares/errorHandler');
const { ROLES } = require('../config/constants');

const validacionLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

const validacionRegistro = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').isIn(Object.values(ROLES)).withMessage('Rol inválido')
];

const login = asyncHandler(async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ exito: false, mensaje: errores.array()[0].msg });
  }

  const { email, password } = req.body;

  const usuario = await Usuario.buscarPorEmail(email);
  if (!usuario) {
    return res.status(401).json({ exito: false, mensaje: 'Credenciales incorrectas' });
  }

  if (!usuario.activo) {
    return res.status(403).json({ exito: false, mensaje: 'Tu cuenta está desactivada. Contacta al administrador.' });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return res.status(401).json({ exito: false, mensaje: 'Credenciales incorrectas' });
  }

  const token = generarToken(usuario);

  res.json({
    exito: true,
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      empresa: usuario.empresa
    }
  });
});

// Registro abierto para distribuidor y transportista.
// Local Comercial también puede auto-registrarse y crea su local en el mismo paso.
// El administrador no se crea por esta vía (se gestiona directo en base de datos o por otro admin).
const registro = asyncHandler(async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ exito: false, mensaje: errores.array()[0].msg });
  }

  const { nombre, email, password, rol, telefono, empresa, placa_vehiculo, local } = req.body;

  if (rol === ROLES.ADMINISTRADOR) {
    return res.status(403).json({ exito: false, mensaje: 'El registro de administradores no está permitido por esta vía' });
  }

  const existente = await Usuario.buscarPorEmail(email);
  if (existente) {
    return res.status(409).json({ exito: false, mensaje: 'Ese email ya está registrado' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const usuarioId = await Usuario.crear({ nombre, email, password_hash, rol, telefono, empresa, placa_vehiculo });

  // Si se registra como local comercial, se exige la info del local para crearlo de inmediato
  if (rol === ROLES.LOCAL_COMERCIAL) {
    if (!local || !local.nombre || !local.direccion || !local.ciudad) {
      return res.status(400).json({ exito: false, mensaje: 'Debes incluir los datos del local (nombre, dirección, ciudad)' });
    }
    await Local.crear({ usuario_id: usuarioId, ...local });
  }

  const usuarioCreado = await Usuario.buscarPorId(usuarioId);
  const token = generarToken(usuarioCreado);

  res.status(201).json({ exito: true, token, usuario: usuarioCreado });
});

const perfil = asyncHandler(async (req, res) => {
  const usuario = await Usuario.buscarPorId(req.usuario.id);
  if (!usuario) {
    return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
  }
  res.json({ exito: true, usuario });
});

module.exports = { login, registro, perfil, validacionLogin, validacionRegistro };
