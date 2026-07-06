const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const usuario = await Usuario.findOne({ where: { email, activo: true } });
    if (!usuario || !usuario.verificarPassword(password)) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = generarToken(usuario);
    res.json({
      token,
      usuario: {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, empresa: usuario.empresa, telefono: usuario.telefono
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.registro = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, empresa } = req.body;
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

    const usuario = await Usuario.create({ nombre, email, password_hash: password, rol, telefono, empresa });
    const token = generarToken(usuario);
    res.status(201).json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.perfil = async (req, res) => {
  res.json({ usuario: req.usuario });
};

exports.cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario.verificarPassword(password_actual)) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }
    const bcrypt = require('bcryptjs');
    usuario.password_hash = await bcrypt.hash(password_nuevo, 10);
    await usuario.save();
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
