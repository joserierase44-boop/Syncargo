const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = sequelize.define('Entrega', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reserva_id:       { type: DataTypes.INTEGER, allowNull: false },
  transportista_id: { type: DataTypes.INTEGER },
  estado:           {
    type: DataTypes.ENUM('programada','confirmada','en_ruta','llego_local','descargando','completada','cancelada'),
    defaultValue: 'programada'
  },
  hora_llegada:     { type: DataTypes.DATE },
  hora_inicio_descarga: { type: DataTypes.DATE },
  hora_completado:  { type: DataTypes.DATE },
  placa_vehiculo:   { type: DataTypes.STRING(20) },
  observaciones:    { type: DataTypes.TEXT }
}, {
  tableName: 'entregas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
