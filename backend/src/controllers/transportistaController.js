const Entrega = require('../models/Entrega');
const Incidencia = require('../models/Incidencia');
const { asyncHandler } = require('../middlewares/errorHandler');
const { notificar } = require('../utils/notificar');
const { ESTADOS_ENTREGA, TRANSICIONES_VALIDAS } = require('../config/constants');
const { pool } = require('../config/database');

const misEntregas = asyncHandler(async (req, res) => {
  const entregas = await Entrega.listarPorTransportista(req.usuario.id, { fecha: req.query.fecha });
  res.json({ exito: true, entregas });
});

const detalleEntrega = asyncHandler(async (req, res) => {
  const entrega = await Entrega.buscarPorId(req.params.id);
  if (!entrega || entrega.transportista_id !== req.usuario.id) {
    return res.status(404).json({ exito: false, mensaje: 'Entrega no encontrada' });
  }
  res.json({ exito: true, entrega });
});

// Función genérica para validar y aplicar una transición de estado
async function cambiarEstado(req, res, nuevoEstado, campoTimestamp) {
  const entrega = await Entrega.buscarPorId(req.params.id);
  if (!entrega || entrega.transportista_id !== req.usuario.id) {
    return res.status(404).json({ exito: false, mensaje: 'Entrega no encontrada' });
  }

  const permitidos = TRANSICIONES_VALIDAS[entrega.estado] || [];
  if (!permitidos.includes(nuevoEstado)) {
    return res.status(400).json({
      exito: false,
      mensaje: `No se puede pasar de "${entrega.estado}" a "${nuevoEstado}"`
    });
  }

  await Entrega.actualizarEstado(entrega.id, nuevoEstado, campoTimestamp);

  // Notifica al distribuidor y al local sobre el avance del estado
  const [localRows] = await pool.query(
    `SELECT l.usuario_id FROM locales l
     JOIN ventanas_horarias v ON v.local_id = l.id
     JOIN reservas r ON r.ventana_id = v.id
     WHERE r.id = ?`, [entrega.reserva_id]
  );

  const mensajesPorEstado = {
    [ESTADOS_ENTREGA.CONFIRMADA]: 'El transportista confirmó la entrega.',
    [ESTADOS_ENTREGA.EN_RUTA]: 'El transportista salió y está en camino.',
    [ESTADOS_ENTREGA.LLEGO_AL_LOCAL]: 'El transportista llegó al local.',
    [ESTADOS_ENTREGA.DESCARGANDO]: 'La descarga ha comenzado.',
    [ESTADOS_ENTREGA.COMPLETADA]: 'La descarga fue completada exitosamente.'
  };

  const mensaje = mensajesPorEstado[nuevoEstado] || `Estado actualizado a ${nuevoEstado}`;

  await notificar({
    usuario_id: entrega.distribuidor_id,
    titulo: 'Actualización de entrega',
    mensaje,
    tipo: nuevoEstado === ESTADOS_ENTREGA.COMPLETADA ? 'exito' : 'info',
    entidad_tipo: 'entrega',
    entidad_id: entrega.id
  });

  if (localRows[0]) {
    await notificar({
      usuario_id: localRows[0].usuario_id,
      titulo: 'Actualización de entrega',
      mensaje,
      tipo: nuevoEstado === ESTADOS_ENTREGA.COMPLETADA ? 'exito' : 'info',
      entidad_tipo: 'entrega',
      entidad_id: entrega.id
    });
  }

  const entregaActualizada = await Entrega.buscarPorId(entrega.id);
  res.json({ exito: true, mensaje: 'Estado actualizado', entrega: entregaActualizada });
}

const confirmarSalida = asyncHandler((req, res) =>
  cambiarEstado(req, res, ESTADOS_ENTREGA.EN_RUTA, 'hora_salida'));

const confirmarLlegada = asyncHandler((req, res) =>
  cambiarEstado(req, res, ESTADOS_ENTREGA.LLEGO_AL_LOCAL, 'hora_llegada'));

const iniciarDescarga = asyncHandler((req, res) =>
  cambiarEstado(req, res, ESTADOS_ENTREGA.DESCARGANDO, 'hora_inicio_descarga'));

const confirmarDescargaCompletada = asyncHandler((req, res) =>
  cambiarEstado(req, res, ESTADOS_ENTREGA.COMPLETADA, 'hora_completado'));

const registrarIncidencia = asyncHandler(async (req, res) => {
  const entrega = await Entrega.buscarPorId(req.params.id);
  if (!entrega || entrega.transportista_id !== req.usuario.id) {
    return res.status(404).json({ exito: false, mensaje: 'Entrega no encontrada' });
  }

  const { tipo, descripcion } = req.body;
  if (!tipo || !descripcion) {
    return res.status(400).json({ exito: false, mensaje: 'tipo y descripcion son obligatorios' });
  }

  const id = await Incidencia.crear({ entrega_id: entrega.id, reportado_por: req.usuario.id, tipo, descripcion });

  await notificar({
    usuario_id: entrega.distribuidor_id,
    titulo: 'Incidencia reportada',
    mensaje: `Se reportó una incidencia (${tipo}) en tu entrega: ${descripcion}`,
    tipo: 'advertencia',
    entidad_tipo: 'incidencia',
    entidad_id: id
  });

  res.status(201).json({ exito: true, mensaje: 'Incidencia registrada', incidencia_id: id });
});

module.exports = {
  misEntregas, detalleEntrega, confirmarSalida, confirmarLlegada,
  iniciarDescarga, confirmarDescargaCompletada, registrarIncidencia
};
