const VentanaHoraria = require('../models/VentanaHoraria');
const Reserva = require('../models/Reserva');
const { asyncHandler } = require('../middlewares/errorHandler');
const { notificar } = require('../utils/notificar');
const { ESTADOS_RESERVA, ESTADOS_VENTANA } = require('../config/constants');
const { pool } = require('../config/database');

// Búsqueda de ventanas horarias disponibles, filtrable por ciudad, local y fecha
const buscarHorarios = asyncHandler(async (req, res) => {
  const { ciudad, local_id, fecha } = req.query;
  const ventanas = await VentanaHoraria.buscarDisponibles({ ciudad, local_id, fecha });
  res.json({ exito: true, ventanas });
});

// Crear una reserva sobre una ventana horaria disponible
const crearReserva = asyncHandler(async (req, res) => {
  const { ventana_id, descripcion_carga, peso_kg, numero_bultos } = req.body;
  if (!ventana_id) {
    return res.status(400).json({ exito: false, mensaje: 'ventana_id es obligatorio' });
  }

  const ventana = await VentanaHoraria.buscarPorId(ventana_id);
  if (!ventana) {
    return res.status(404).json({ exito: false, mensaje: 'Ventana horaria no encontrada' });
  }
  if (ventana.estado !== ESTADOS_VENTANA.DISPONIBLE) {
    return res.status(409).json({ exito: false, mensaje: 'Esta ventana horaria ya no está disponible' });
  }

  const reservaId = await Reserva.crear({
    ventana_id, distribuidor_id: req.usuario.id, descripcion_carga, peso_kg, numero_bultos
  });

  // Se marca la ventana como "reservada" de forma optimista para bloquear dobles reservas
  // mientras el local revisa la solicitud (la confirmación final ocurre al aprobar).
  await VentanaHoraria.actualizarEstado(ventana_id, ESTADOS_VENTANA.RESERVADA);

  const [localRows] = await pool.query(
    'SELECT usuario_id, nombre FROM locales WHERE id = ?', [ventana.local_id]
  );
  if (localRows[0]) {
    await notificar({
      usuario_id: localRows[0].usuario_id,
      titulo: 'Nueva solicitud de reserva',
      mensaje: `Tienes una nueva solicitud para el ${ventana.fecha} a las ${ventana.hora_inicio}.`,
      tipo: 'info',
      entidad_tipo: 'reserva',
      entidad_id: reservaId
    });
  }

  const reserva = await Reserva.buscarPorId(reservaId);
  res.status(201).json({ exito: true, reserva });
});

// Listar las reservas/entregas del distribuidor autenticado
const misEntregas = asyncHandler(async (req, res) => {
  const reservas = await Reserva.listarPorDistribuidor(req.usuario.id);
  res.json({ exito: true, reservas });
});

// Reprogramar: cancela la reserva actual (libera la ventana) y crea una nueva sobre otra ventana
const reprogramar = asyncHandler(async (req, res) => {
  const { nueva_ventana_id } = req.body;
  const reservaActual = await Reserva.buscarPorId(req.params.id);

  if (!reservaActual || reservaActual.distribuidor_id !== req.usuario.id) {
    return res.status(404).json({ exito: false, mensaje: 'Reserva no encontrada' });
  }
  if (!['pendiente', 'aprobada'].includes(reservaActual.estado)) {
    return res.status(400).json({ exito: false, mensaje: 'Solo se pueden reprogramar reservas pendientes o aprobadas' });
  }
  if (!nueva_ventana_id) {
    return res.status(400).json({ exito: false, mensaje: 'nueva_ventana_id es obligatorio' });
  }

  const nuevaVentana = await VentanaHoraria.buscarPorId(nueva_ventana_id);
  if (!nuevaVentana || nuevaVentana.estado !== ESTADOS_VENTANA.DISPONIBLE) {
    return res.status(409).json({ exito: false, mensaje: 'La nueva ventana horaria no está disponible' });
  }

  // Libera la ventana anterior y cancela la reserva original
  await Reserva.actualizarEstado(reservaActual.id, ESTADOS_RESERVA.CANCELADA);
  await VentanaHoraria.actualizarEstado(reservaActual.ventana_id, ESTADOS_VENTANA.DISPONIBLE);

  // Crea la nueva reserva
  const nuevaReservaId = await Reserva.crear({
    ventana_id: nueva_ventana_id,
    distribuidor_id: req.usuario.id,
    descripcion_carga: reservaActual.descripcion_carga,
    peso_kg: reservaActual.peso_kg,
    numero_bultos: reservaActual.numero_bultos
  });
  await VentanaHoraria.actualizarEstado(nueva_ventana_id, ESTADOS_VENTANA.RESERVADA);

  const [localRows] = await pool.query(
    'SELECT usuario_id FROM locales WHERE id = ?', [nuevaVentana.local_id]
  );
  if (localRows[0]) {
    await notificar({
      usuario_id: localRows[0].usuario_id,
      titulo: 'Reprogramación de entrega',
      mensaje: `Un distribuidor reprogramó su entrega para el ${nuevaVentana.fecha} a las ${nuevaVentana.hora_inicio}.`,
      tipo: 'info',
      entidad_tipo: 'reserva',
      entidad_id: nuevaReservaId
    });
  }

  const nuevaReserva = await Reserva.buscarPorId(nuevaReservaId);
  res.json({ exito: true, mensaje: 'Entrega reprogramada', reserva: nuevaReserva });
});

// Cancelar una reserva propia
const cancelarReserva = asyncHandler(async (req, res) => {
  const reserva = await Reserva.buscarPorId(req.params.id);
  if (!reserva || reserva.distribuidor_id !== req.usuario.id) {
    return res.status(404).json({ exito: false, mensaje: 'Reserva no encontrada' });
  }
  if (!['pendiente', 'aprobada'].includes(reserva.estado)) {
    return res.status(400).json({ exito: false, mensaje: 'Esta reserva no se puede cancelar' });
  }

  await Reserva.actualizarEstado(reserva.id, ESTADOS_RESERVA.CANCELADA);
  await VentanaHoraria.actualizarEstado(reserva.ventana_id, ESTADOS_VENTANA.DISPONIBLE);

  res.json({ exito: true, mensaje: 'Reserva cancelada' });
});

module.exports = { buscarHorarios, crearReserva, misEntregas, reprogramar, cancelarReserva };
