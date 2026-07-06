const Notificacion = require('../models/Notificacion');
const socket = require('./socket');

// Crea una notificación en la base de datos y la emite por WebSocket en el mismo paso,
// para que el usuario destino la vea sin necesidad de refrescar la página.
async function notificar({ usuario_id, titulo, mensaje, tipo = 'info', entidad_tipo = null, entidad_id = null }) {
  const id = await Notificacion.crear({ usuario_id, titulo, mensaje, tipo, entidad_tipo, entidad_id });
  socket.emitirAUsuario(usuario_id, 'nueva_notificacion', {
    id, titulo, mensaje, tipo, entidad_tipo, entidad_id, leida: false, created_at: new Date()
  });
  return id;
}

module.exports = { notificar };
