const { Entrega, Reserva, VentanaHoraria, Local, Usuario, Incidencia } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.resumen = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.count({ where: { activo: true } });
    const totalLocales = await Local.count({ where: { activo: true } });
    const totalEntregas = await Entrega.count();
    const entregasHoy = await Entrega.count({
      include: [{ model: Reserva, as: 'reserva', include: [{
        model: VentanaHoraria, as: 'ventana', where: { fecha: new Date().toISOString().split('T')[0] }
      }]}]
    });
    const completadas = await Entrega.count({ where: { estado: 'completada' } });
    const canceladas = await Entrega.count({ where: { estado: 'cancelada' } });

    res.json({ totalUsuarios, totalLocales, totalEntregas, entregasHoy, completadas, canceladas,
      tasaExito: totalEntregas > 0 ? Math.round((completadas / totalEntregas) * 100) : 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.porEstado = async (req, res) => {
  try {
    const datos = await Entrega.findAll({
      attributes: ['estado', [fn('COUNT', col('id')), 'total']],
      group: ['estado'], raw: true
    });
    res.json(datos);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
