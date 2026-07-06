const Local = require('../models/Local');
const VentanaHoraria = require('../models/VentanaHoraria');
const Reserva = require('../models/Reserva');
const Entrega = require('../models/Entrega');
const Usuario = require('../models/Usuario');
const { asyncHandler } = require('../middlewares/errorHandler');
const { notificar } = require('../utils/notificar');
const { ESTADOS_RESERVA, ESTADOS_VENTANA } = require('../config/constants');
const socket = require('../utils/socket');

// Obtiene el local del usuario autenticado (cada cuenta local_comercial tiene un solo local)
async function obtenerLocalDelUsuario(usuarioId, res) {
  const local = await Local.buscarPorUsuarioId(usuarioId);
  if (!local) {
    res.status(404).json({ exito: false, mensaje: 'No se encontró un local asociado a esta cuenta' });
    return null;
  }
  return local;
}

const miLocal = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;
  res.json({ exito: true, local });
});

const actualizarMiLocal = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;
  await Local.actualizar(local.id, req.body);
  const actualizado = await Local.buscarPorId(local.id);
  res.json({ exito: true, local: actualizado });
});

// Registrar una o varias ventanas horarias disponibles
const crearVentana = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;

  const { fecha, hora_inicio, hora_fin, muelle } = req.body;
  if (!fecha || !hora_inicio || !hora_fin) {
    return res.status(400).json({ exito: false, mensaje: 'fecha, hora_inicio y hora_fin son obligatorios' });
  }

  const id = await VentanaHoraria.crear({ local_id: local.id, fecha, hora_inicio, hora_fin, muelle });
  const ventana = await VentanaHoraria.buscarPorId(id);
  res.status(201).json({ exito: true, ventana });
});

// Generación automática de ventanas para un día completo según horario y duración del local
const generarVentanasDelDia = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;

  const { fecha } = req.body;
  if (!fecha) {
    return res.status(400).json({ exito: false, mensaje: 'La fecha es obligatoria' });
  }

  const duracion = local.duracion_ventana_minutos;
  const [hAperturaH, hAperturaM] = local.horario_apertura.split(':').map(Number);
  const [hCierreH, hCierreM] = local.horario_cierre.split(':').map(Number);

  let inicioMin = hAperturaH * 60 + hAperturaM;
  const finMin = hCierreH * 60 + hCierreM;

  const ventanasCreadas = [];
  while (inicioMin + duracion <= finMin) {
    const horaInicio = `${String(Math.floor(inicioMin / 60)).padStart(2, '0')}:${String(inicioMin % 60).padStart(2, '0')}:00`;
    const finVentanaMin = inicioMin + duracion;
    const horaFin = `${String(Math.floor(finVentanaMin / 60)).padStart(2, '0')}:${String(finVentanaMin % 60).padStart(2, '0')}:00`;

    for (let muelle = 1; muelle <= local.capacidad_muelles; muelle++) {
      try {
        const id = await VentanaHoraria.crear({ local_id: local.id, fecha, hora_inicio: horaInicio, hora_fin: horaFin, muelle });
        ventanasCreadas.push(id);
      } catch (error) {
        // Ignora duplicados (la ventana ya existía para ese muelle/horario)
        if (error.code !== 'ER_DUP_ENTRY') throw error;
      }
    }
    inicioMin = finVentanaMin;
  }

  res.status(201).json({ exito: true, mensaje: `${ventanasCreadas.length} ventanas creadas`, total: ventanasCreadas.length });
});

// Agenda diaria: todas las ventanas del local en una fecha, con su reserva si la tienen
const agendaDiaria = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;

  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
  const ventanas = await VentanaHoraria.listarPorLocalYFecha(local.id, fecha);
  res.json({ exito: true, fecha, ventanas });
});

// Historial de entregas recibidas por el local
const historial = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;

  const entregas = await Entrega.listarPorLocal(local.id, { estado: req.query.estado });
  res.json({ exito: true, entregas });
});

// Solicitudes pendientes de aprobación
const solicitudesPendientes = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;

  const reservas = await Reserva.listarPorLocal(local.id, { estado: ESTADOS_RESERVA.PENDIENTE });
  res.json({ exito: true, reservas });
});

// Aprobar una solicitud de reserva: crea automáticamente la entrega en estado "programada"
const aprobarReserva = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;

  const reserva = await Reserva.buscarPorId(req.params.id);
  if (!reserva || reserva.local_usuario_id !== req.usuario.id) {
    return res.status(404).json({ exito: false, mensaje: 'Reserva no encontrada' });
  }
  if (reserva.estado !== ESTADOS_RESERVA.PENDIENTE) {
    return res.status(400).json({ exito: false, mensaje: 'Esta reserva ya fue procesada' });
  }

  await Reserva.actualizarEstado(reserva.id, ESTADOS_RESERVA.APROBADA);
  await VentanaHoraria.actualizarEstado(reserva.ventana_id, ESTADOS_VENTANA.RESERVADA);
  const entregaId = await Entrega.crear({ reserva_id: reserva.id });

  await notificar({
    usuario_id: reserva.distribuidor_id,
    titulo: 'Reserva aprobada',
    mensaje: `Tu reserva en ${reserva.local_nombre} para el ${reserva.fecha} a las ${reserva.hora_inicio} fue aprobada.`,
    tipo: 'exito',
    entidad_tipo: 'reserva',
    entidad_id: reserva.id
  });

  res.json({ exito: true, mensaje: 'Reserva aprobada', entrega_id: entregaId });
});

const rechazarReserva = asyncHandler(async (req, res) => {
  const local = await obtenerLocalDelUsuario(req.usuario.id, res);
  if (!local) return;

  const reserva = await Reserva.buscarPorId(req.params.id);
  if (!reserva || reserva.local_usuario_id !== req.usuario.id) {
    return res.status(404).json({ exito: false, mensaje: 'Reserva no encontrada' });
  }
  if (reserva.estado !== ESTADOS_RESERVA.PENDIENTE) {
    return res.status(400).json({ exito: false, mensaje: 'Esta reserva ya fue procesada' });
  }

  const { motivo } = req.body;
  await Reserva.actualizarEstado(reserva.id, ESTADOS_RESERVA.RECHAZADA, motivo || null);

  await notificar({
    usuario_id: reserva.distribuidor_id,
    titulo: 'Reserva rechazada',
    mensaje: `Tu reserva en ${reserva.local_nombre} fue rechazada${motivo ? ': ' + motivo : ''}.`,
    tipo: 'advertencia',
    entidad_tipo: 'reserva',
    entidad_id: reserva.id
  });

  res.json({ exito: true, mensaje: 'Reserva rechazada' });
});

module.exports = {
  miLocal, actualizarMiLocal, crearVentana, generarVentanasDelDia,
  agendaDiaria, historial, solicitudesPendientes, aprobarReserva, rechazarReserva
};
