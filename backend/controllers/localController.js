const { Local, Usuario, VentanaHoraria } = require('../models');
const { Op } = require('sequelize');

exports.listar = async (req, res) => {
  try {
    const where = { activo: true };
    if (req.query.ciudad) where.ciudad = { [Op.like]: `%${req.query.ciudad}%` };
    const locales = await Local.findAll({ where, include: [{ model: Usuario, as: 'propietario', attributes: ['nombre','email','telefono'] }] });
    res.json(locales);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.miLocal = async (req, res) => {
  try {
    const local = await Local.findOne({ where: { usuario_id: req.usuario.id } });
    if (!local) return res.status(404).json({ error: 'No tienes un local registrado' });
    res.json(local);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.obtener = async (req, res) => {
  try {
    const local = await Local.findByPk(req.params.id, {
      include: [{ model: Usuario, as: 'propietario', attributes: ['nombre','email','telefono'] }]
    });
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });
    res.json(local);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const data = { ...req.body, usuario_id: req.usuario.id };
    const local = await Local.create(data);
    res.status(201).json(local);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.actualizar = async (req, res) => {
  try {
    const local = await Local.findByPk(req.params.id);
    if (!local) return res.status(404).json({ error: 'Local no encontrado' });
    if (local.usuario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    await local.update(req.body);
    res.json(local);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
