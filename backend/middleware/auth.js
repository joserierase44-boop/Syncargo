const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const verificarToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });
    if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Usuario no autorizado' });
    req.usuario = usuario;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

const requiereRol = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'Acceso denegado para este rol' });
  }
  next();
};

module.exports = { verificarToken, requiereRol };
