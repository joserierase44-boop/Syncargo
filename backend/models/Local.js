const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = sequelize.define('Local', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id:       { type: DataTypes.INTEGER, allowNull: false },
  nombre:           { type: DataTypes.STRING(150), allowNull: false },
  direccion:        { type: DataTypes.STRING(255), allowNull: false },
  ciudad:           { type: DataTypes.STRING(100), defaultValue: 'Cuenca' },
  referencia:       { type: DataTypes.STRING(255) },
  latitud:          { type: DataTypes.DECIMAL(10, 8) },
  longitud:         { type: DataTypes.DECIMAL(11, 8) },
  capacidad_muelles:{ type: DataTypes.INTEGER, defaultValue: 1 },
  hora_apertura:    { type: DataTypes.TIME, defaultValue: '08:00:00' },
  hora_cierre:      { type: DataTypes.TIME, defaultValue: '18:00:00' },
  activo:           { type: DataTypes.BOOLEAN, defaultValue: true },
  foto_url:         { type: DataTypes.STRING(500) }
}, {
  tableName: 'locales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
