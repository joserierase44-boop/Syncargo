const { Notificacion } = require('../models');

const crearNotificacion = async (io, { usuario_id, titulo, mensaje, tipo = 'info' }) => {
  const notif = await Notificacion.create({ usuario_id, titulo, mensaje, tipo });
  if (io) io.to(`user_${usuario_id}`).emit('nueva_notificacion', notif);
  return notif;
};

module.exports = { crearNotificacion };
