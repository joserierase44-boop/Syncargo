const { VentanaHoraria, Local, Reserva, Usuario } = require('../models');
const { Op } = require('sequelize');

exports.disponibles = async (req, res) => {
  try {
    const { fecha, ciudad, local_id } = req.query;
    const where = { estado: 'disponible' };
    if (fecha) where.fecha = fecha;
    else where.fecha = { [Op.gte]: new Date().toISOString().split('T')[0] };

    const includeLocal = { model: Local, as: 'local', where: { activo: true }, attributes: ['id','nombre','direccion','ciudad'] };
    if (ciudad) includeLocal.where.ciudad = { [Op.like]: `%${ciudad}%` };
    if (local_id) where.local_id = local_id;

    const ventanas = await VentanaHoraria.findAll({ where, include: [includeLocal], order: [['fecha','ASC'],['hora_inicio','ASC']] });
    res.json(ventanas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.porLocal = async (req, res) => {
  try {
    const local = await Local.findOne({ where: { usuario_id: req.usuario.id } });
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });
    const { fecha } = req.query;
    const where = { local_id: local.id };
    if (fecha) where.fecha = fecha;
    const ventanas = await VentanaHoraria.findAll({
      where, include: [{ model: Reserva, as: 'reserva', include: [{ model: Usuario, as: 'distribuidor', attributes: ['nombre','email','empresa'] }] }],
      order: [['fecha','ASC'],['hora_inicio','ASC']]
    });
    res.json(ventanas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const local = await Local.findOne({ where: { usuario_id: req.usuario.id } });
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });
    const ventana = await VentanaHoraria.create({ ...req.body, local_id: local.id });
    res.status(201).json(ventana);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.crearMultiple = async (req, res) => {
  try {
    const local = await Local.findOne({ where: { usuario_id: req.usuario.id } });
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });
    const { fechas, hora_inicio, hora_fin, muelle } = req.body;
    const ventanas = await VentanaHoraria.bulkCreate(
      fechas.map(f => ({ local_id: local.id, fecha: f, hora_inicio, hora_fin, muelle: muelle || 1 }))
    );
    res.status(201).json({ creadas: ventanas.length, ventanas });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.eliminar = async (req, res) => {
  try {
    const ventana = await VentanaHoraria.findByPk(req.params.id);
    if (!ventana) return res.status(404).json({ error: 'Ventana no encontrada' });
    if (ventana.estado === 'reservada') return res.status(400).json({ error: 'No se puede eliminar una ventana reservada' });
    await ventana.destroy();
    res.json({ mensaje: 'Ventana eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
