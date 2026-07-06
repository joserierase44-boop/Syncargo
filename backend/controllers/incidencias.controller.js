const { Incidencia, Entrega, Reserva, VentanaHoraria, Local } = require('../models');
const { crearNotificacion } = require('../utils/notificacion.util');

exports.crear = async (req, res) => {
  try {
    const { entrega_id, tipo, descripcion } = req.body;
    const entrega = await Entrega.findByPk(entrega_id, {
      include: [{ model: Reserva, as: 'reserva', include: [{ model: VentanaHoraria, as: 'ventana', include: [{ model: Local, as: 'local' }] }] }]
    });
    if (!entrega) return res.status(404).json({ error: 'Entrega no encontrada' });
    const incidencia = await Incidencia.create({ entrega_id, tipo, descripcion });
    const io = req.app.get('io');
    const local = entrega.reserva?.ventana?.local;
    if (local) {
      await crearNotificacion(io, {
        usuario_id: local.usuario_id,
        titulo: 'Incidencia reportada ⚠️',
        mensaje: `Se reportó una incidencia en tu local: ${descripcion.slice(0,80)}`,
        tipo: 'warning'
      });
    }
    res.status(201).json(incidencia);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.listar = async (req, res) => {
  try {
    const { entrega_id } = req.query;
    const where = {};
    if (entrega_id) where.entrega_id = entrega_id;
    const incidencias = await Incidencia.findAll({ where, order: [['created_at','DESC']] });
    res.json(incidencias);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
