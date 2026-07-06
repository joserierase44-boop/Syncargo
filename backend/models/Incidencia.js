const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = sequelize.define('Incidencia', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  entrega_id:  { type: DataTypes.INTEGER, allowNull: false },
  tipo:        { type: DataTypes.ENUM('retraso','dano_mercancia','acceso_denegado','vehiculo_averiado','otro'), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  foto_url:    { type: DataTypes.STRING(500) }
}, {
  tableName: 'incidencias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
