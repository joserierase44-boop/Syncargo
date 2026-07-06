const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = sequelize.define('Notificacion', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo:       { type: DataTypes.STRING(50) },
  titulo:     { type: DataTypes.STRING(200), allowNull: false },
  mensaje:    { type: DataTypes.TEXT, allowNull: false },
  leida:      { type: DataTypes.BOOLEAN, defaultValue: false },
  enlace:     { type: DataTypes.STRING(300) }
}, {
  tableName: 'notificaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
