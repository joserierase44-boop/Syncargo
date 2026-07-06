const { Entrega, Reserva, VentanaHoraria, Local, Usuario, Incidencia, Notificacion } = require('../models');

const crearNotificacion = async (usuario_id, titulo, mensaje, tipo = 'info') => {
  await Notificacion.create({ usuario_id, titulo, mensaje, tipo });
};

const includeCompleto = [
  { model: Reserva, as: 'reserva', include: [
    { model: VentanaHoraria, as: 'ventana', include: [{ model: Local, as: 'local' }] },
    { model: Usuario, as: 'distribuidor', attributes: ['nombre','email','empresa','telefono'] }
  ]},
  { model: Usuario, as: 'transportista', attributes: ['nombre','email','telefono'] },
  { model: Incidencia, as: 'incidencias' }
];

exports.misEntregas = async (req, res) => {
  try {
    const entregas = await Entrega.findAll({
      where: { transportista_id: req.usuario.id },
      include: includeCompleto, order: [['created_at','DESC']]
    });
    res.json(entregas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.porFecha = async (req, res) => {
  try {
    const { fecha } = req.query;
    const ventanaWhere = fecha ? { fecha } : {};
    const entregas = await Entrega.findAll({
      where: { transportista_id: req.usuario.id },
      include: [{
        model: Reserva, as: 'reserva', include: [{
          model: VentanaHoraria, as: 'ventana', where: ventanaWhere,
          include: [{ model: Local, as: 'local' }]
        }, { model: Usuario, as: 'distribuidor', attributes: ['nombre','empresa'] }]
      }], order: [['created_at','DESC']]
    });
    res.json(entregas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.todas = async (req, res) => {
  try {
    const entregas = await Entrega.findAll({ include: includeCompleto, order: [['created_at','DESC']] });
    res.json(entregas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.asignarTransportista = async (req, res) => {
  try {
    const { transportista_id } = req.body;
    const entrega = await Entrega.findByPk(req.params.id);
    if (!entrega) return res.status(404).json({ error: 'Entrega no encontrada' });
    await entrega.update({ transportista_id });
    await crearNotificacion(transportista_id, 'Nueva entrega asignada',
      `Se te ha asignado una entrega #${entrega.id}`, 'info');
    res.json({ mensaje: 'Transportista asignado', entrega });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const { estado, observaciones } = req.body;
    const entrega = await Entrega.findByPk(req.params.id, { include: includeCompleto });
    if (!entrega) return res.status(404).json({ error: 'Entrega no encontrada' });

    const updates = { estado };
    if (estado === 'llego_local') updates.hora_llegada = new Date();
    if (estado === 'descargando') updates.hora_inicio_descarga = new Date();
    if (estado === 'completada') updates.hora_completado = new Date();
    if (observaciones) updates.observaciones = observaciones;

    await entrega.update(updates);

    // Notificar al distribuidor
    if (entrega.reserva && entrega.reserva.distribuidor_id) {
      const msgs = {
        en_ruta: 'Tu entrega está en camino',
        llego_local: 'El transportista llegó al local',
        descargando: 'Descarga iniciada',
        completada: 'Entrega completada exitosamente'
      };
      if (msgs[estado]) {
        await crearNotificacion(entrega.reserva.distribuidor_id, `Entrega #${entrega.id}`, msgs[estado], estado === 'completada' ? 'exito' : 'info');
      }
    }

    res.json({ mensaje: 'Estado actualizado', entrega });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.registrarIncidencia = async (req, res) => {
  try {
    const { tipo, descripcion } = req.body;
    const entrega = await Entrega.findByPk(req.params.id);
    if (!entrega) return res.status(404).json({ error: 'Entrega no encontrada' });
    const incidencia = await Incidencia.create({ entrega_id: entrega.id, reportado_por: req.usuario.id, tipo, descripcion });
    res.status(201).json(incidencia);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
