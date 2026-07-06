const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');

exports.listar = async (req, res) => {
  try {
    const { rol, activo } = req.query;
    const where = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === 'true';
    const usuarios = await Usuario.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });
    res.json(usuarios);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.obtener = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, empresa } = req.body;
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(400).json({ error: 'Email ya registrado' });
    const usuario = await Usuario.create({ nombre, email, password_hash: password, rol, telefono, empresa });
    res.status(201).json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.actualizar = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { nombre, telefono, empresa, activo } = req.body;
    await usuario.update({ nombre, telefono, empresa, activo });
    res.json({ mensaje: 'Usuario actualizado', usuario });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.toggleActivo = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    await usuario.update({ activo: !usuario.activo });
    res.json({ activo: usuario.activo });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.estadisticas = async (req, res) => {
  try {
    const total = await Usuario.count();
    const porRol = await Usuario.findAll({
      attributes: ['rol', [require('sequelize').fn('COUNT', '*'), 'total']],
      group: ['rol'], raw: true
    });
    res.json({ total, por_rol: porRol });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
