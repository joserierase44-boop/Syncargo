const { pool } = require('../config/database');

const Usuario = {
  // Busca un usuario por email (usado en login)
  async buscarPorEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol, telefono, empresa, placa_vehiculo, activo, created_at
       FROM usuarios WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async listarTodos({ rol } = {}) {
    let sql = `SELECT id, nombre, email, rol, telefono, empresa, placa_vehiculo, activo, created_at
               FROM usuarios`;
    const params = [];
    if (rol) {
      sql += ' WHERE rol = ?';
      params.push(rol);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async crear({ nombre, email, password_hash, rol, telefono, empresa, placa_vehiculo }) {
    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, empresa, placa_vehiculo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, email, password_hash, rol, telefono || null, empresa || null, placa_vehiculo || null]
    );
    return result.insertId;
  },

  async actualizar(id, campos) {
    const permitidos = ['nombre', 'telefono', 'empresa', 'placa_vehiculo', 'activo'];
    const sets = [];
    const valores = [];
    for (const campo of permitidos) {
      if (campos[campo] !== undefined) {
        sets.push(`${campo} = ?`);
        valores.push(campos[campo]);
      }
    }
    if (sets.length === 0) return false;
    valores.push(id);
    await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, valores);
    return true;
  },

  async eliminar(id) {
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return true;
  },

  async listarTransportistasPorEmpresa(empresa) {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, telefono, placa_vehiculo FROM usuarios
       WHERE rol = 'transportista' AND empresa = ? AND activo = TRUE`,
      [empresa]
    );
    return rows;
  }
};

module.exports = Usuario;
