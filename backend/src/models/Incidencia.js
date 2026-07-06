const { pool } = require('../config/database');

const Incidencia = {
  async crear({ entrega_id, reportado_por, tipo, descripcion }) {
    const [result] = await pool.query(
      `INSERT INTO incidencias (entrega_id, reportado_por, tipo, descripcion)
       VALUES (?, ?, ?, ?)`,
      [entrega_id, reportado_por, tipo, descripcion]
    );
    return result.insertId;
  },

  async listarPorEntrega(entregaId) {
    const [rows] = await pool.query(
      `SELECT i.*, u.nombre AS reportado_por_nombre
       FROM incidencias i
       JOIN usuarios u ON u.id = i.reportado_por
       WHERE i.entrega_id = ?
       ORDER BY i.created_at DESC`,
      [entregaId]
    );
    return rows;
  },

  async listarTodas({ tipo } = {}) {
    let sql = `
      SELECT i.*, u.nombre AS reportado_por_nombre,
             e.id AS entrega_id, l.nombre AS local_nombre
      FROM incidencias i
      JOIN usuarios u ON u.id = i.reportado_por
      JOIN entregas e ON e.id = i.entrega_id
      JOIN reservas r ON r.id = e.reserva_id
      JOIN ventanas_horarias v ON v.id = r.ventana_id
      JOIN locales l ON l.id = v.local_id`;
    const params = [];
    if (tipo) {
      sql += ' WHERE i.tipo = ?';
      params.push(tipo);
    }
    sql += ' ORDER BY i.created_at DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  }
};

module.exports = Incidencia;
