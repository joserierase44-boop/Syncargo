const { pool } = require('../config/database');

const Entrega = {
  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT e.*, r.descripcion_carga, r.peso_kg, r.numero_bultos, r.distribuidor_id,
              v.fecha, v.hora_inicio, v.hora_fin, v.muelle,
              l.nombre AS local_nombre, l.direccion, l.ciudad,
              d.nombre AS distribuidor_nombre, d.empresa AS distribuidor_empresa,
              t.nombre AS transportista_nombre, t.telefono AS transportista_telefono, t.placa_vehiculo
       FROM entregas e
       JOIN reservas r ON r.id = e.reserva_id
       JOIN ventanas_horarias v ON v.id = r.ventana_id
       JOIN locales l ON l.id = v.local_id
       JOIN usuarios d ON d.id = r.distribuidor_id
       LEFT JOIN usuarios t ON t.id = e.transportista_id
       WHERE e.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async listarPorTransportista(transportistaId, { fecha } = {}) {
    let sql = `
      SELECT e.*, r.descripcion_carga, r.peso_kg, r.numero_bultos,
             v.fecha, v.hora_inicio, v.hora_fin,
             l.nombre AS local_nombre, l.direccion, l.ciudad, l.latitud, l.longitud
      FROM entregas e
      JOIN reservas r ON r.id = e.reserva_id
      JOIN ventanas_horarias v ON v.id = r.ventana_id
      JOIN locales l ON l.id = v.local_id
      WHERE e.transportista_id = ?`;
    const params = [transportistaId];
    if (fecha) {
      sql += ' AND v.fecha = ?';
      params.push(fecha);
    }
    sql += ' ORDER BY v.fecha ASC, v.hora_inicio ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async listarPorLocal(localId, { fecha, estado } = {}) {
    let sql = `
      SELECT e.*, r.descripcion_carga, r.peso_kg, v.fecha, v.hora_inicio, v.hora_fin,
             d.nombre AS distribuidor_nombre, d.empresa AS distribuidor_empresa,
             t.nombre AS transportista_nombre, t.placa_vehiculo
      FROM entregas e
      JOIN reservas r ON r.id = e.reserva_id
      JOIN ventanas_horarias v ON v.id = r.ventana_id
      JOIN usuarios d ON d.id = r.distribuidor_id
      LEFT JOIN usuarios t ON t.id = e.transportista_id
      WHERE v.local_id = ?`;
    const params = [localId];
    if (fecha) {
      sql += ' AND v.fecha = ?';
      params.push(fecha);
    }
    if (estado) {
      sql += ' AND e.estado = ?';
      params.push(estado);
    }
    sql += ' ORDER BY v.hora_inicio ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async listarTodas({ estado, fecha } = {}) {
    let sql = `
      SELECT e.*, v.fecha, v.hora_inicio, l.nombre AS local_nombre,
             d.nombre AS distribuidor_nombre, t.nombre AS transportista_nombre
      FROM entregas e
      JOIN reservas r ON r.id = e.reserva_id
      JOIN ventanas_horarias v ON v.id = r.ventana_id
      JOIN locales l ON l.id = v.local_id
      JOIN usuarios d ON d.id = r.distribuidor_id
      LEFT JOIN usuarios t ON t.id = e.transportista_id
      WHERE 1=1`;
    const params = [];
    if (estado) {
      sql += ' AND e.estado = ?';
      params.push(estado);
    }
    if (fecha) {
      sql += ' AND v.fecha = ?';
      params.push(fecha);
    }
    sql += ' ORDER BY e.created_at DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async crear({ reserva_id, transportista_id }) {
    const [result] = await pool.query(
      'INSERT INTO entregas (reserva_id, transportista_id) VALUES (?, ?)',
      [reserva_id, transportista_id || null]
    );
    return result.insertId;
  },

  async asignarTransportista(id, transportistaId) {
    await pool.query('UPDATE entregas SET transportista_id = ? WHERE id = ?', [transportistaId, id]);
    return true;
  },

  async actualizarEstado(id, estado, campoTimestamp = null) {
    if (campoTimestamp) {
      await pool.query(
        `UPDATE entregas SET estado = ?, ${campoTimestamp} = NOW() WHERE id = ?`,
        [estado, id]
      );
    } else {
      await pool.query('UPDATE entregas SET estado = ? WHERE id = ?', [estado, id]);
    }
    return true;
  },

  async agregarObservacion(id, observaciones) {
    await pool.query('UPDATE entregas SET observaciones = ? WHERE id = ?', [observaciones, id]);
    return true;
  }
};

module.exports = Entrega;
