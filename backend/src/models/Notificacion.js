const { pool } = require('../config/database');

const Notificacion = {
  async crear({ usuario_id, titulo, mensaje, tipo = 'info', entidad_tipo = null, entidad_id = null }) {
    const [result] = await pool.query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, entidad_tipo, entidad_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario_id, titulo, mensaje, tipo, entidad_tipo, entidad_id]
    );
    return result.insertId;
  },

  async listarPorUsuario(usuarioId, { soloNoLeidas = false } = {}) {
    let sql = 'SELECT * FROM notificaciones WHERE usuario_id = ?';
    const params = [usuarioId];
    if (soloNoLeidas) sql += ' AND leida = FALSE';
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async marcarLeida(id, usuarioId) {
    await pool.query(
      'UPDATE notificaciones SET leida = TRUE WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return true;
  },

  async marcarTodasLeidas(usuarioId) {
    await pool.query('UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ?', [usuarioId]);
    return true;
  }
};

module.exports = Notificacion;
