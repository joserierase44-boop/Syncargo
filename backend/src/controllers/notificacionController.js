const Notificacion = require('../models/Notificacion');
const { asyncHandler } = require('../middlewares/errorHandler');

const misNotificaciones = asyncHandler(async (req, res) => {
  const soloNoLeidas = req.query.no_leidas === 'true';
  const notificaciones = await Notificacion.listarPorUsuario(req.usuario.id, { soloNoLeidas });
  res.json({ exito: true, notificaciones });
});

const marcarLeida = asyncHandler(async (req, res) => {
  await Notificacion.marcarLeida(req.params.id, req.usuario.id);
  res.json({ exito: true });
});

const marcarTodasLeidas = asyncHandler(async (req, res) => {
  await Notificacion.marcarTodasLeidas(req.usuario.id);
  res.json({ exito: true });
});

module.exports = { misNotificaciones, marcarLeida, marcarTodasLeidas };
