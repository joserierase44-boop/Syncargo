const { Reserva, VentanaHoraria, Local, Usuario, Entrega, Notificacion } = require('../models');
const { Op } = require('sequelize');

const crearNotificacion = async (usuario_id, titulo, mensaje, tipo = 'info') => {
  await Notificacion.create({ usuario_id, titulo, mensaje, tipo });
};

exports.crear = async (req, res) => {
  try {
    const { ventana_id, descripcion_carga, peso_kg, num_bultos, vehiculo_placa, notas } = req.body;
    const ventana = await VentanaHoraria.findByPk(ventana_id, { include: [{ model: Local, as: 'local' }] });
    if (!ventana) return res.status(404).json({ error: 'Ventana no encontrada' });
    if (ventana.estado !== 'disponible') return res.status(400).json({ error: 'Ventana no disponible' });

    const reserva = await Reserva.create({
      ventana_id, distribuidor_id: req.usuario.id,
      descripcion_carga, peso_kg, num_bultos, vehiculo_placa, notas
    });
    await ventana.update({ estado: 'reservada' });

    // Notificar al local
    await crearNotificacion(
      ventana.local.usuario_id,
      'Nueva solicitud de reserva',
      `El distribuidor ${req.usuario.nombre} solicita una ventana el ${ventana.fecha} de ${ventana.hora_inicio} a ${ventana.hora_fin}`,
      'info'
    );

    res.status(201).json(reserva);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.misReservas = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
      where: { distribuidor_id: req.usuario.id },
      include: [{
        model: VentanaHoraria, as: 'ventana',
        include: [{ model: Local, as: 'local', attributes: ['nombre','direccion','ciudad'] }]
      }, { model: Entrega, as: 'entrega' }],
      order: [['created_at','DESC']]
    });
    res.json(reservas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.pendientesLocal = async (req, res) => {
  try {
    const local = await Local.findOne({ where: { usuario_id: req.usuario.id } });
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });

    const reservas = await Reserva.findAll({
      where: { estado: 'pendiente' },
      include: [{
        model: VentanaHoraria, as: 'ventana',
        where: { local_id: local.id }
      }, { model: Usuario, as: 'distribuidor', attributes: ['nombre','email','empresa','telefono'] }],
      order: [['created_at','DESC']]
    });
    res.json(reservas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.responder = async (req, res) => {
  try {
    const { accion, motivo_rechazo } = req.body;
    const reserva = await Reserva.findByPk(req.params.id, {
      include: [{ model: VentanaHoraria, as: 'ventana' }, { model: Usuario, as: 'distribuidor' }]
    });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    if (accion === 'confirmar') {
      await reserva.update({ estado: 'confirmada' });
      await Entrega.create({ reserva_id: reserva.id, estado: 'confirmada' });
      await crearNotificacion(reserva.distribuidor_id, 'Reserva confirmada',
        `Tu reserva para el ${reserva.ventana.fecha} fue CONFIRMADA`, 'exito');
    } else if (accion === 'rechazar') {
      await reserva.update({ estado: 'rechazada', motivo_rechazo });
      await reserva.ventana.update({ estado: 'disponible' });
      await crearNotificacion(reserva.distribuidor_id, 'Reserva rechazada',
        `Tu reserva fue rechazada. Motivo: ${motivo_rechazo}`, 'error');
    }
    res.json({ mensaje: `Reserva ${accion}da`, reserva });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.cancelar = async (req, res) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id, { include: [{ model: VentanaHoraria, as: 'ventana' }] });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.distribuidor_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    await reserva.update({ estado: 'cancelada' });
    await reserva.ventana.update({ estado: 'disponible' });
    res.json({ mensaje: 'Reserva cancelada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
