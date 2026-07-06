const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// ── Usuario ──────────────────────────────────────────────
const Usuario = sequelize.define('Usuario', {
  nombre:        { type: DataTypes.STRING(120), allowNull: false },
  email:         { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  rol:           { type: DataTypes.ENUM('admin','local','distribuidor','transportista'), allowNull: false },
  telefono:      { type: DataTypes.STRING(20) },
  activo:        { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'usuarios', underscored: true });

// ── Local ────────────────────────────────────────────────
const Local = sequelize.define('Local', {
  nombre:            { type: DataTypes.STRING(150), allowNull: false },
  direccion:         { type: DataTypes.STRING(255), allowNull: false },
  ciudad:            { type: DataTypes.STRING(100), allowNull: false },
  latitud:           { type: DataTypes.DECIMAL(10,8) },
  longitud:          { type: DataTypes.DECIMAL(11,8) },
  horario_apertura:  { type: DataTypes.TIME, defaultValue: '08:00:00' },
  horario_cierre:    { type: DataTypes.TIME, defaultValue: '20:00:00' },
  capacidad_muelles: { type: DataTypes.INTEGER, defaultValue: 1 },
  activo:            { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'locales', underscored: true });

// ── VentanaHoraria ───────────────────────────────────────
const VentanaHoraria = sequelize.define('VentanaHoraria', {
  fecha:       { type: DataTypes.DATEONLY, allowNull: false },
  hora_inicio: { type: DataTypes.TIME,    allowNull: false },
  hora_fin:    { type: DataTypes.TIME,    allowNull: false },
  muelle:      { type: DataTypes.INTEGER, defaultValue: 1 },
  estado:      { type: DataTypes.ENUM('disponible','reservada','bloqueada'), defaultValue: 'disponible' }
}, { tableName: 'ventanas_horarias', underscored: true, updatedAt: false });

// ── Reserva ──────────────────────────────────────────────
const Reserva = sequelize.define('Reserva', {
  descripcion_carga: { type: DataTypes.TEXT },
  peso_kg:           { type: DataTypes.DECIMAL(8,2) },
  num_bultos:        { type: DataTypes.INTEGER },
  estado:            { type: DataTypes.ENUM('pendiente','confirmada','rechazada','cancelada'), defaultValue: 'pendiente' },
  motivo_rechazo:    { type: DataTypes.TEXT }
}, { tableName: 'reservas', underscored: true });

// ── Entrega ──────────────────────────────────────────────
const Entrega = sequelize.define('Entrega', {
  estado:               { type: DataTypes.ENUM('programada','confirmada','en_ruta','llego_local','descargando','completada','cancelada'), defaultValue: 'programada' },
  hora_llegada:         { type: DataTypes.DATE },
  hora_inicio_descarga: { type: DataTypes.DATE },
  hora_completado:      { type: DataTypes.DATE },
  observaciones:        { type: DataTypes.TEXT }
}, { tableName: 'entregas', underscored: true });

// ── Incidencia ───────────────────────────────────────────
const Incidencia = sequelize.define('Incidencia', {
  tipo:        { type: DataTypes.ENUM('retraso','dano_mercancia','accidente','rechazo_local','otro'), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'incidencias', underscored: true, updatedAt: false });

// ── Notificacion ─────────────────────────────────────────
const Notificacion = sequelize.define('Notificacion', {
  titulo:  { type: DataTypes.STRING(150), allowNull: false },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
  tipo:    { type: DataTypes.ENUM('info','success','warning','danger'), defaultValue: 'info' },
  leida:   { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'notificaciones', underscored: true, updatedAt: false });

// ── Asociaciones ─────────────────────────────────────────
Usuario.hasMany(Local,         { foreignKey: 'usuario_id',       as: 'locales' });
Local.belongsTo(Usuario,       { foreignKey: 'usuario_id',       as: 'propietario' });

Local.hasMany(VentanaHoraria,  { foreignKey: 'local_id',         as: 'ventanas' });
VentanaHoraria.belongsTo(Local,{ foreignKey: 'local_id',         as: 'local' });

VentanaHoraria.hasOne(Reserva, { foreignKey: 'ventana_id',       as: 'reserva' });
Reserva.belongsTo(VentanaHoraria,{ foreignKey: 'ventana_id',     as: 'ventana' });

Usuario.hasMany(Reserva,       { foreignKey: 'distribuidor_id',  as: 'reservas' });
Reserva.belongsTo(Usuario,     { foreignKey: 'distribuidor_id',  as: 'distribuidor' });

Reserva.hasOne(Entrega,        { foreignKey: 'reserva_id',       as: 'entrega' });
Entrega.belongsTo(Reserva,     { foreignKey: 'reserva_id',       as: 'reserva' });

Usuario.hasMany(Entrega,       { foreignKey: 'transportista_id', as: 'entregas' });
Entrega.belongsTo(Usuario,     { foreignKey: 'transportista_id', as: 'transportista' });

Entrega.hasMany(Incidencia,    { foreignKey: 'entrega_id',       as: 'incidencias' });
Incidencia.belongsTo(Entrega,  { foreignKey: 'entrega_id',       as: 'entrega' });

Usuario.hasMany(Notificacion,  { foreignKey: 'usuario_id',       as: 'notificaciones' });
Notificacion.belongsTo(Usuario,{ foreignKey: 'usuario_id',       as: 'usuario' });

module.exports = { sequelize, Usuario, Local, VentanaHoraria, Reserva, Entrega, Incidencia, Notificacion };
