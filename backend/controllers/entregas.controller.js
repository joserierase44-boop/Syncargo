const { Entrega, Reserva, VentanaHoraria, Local, Usuario, Incidencia } = require('../models');
const { crearNotificacion } = require('../utils/notificacion.util');

const ESTADOS_ORDEN = ['programada','confirmada','en_ruta','llego_local','descargando','completada'];

exports.misEntregas = async (req, res) => {
  try {
    const { estado } = req.query;
    const where = { transportista_id: req.usuario.id };
    if (estado) where.estado = estado;
    const entregas = await Entrega.findAll({
      where,
      include: [{ model: Reserva, as: 'reserva', include: [
        { model: VentanaHoraria, as: 'ventana', include: [{ model: Local, as: 'local' }] },
        { model: Usuario, as: 'distribuidor', attributes: ['id','nombre','telefono'] }
      ]}],
      order: [['created_at','DESC']]
    });
    res.json(entregas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.todas = async (req, res) => {
  try {
    const { estado, fecha } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    const entregas = await Entrega.findAll({
      where,
      include: [
        { model: Reserva, as: 'reserva', include: [
          { model: VentanaHoraria, as: 'ventana', include: [{ model: Local, as: 'local' }] },
          { model: Usuario, as: 'distribuidor', attributes: ['id','nombre','email','telefono'] }
        ]},
        { model: Usuario, as: 'transportista', attributes: ['id','nombre','telefono'] },
        { model: Incidencia, as: 'incidencias' }
      ],
      order: [['created_at','DESC']]
    });
    res.json(entregas);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.asignarTransportista = async (req, res) => {
  try {
    const { transportista_id } = req.body;
    const entrega = await Entrega.findByPk(req.params.id);
    if (!entrega) return res.status(404).json({ error: 'Entrega no encontrada' });
    await entrega.update({ transportista_id, estado: 'confirmada' });
    const io = req.app.get('io');
    await crearNotificacion(io, {
      usuario_id: transportista_id,
      titulo: 'Nueva entrega asignada',
      mensaje: `Tienes una nueva entrega asignada para hoy`,
      tipo: 'info'
    });
    res.json({ mensaje: 'Transportista asignado', entrega });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const entrega = await Entrega.findByPk(req.params.id, {
      include: [{ model: Reserva, as: 'reserva', include: [
        { model: VentanaHoraria, as: 'ventana', include: [{ model: Local, as: 'local' }] },
        { model: Usuario, as: 'distribuidor', attributes: ['id','nombre'] }
      ]}]
    });
    if (!entrega) return res.status(404).json({ error: 'Entrega no encontrada' });
    if (entrega.transportista_id !== req.usuario.id && req.usuario.rol !== 'admin')
      return res.status(403).json({ error: 'Sin permisos' });

    const cambios = { estado };
    if (estado === 'llego_local')  cambios.hora_llegada         = new Date();
    if (estado === 'descargando')  cambios.hora_inicio_descarga = new Date();
    if (estado === 'completada')   cambios.hora_completado      = new Date();

    await entrega.update(cambios);

    const io = req.app.get('io');
    const local = entrega.reserva?.ventana?.local;
    const distribuidor = entrega.reserva?.distribuidor;

    const mensajes = {
      en_ruta:      'El transportista está en camino',
      llego_local:  'El transportista llegó al local',
      descargando:  'Descarga en proceso',
      completada:   'Entrega completada exitosamente ✅'
    };

    if (local && mensajes[estado]) {
      await crearNotificacion(io, { usuario_id: local.usuario_id, titulo: 'Actualización de entrega', mensaje: mensajes[estado], tipo: estado === 'completada' ? 'success' : 'info' });
    }
    if (distribuidor && mensajes[estado]) {
      await crearNotificacion(io, { usuario_id: distribuidor.id, titulo: 'Actualización de entrega', mensaje: mensajes[estado], tipo: estado === 'completada' ? 'success' : 'info' });
    }

    io.emit('entrega_actualizada', { id: entrega.id, estado });
    res.json({ mensaje: `Estado actualizado a: ${estado}`, entrega });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.obtener = async (req, res) => {
  try {
    const entrega = await Entrega.findByPk(req.params.id, {
      include: [
        { model: Reserva, as: 'reserva', include: [
          { model: VentanaHoraria, as: 'ventana', include: [{ model: Local, as: 'local' }] },
          { model: Usuario, as: 'distribuidor', attributes: ['id','nombre','email','telefono'] }
        ]},
        { model: Usuario, as: 'transportista', attributes: ['id','nombre','telefono'] },
        { model: Incidencia, as: 'incidencias' }
      ]
    });
    if (!entrega) return res.status(404).json({ error: 'Entrega no encontrada' });
    res.json(entrega);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
