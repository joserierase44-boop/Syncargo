const { Reserva, VentanaHoraria, Entrega, Local, Usuario, Notificacion } = require('../models');
const { crearNotificacion } = require('../utils/notificacion.util');

exports.listarMias = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
      where: { distribuidor_id: req.usuario.id },
      include: [
        { model: VentanaHoraria, as: 'ventana', include: [{ model: Local, as: 'local' }] },
        { model: Entrega, as: 'entrega' }
      ],
      order: [['created_at','DESC']]
    });
    res.json(reservas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const { ventana_id, descripcion_carga, peso_kg, num_bultos } = req.body;
    const ventana = await VentanaHoraria.findByPk(ventana_id, { include: [{ model: Local, as: 'local' }] });
    if (!ventana) return res.status(404).json({ error: 'Ventana no encontrada' });
    if (ventana.estado !== 'disponible') return res.status(400).json({ error: 'La ventana ya no está disponible' });

    const reserva = await Reserva.create({ ventana_id, distribuidor_id: req.usuario.id, descripcion_carga, peso_kg, num_bultos });
    await ventana.update({ estado: 'reservada' });
    await Entrega.create({ reserva_id: reserva.id, estado: 'programada' });

    const io = req.app.get('io');
    await crearNotificacion(io, {
      usuario_id: ventana.local.usuario_id,
      titulo: 'Nueva solicitud de entrega',
      mensaje: `${req.usuario.nombre} ha solicitado la ventana del ${ventana.fecha} ${ventana.hora_inicio}`,
      tipo: 'info'
    });

    res.status(201).json(reserva);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.responder = async (req, res) => {
  try {
    const { estado, motivo_rechazo } = req.body; // confirmada | rechazada
    const reserva = await Reserva.findByPk(req.params.id, {
      include: [{ model: VentanaHoraria, as: 'ventana', include: [{ model: Local, as: 'local' }] }, { model: Entrega, as: 'entrega' }]
    });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.ventana.local.usuario_id !== req.usuario.id) return res.status(403).json({ error: 'Sin permisos' });

    await reserva.update({ estado, motivo_rechazo: estado === 'rechazada' ? motivo_rechazo : null });

    if (estado === 'rechazada') {
      await reserva.ventana.update({ estado: 'disponible' });
      if (reserva.entrega) await reserva.entrega.update({ estado: 'cancelada' });
    } else if (estado === 'confirmada' && reserva.entrega) {
      await reserva.entrega.update({ estado: 'confirmada' });
    }

    const io = req.app.get('io');
    await crearNotificacion(io, {
      usuario_id: reserva.distribuidor_id,
      titulo: estado === 'confirmada' ? 'Reserva confirmada ✅' : 'Reserva rechazada ❌',
      mensaje: estado === 'confirmada'
        ? `Tu reserva para el ${reserva.ventana.fecha} fue aprobada`
        : `Tu reserva fue rechazada: ${motivo_rechazo || 'sin motivo especificado'}`,
      tipo: estado === 'confirmada' ? 'success' : 'danger'
    });

    res.json({ mensaje: `Reserva ${estado}`, reserva });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.cancelar = async (req, res) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id, {
      include: [{ model: VentanaHoraria, as: 'ventana' }, { model: Entrega, as: 'entrega' }]
    });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.distribuidor_id !== req.usuario.id && req.usuario.rol !== 'admin')
      return res.status(403).json({ error: 'Sin permisos' });
    await reserva.update({ estado: 'cancelada' });
    await reserva.ventana.update({ estado: 'disponible' });
    if (reserva.entrega) await reserva.entrega.update({ estado: 'cancelada' });
    res.json({ mensaje: 'Reserva cancelada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
