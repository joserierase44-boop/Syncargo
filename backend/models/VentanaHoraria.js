const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = sequelize.define('VentanaHoraria', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  local_id:    { type: DataTypes.INTEGER, allowNull: false },
  fecha:       { type: DataTypes.DATEONLY, allowNull: false },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin:    { type: DataTypes.TIME, allowNull: false },
  muelle:      { type: DataTypes.INTEGER, defaultValue: 1 },
  estado:      { type: DataTypes.ENUM('disponible','reservada','bloqueada'), defaultValue: 'disponible' },
  notas:       { type: DataTypes.TEXT }
}, {
  tableName: 'ventanas_horarias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
