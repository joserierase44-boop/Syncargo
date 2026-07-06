const Entrega = require('../models/Entrega');
const Usuario = require('../models/Usuario');
const { asyncHandler } = require('../middlewares/errorHandler');
const { notificar } = require('../utils/notificar');
const { ROLES, ESTADOS_ENTREGA, TRANSICIONES_VALIDAS } = require('../config/constants');

// El distribuidor asigna un transportista de su empresa a una entrega ya programada
const asignarTransportista = asyncHandler(async (req, res) => {
  const entrega = await Entrega.buscarPorId(req.params.id);
  if (!entrega) {
    return res.status(404).json({ exito: false, mensaje: 'Entrega no encontrada' });
  }
  if (entrega.distribuidor_id !== req.usuario.id) {
    return res.status(403).json({ exito: false, mensaje: 'No tienes permiso sobre esta entrega' });
  }

  const { transportista_id } = req.body;
  const transportista = await Usuario.buscarPorId(transportista_id);
  if (!transportista || transportista.rol !== ROLES.TRANSPORTISTA) {
    return res.status(400).json({ exito: false, mensaje: 'transportista_id no corresponde a un transportista válido' });
  }

  await Entrega.asignarTransportista(entrega.id, transportista_id);

  await notificar({
    usuario_id: transportista_id,
    titulo: 'Entrega asignada',
    mensaje: `Se te asignó una entrega en ${entrega.local_nombre} para el ${entrega.fecha} a las ${entrega.hora_inicio}.`,
    tipo: 'info',
    entidad_tipo: 'entrega',
    entidad_id: entrega.id
  });

  const actualizada = await Entrega.buscarPorId(entrega.id);
  res.json({ exito: true, mensaje: 'Transportista asignado', entrega: actualizada });
});

// El distribuidor confirma la entrega (paso "programada" -> "confirmada") antes de que el
// transportista salga; representa la confirmación logística previa al despacho.
const confirmarEntrega = asyncHandler(async (req, res) => {
  const entrega = await Entrega.buscarPorId(req.params.id);
  if (!entrega || entrega.distribuidor_id !== req.usuario.id) {
    return res.status(404).json({ exito: false, mensaje: 'Entrega no encontrada' });
  }

  const permitidos = TRANSICIONES_VALIDAS[entrega.estado] || [];
  if (!permitidos.includes(ESTADOS_ENTREGA.CONFIRMADA)) {
    return res.status(400).json({ exito: false, mensaje: `No se puede confirmar desde el estado "${entrega.estado}"` });
  }

  await Entrega.actualizarEstado(entrega.id, ESTADOS_ENTREGA.CONFIRMADA);

  if (entrega.transportista_id) {
    await notificar({
      usuario_id: entrega.transportista_id,
      titulo: 'Entrega confirmada',
      mensaje: `La entrega en ${entrega.local_nombre} fue confirmada y está lista para despacho.`,
      tipo: 'info',
      entidad_tipo: 'entrega',
      entidad_id: entrega.id
    });
  }

  const actualizada = await Entrega.buscarPorId(entrega.id);
  res.json({ exito: true, entrega: actualizada });
});

module.exports = { asignarTransportista, confirmarEntrega };
