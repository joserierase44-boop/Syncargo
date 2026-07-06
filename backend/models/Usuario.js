const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:         { type: DataTypes.STRING(100), allowNull: false },
  email:          { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash:  { type: DataTypes.STRING(255), allowNull: false },
  rol:            { type: DataTypes.ENUM('admin','local','distribuidor','transportista'), allowNull: false },
  telefono:       { type: DataTypes.STRING(20) },
  empresa:        { type: DataTypes.STRING(150) },
  activo:         { type: DataTypes.BOOLEAN, defaultValue: true },
  ultimo_acceso:  { type: DataTypes.DATE }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (u) => { if (u.password_hash) u.password_hash = await bcrypt.hash(u.password_hash, 10); },
    beforeUpdate: async (u) => { if (u.changed('password_hash')) u.password_hash = await bcrypt.hash(u.password_hash, 10); }
  }
});

Usuario.prototype.validarPassword = function(plain) {
  return bcrypt.compare(plain, this.password_hash);
};

module.exports = Usuario;
