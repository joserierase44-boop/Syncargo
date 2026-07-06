const { pool } = require('../config/database');

const Reserva = {
  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT r.*, v.fecha, v.hora_inicio, v.hora_fin, v.local_id, v.muelle,
              l.nombre AS local_nombre, l.direccion, l.usuario_id AS local_usuario_id,
              u.nombre AS distribuidor_nombre, u.empresa AS distribuidor_empresa
       FROM reservas r
       JOIN ventanas_horarias v ON v.id = r.ventana_id
       JOIN locales l ON l.id = v.local_id
       JOIN usuarios u ON u.id = r.distribuidor_id
       WHERE r.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async listarPorDistribuidor(distribuidorId) {
    const [rows] = await pool.query(
      `SELECT r.*, v.fecha, v.hora_inicio, v.hora_fin, l.nombre AS local_nombre, l.direccion,
              e.id AS entrega_id, e.estado AS entrega_estado
       FROM reservas r
       JOIN ventanas_horarias v ON v.id = r.ventana_id
       JOIN locales l ON l.id = v.local_id
       LEFT JOIN entregas e ON e.reserva_id = r.id
       WHERE r.distribuidor_id = ?
       ORDER BY v.fecha DESC, v.hora_inicio DESC`,
      [distribuidorId]
    );
    return rows;
  },

  async listarPorLocal(localId, { estado } = {}) {
    let sql = `
      SELECT r.*, v.fecha, v.hora_inicio, v.hora_fin, v.muelle,
             u.nombre AS distribuidor_nombre, u.empresa AS distribuidor_empresa
      FROM reservas r
      JOIN ventanas_horarias v ON v.id = r.ventana_id
      JOIN usuarios u ON u.id = r.distribuidor_id
      WHERE v.local_id = ?`;
    const params = [localId];
    if (estado) {
      sql += ' AND r.estado = ?';
      params.push(estado);
    }
    sql += ' ORDER BY v.fecha ASC, v.hora_inicio ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async crear({ ventana_id, distribuidor_id, descripcion_carga, peso_kg, numero_bultos }) {
    const [result] = await pool.query(
      `INSERT INTO reservas (ventana_id, distribuidor_id, descripcion_carga, peso_kg, numero_bultos)
       VALUES (?, ?, ?, ?, ?)`,
      [ventana_id, distribuidor_id, descripcion_carga || null, peso_kg || null, numero_bultos || null]
    );
    return result.insertId;
  },

  async actualizarEstado(id, estado, motivo_rechazo = null) {
    await pool.query(
      'UPDATE reservas SET estado = ?, motivo_rechazo = ? WHERE id = ?',
      [estado, motivo_rechazo, id]
    );
    return true;
  }
};

module.exports = Reserva;
