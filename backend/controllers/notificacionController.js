const { Notificacion } = require('../models');

exports.mis = async (req, res) => {
  try {
    const notifs = await Notificacion.findAll({
      where: { usuario_id: req.usuario.id },
      order: [['created_at','DESC']], limit: 50
    });
    res.json(notifs);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.marcarLeida = async (req, res) => {
  try {
    await Notificacion.update({ leida: true }, { where: { id: req.params.id, usuario_id: req.usuario.id } });
    res.json({ mensaje: 'Notificación leída' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.update({ leida: true }, { where: { usuario_id: req.usuario.id } });
    res.json({ mensaje: 'Todas marcadas como leídas' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
