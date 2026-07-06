const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

exports.listar = async (req, res) => {
  try {
    const { rol, activo } = req.query;
    const where = {};
    if (rol)    where.rol    = rol;
    if (activo !== undefined) where.activo = activo === 'true';
    const usuarios = await Usuario.findAll({ where, attributes: { exclude: ['password_hash'] }, order: [['created_at','DESC']] });
    res.json(usuarios);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.obtener = async (req, res) => {
  try {
    const u = await Usuario.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(u);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono } = req.body;
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });
    const password_hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, email, password_hash, rol, telefono });
    res.status(201).json({ ...usuario.toJSON(), password_hash: undefined });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.actualizar = async (req, res) => {
  try {
    const u = await Usuario.findByPk(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { nombre, telefono, activo } = req.body;
    await u.update({ nombre, telefono, activo });
    res.json({ mensaje: 'Usuario actualizado', usuario: { ...u.toJSON(), password_hash: undefined } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.eliminar = async (req, res) => {
  try {
    const u = await Usuario.findByPk(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    await u.update({ activo: false });
    res.json({ mensaje: 'Usuario desactivado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
