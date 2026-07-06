const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = sequelize.define('Reserva', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ventana_id:       { type: DataTypes.INTEGER, allowNull: false },
  distribuidor_id:  { type: DataTypes.INTEGER, allowNull: false },
  descripcion_carga:{ type: DataTypes.TEXT, allowNull: false },
  peso_kg:          { type: DataTypes.DECIMAL(10,2) },
  bultos:           { type: DataTypes.INTEGER },
  estado:           { type: DataTypes.ENUM('pendiente','confirmada','rechazada','cancelada'), defaultValue: 'pendiente' },
  motivo_rechazo:   { type: DataTypes.TEXT },
  notas:            { type: DataTypes.TEXT }
}, {
  tableName: 'reservas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
