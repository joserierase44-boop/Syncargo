const { pool } = require('../config/database');

const VentanaHoraria = {
  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM ventanas_horarias WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  // Búsqueda de disponibilidad para el distribuidor, con filtros opcionales
  async buscarDisponibles({ ciudad, local_id, fecha }) {
    let sql = `
      SELECT v.*, l.nombre AS local_nombre, l.direccion, l.ciudad
      FROM ventanas_horarias v
      JOIN locales l ON l.id = v.local_id
      WHERE v.estado = 'disponible' AND l.activo = TRUE`;
    const params = [];

    if (ciudad) {
      sql += ' AND l.ciudad = ?';
      params.push(ciudad);
    }
    if (local_id) {
      sql += ' AND v.local_id = ?';
      params.push(local_id);
    }
    if (fecha) {
      sql += ' AND v.fecha = ?';
      params.push(fecha);
    } else {
      sql += ' AND v.fecha >= CURDATE()';
    }
    sql += ' ORDER BY v.fecha ASC, v.hora_inicio ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async listarPorLocalYFecha(localId, fecha) {
    const [rows] = await pool.query(
      `SELECT v.*,
              r.id AS reserva_id, r.estado AS reserva_estado, r.descripcion_carga,
              u.nombre AS distribuidor_nombre, u.empresa AS distribuidor_empresa
       FROM ventanas_horarias v
       LEFT JOIN reservas r ON r.ventana_id = v.id AND r.estado IN ('pendiente','aprobada')
       LEFT JOIN usuarios u ON u.id = r.distribuidor_id
       WHERE v.local_id = ? AND v.fecha = ?
       ORDER BY v.hora_inicio ASC, v.muelle ASC`,
      [localId, fecha]
    );
    return rows;
  },

  async crear({ local_id, fecha, hora_inicio, hora_fin, muelle }) {
    const [result] = await pool.query(
      `INSERT INTO ventanas_horarias (local_id, fecha, hora_inicio, hora_fin, muelle)
       VALUES (?, ?, ?, ?, ?)`,
      [local_id, fecha, hora_inicio, hora_fin, muelle || 1]
    );
    return result.insertId;
  },

  async actualizarEstado(id, estado) {
    await pool.query('UPDATE ventanas_horarias SET estado = ? WHERE id = ?', [estado, id]);
    return true;
  },

  async eliminar(id) {
    await pool.query('DELETE FROM ventanas_horarias WHERE id = ?', [id]);
    return true;
  }
};

module.exports = VentanaHoraria;
