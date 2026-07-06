const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { Usuario } = require('../models');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    const usuario = await Usuario.findOne({ where: { email, activo: true } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, telefono: usuario.telefono }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.perfil = async (req, res) => {
  res.json(req.usuario);
};

exports.cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    const usuario = await Usuario.findByPk(req.usuario.id);
    const valido = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!valido) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    usuario.password_hash = await bcrypt.hash(password_nuevo, 10);
    await usuario.save();
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
