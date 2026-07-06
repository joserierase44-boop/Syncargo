const { pool } = require('../config/database');

const Local = {
  async listarTodos() {
    const [rows] = await pool.query(
      `SELECT l.*, u.nombre AS nombre_responsable, u.email AS email_responsable
       FROM locales l
       JOIN usuarios u ON u.id = l.usuario_id
       ORDER BY l.nombre ASC`
    );
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM locales WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async buscarPorUsuarioId(usuarioId) {
    const [rows] = await pool.query('SELECT * FROM locales WHERE usuario_id = ? LIMIT 1', [usuarioId]);
    return rows[0] || null;
  },

  async crear({ usuario_id, nombre, direccion, ciudad, latitud, longitud, horario_apertura, horario_cierre, capacidad_muelles, duracion_ventana_minutos }) {
    const [result] = await pool.query(
      `INSERT INTO locales (usuario_id, nombre, direccion, ciudad, latitud, longitud, horario_apertura, horario_cierre, capacidad_muelles, duracion_ventana_minutos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, nombre, direccion, ciudad, latitud || null, longitud || null,
       horario_apertura || '08:00:00', horario_cierre || '18:00:00',
       capacidad_muelles || 1, duracion_ventana_minutos || 30]
    );
    return result.insertId;
  },

  async actualizar(id, campos) {
    const permitidos = ['nombre', 'direccion', 'ciudad', 'latitud', 'longitud',
      'horario_apertura', 'horario_cierre', 'capacidad_muelles', 'duracion_ventana_minutos', 'activo'];
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
    await pool.query(`UPDATE locales SET ${sets.join(', ')} WHERE id = ?`, valores);
    return true;
  },

  async buscarPorCiudad(ciudad) {
    const [rows] = await pool.query(
      'SELECT * FROM locales WHERE ciudad = ? AND activo = TRUE ORDER BY nombre ASC',
      [ciudad]
    );
    return rows;
  }
};

module.exports = Local;
