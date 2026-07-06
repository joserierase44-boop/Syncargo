const { sequelize } = require('../config/database');
const { Entrega, Reserva, Usuario, VentanaHoraria, Incidencia, Local } = require('../models');
const { Op } = require('sequelize');

exports.admin = async (req, res) => {
  try {
    const [totalUsuarios, totalLocales, totalEntregas, incidenciasHoy] = await Promise.all([
      Usuario.count({ where: { activo: true } }),
      Local.count({ where: { activo: true } }),
      Entrega.count(),
      Incidencia.count({ where: { created_at: { [Op.gte]: new Date(new Date().setHours(0,0,0,0)) } } })
    ]);
    const porEstado = await Entrega.findAll({
      attributes: ['estado', [sequelize.fn('COUNT','*'), 'total']],
      group: ['estado']
    });
    res.json({ totalUsuarios, totalLocales, totalEntregas, incidenciasHoy, porEstado });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.local = async (req, res) => {
  try {
    const local = await Local.findOne({ where: { usuario_id: req.usuario.id } });
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });
    const hoy = new Date().toISOString().split('T')[0];
    const [ventanasHoy, pendientes, completadasMes] = await Promise.all([
      VentanaHoraria.count({ where: { local_id: local.id, fecha: hoy } }),
      Reserva.count({ where: { estado: 'pendiente' }, include: [{ model: VentanaHoraria, as: 'ventana', where: { local_id: local.id } }] }),
      Entrega.count({ where: { estado: 'completada', created_at: { [Op.gte]: new Date(new Date().setDate(1)) } }, include: [{ model: Reserva, as: 'reserva', include: [{ model: VentanaHoraria, as: 'ventana', where: { local_id: local.id } }] }] })
    ]);
    res.json({ ventanasHoy, pendientes, completadasMes, local });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.distribuidor = async (req, res) => {
  try {
    const [total, pendientes, confirmadas, completadas] = await Promise.all([
      Reserva.count({ where: { distribuidor_id: req.usuario.id } }),
      Reserva.count({ where: { distribuidor_id: req.usuario.id, estado: 'pendiente' } }),
      Reserva.count({ where: { distribuidor_id: req.usuario.id, estado: 'confirmada' } }),
      Reserva.count({ where: { distribuidor_id: req.usuario.id, estado: 'completada' } })
    ]);
    res.json({ total, pendientes, confirmadas, completadas });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.transportista = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const [entregasHoy, completadasHoy, incidencias] = await Promise.all([
      Entrega.count({ where: { transportista_id: req.usuario.id, estado: { [Op.notIn]: ['completada','cancelada'] } } }),
      Entrega.count({ where: { transportista_id: req.usuario.id, estado: 'completada', hora_completado: { [Op.gte]: new Date(new Date().setHours(0,0,0,0)) } } }),
      Incidencia.count({ include: [{ model: Entrega, as: 'entrega', where: { transportista_id: req.usuario.id } }] })
    ]);
    res.json({ entregasHoy, completadasHoy, incidencias });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
