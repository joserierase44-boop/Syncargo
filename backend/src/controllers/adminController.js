const Usuario = require('../models/Usuario');
const Local = require('../models/Local');
const Entrega = require('../models/Entrega');
const Incidencia = require('../models/Incidencia');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../config/database');

// ----- Gestión de usuarios -----

const listarUsuarios = asyncHandler(async (req, res) => {
  const usuarios = await Usuario.listarTodos({ rol: req.query.rol });
  res.json({ exito: true, usuarios });
});

const crearUsuario = asyncHandler(async (req, res) => {
  const { nombre, email, password, rol, telefono, empresa, placa_vehiculo } = req.body;
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ exito: false, mensaje: 'nombre, email, password y rol son obligatorios' });
  }

  const existente = await Usuario.buscarPorEmail(email);
  if (existente) {
    return res.status(409).json({ exito: false, mensaje: 'Ese email ya está registrado' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = await Usuario.crear({ nombre, email, password_hash, rol, telefono, empresa, placa_vehiculo });
  const usuario = await Usuario.buscarPorId(id);
  res.status(201).json({ exito: true, usuario });
});

const actualizarUsuario = asyncHandler(async (req, res) => {
  await Usuario.actualizar(req.params.id, req.body);
  const usuario = await Usuario.buscarPorId(req.params.id);
  if (!usuario) return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
  res.json({ exito: true, usuario });
});

const desactivarUsuario = asyncHandler(async (req, res) => {
  await Usuario.actualizar(req.params.id, { activo: false });
  res.json({ exito: true, mensaje: 'Usuario desactivado' });
});

const activarUsuario = asyncHandler(async (req, res) => {
  await Usuario.actualizar(req.params.id, { activo: true });
  res.json({ exito: true, mensaje: 'Usuario activado' });
});

// ----- Gestión de locales -----

const listarLocales = asyncHandler(async (req, res) => {
  const locales = await Local.listarTodos();
  res.json({ exito: true, locales });
});

const actualizarLocal = asyncHandler(async (req, res) => {
  await Local.actualizar(req.params.id, req.body);
  const local = await Local.buscarPorId(req.params.id);
  if (!local) return res.status(404).json({ exito: false, mensaje: 'Local no encontrado' });
  res.json({ exito: true, local });
});

// ----- Supervisión de operaciones -----

const todasLasEntregas = asyncHandler(async (req, res) => {
  const entregas = await Entrega.listarTodas({ estado: req.query.estado, fecha: req.query.fecha });
  res.json({ exito: true, entregas });
});

const todasLasIncidencias = asyncHandler(async (req, res) => {
  const incidencias = await Incidencia.listarTodas({ tipo: req.query.tipo });
  res.json({ exito: true, incidencias });
});

// ----- Reportes / métricas agregadas -----

const reportesResumen = asyncHandler(async (req, res) => {
  const [[totalUsuarios]] = await pool.query('SELECT COUNT(*) AS total FROM usuarios WHERE activo = TRUE');
  const [[totalLocales]] = await pool.query('SELECT COUNT(*) AS total FROM locales WHERE activo = TRUE');

  const [entregasPorEstado] = await pool.query(
    `SELECT estado, COUNT(*) AS total FROM entregas GROUP BY estado`
  );

  const [entregasHoy] = await pool.query(
    `SELECT COUNT(*) AS total FROM entregas e
     JOIN reservas r ON r.id = e.reserva_id
     JOIN ventanas_horarias v ON v.id = r.ventana_id
     WHERE v.fecha = CURDATE()`
  );

  const [incidenciasPorTipo] = await pool.query(
    `SELECT tipo, COUNT(*) AS total FROM incidencias GROUP BY tipo`
  );

  const [tasaCumplimiento] = await pool.query(
    `SELECT
       SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) AS completadas,
       SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
       COUNT(*) AS total
     FROM entregas`
  );

  res.json({
    exito: true,
    resumen: {
      total_usuarios_activos: totalUsuarios.total,
      total_locales_activos: totalLocales.total,
      entregas_hoy: entregasHoy[0].total,
      entregas_por_estado: entregasPorEstado,
      incidencias_por_tipo: incidenciasPorTipo,
      tasa_cumplimiento: tasaCumplimiento[0]
    }
  });
});

module.exports = {
  listarUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario, activarUsuario,
  listarLocales, actualizarLocal,
  todasLasEntregas, todasLasIncidencias, reportesResumen
};
