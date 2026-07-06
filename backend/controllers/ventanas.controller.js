const { VentanaHoraria, Local, Reserva, Usuario } = require('../models');
const { Op } = require('sequelize');

exports.listarDisponibles = async (req, res) => {
  try {
    const { fecha, local_id, ciudad } = req.query;
    const where = { estado: 'disponible' };
    if (fecha)    where.fecha    = fecha;
    if (local_id) where.local_id = local_id;
    if (fecha) {
      where.fecha = { [Op.gte]: fecha };
    }
    const includeLocal = { model: Local, as: 'local', where: { activo: true } };
    if (ciudad) includeLocal.where.ciudad = ciudad;
    const ventanas = await VentanaHoraria.findAll({ where, include: [includeLocal], order: [['fecha','ASC'],['hora_inicio','ASC']] });
    res.json(ventanas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.listarPorLocal = async (req, res) => {
  try {
    const { fecha } = req.query;
    const local = await Local.findOne({ where: { usuario_id: req.usuario.id } });
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });
    const where = { local_id: local.id };
    if (fecha) where.fecha = fecha;
    const ventanas = await VentanaHoraria.findAll({
      where, order: [['fecha','ASC'],['hora_inicio','ASC']],
      include: [{ model: Reserva, as: 'reserva', include: [{ model: Usuario, as: 'distribuidor', attributes: ['id','nombre','telefono','email'] }] }]
    });
    res.json(ventanas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const local = await Local.findOne({ where: { usuario_id: req.usuario.id } });
    if (!local && req.usuario.rol !== 'admin') return res.status(404).json({ error: 'Local no encontrado' });
    const local_id = local ? local.id : req.body.local_id;
    const ventanas = Array.isArray(req.body.ventanas) ? req.body.ventanas : [req.body];
    const creadas = await VentanaHoraria.bulkCreate(ventanas.map(v => ({ ...v, local_id, estado: 'disponible' })));
    res.status(201).json(creadas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.bloquear = async (req, res) => {
  try {
    const v = await VentanaHoraria.findByPk(req.params.id);
    if (!v) return res.status(404).json({ error: 'Ventana no encontrada' });
    await v.update({ estado: 'bloqueada' });
    res.json({ mensaje: 'Ventana bloqueada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.eliminar = async (req, res) => {
  try {
    const v = await VentanaHoraria.findByPk(req.params.id);
    if (!v) return res.status(404).json({ error: 'Ventana no encontrada' });
    if (v.estado === 'reservada') return res.status(400).json({ error: 'No se puede eliminar una ventana reservada' });
    await v.destroy();
    res.json({ mensaje: 'Ventana eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
