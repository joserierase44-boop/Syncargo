const jwt = require('jsonwebtoken');

// Verifica que la petición incluya un token JWT válido en el header Authorization
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ exito: false, mensaje: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, rol, nombre, email }
    next();
  } catch (error) {
    return res.status(401).json({ exito: false, mensaje: 'Token inválido o expirado' });
  }
}

// Middleware de autorización: solo permite el acceso a los roles indicados
// Uso: autorizarRoles('administrador', 'local_comercial')
function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para realizar esta acción' });
    }
    next();
  };
}

module.exports = { verificarToken, autorizarRoles };
