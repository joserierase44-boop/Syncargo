const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token requerido'));
    try {
      socket.usuario = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch { next(new Error('Token inválido')); }
  });

  io.on('connection', (socket) => {
    const { id, rol } = socket.usuario;
    socket.join(`usuario_${id}`);
    socket.join(`rol_${rol}`);
    console.log(`Socket conectado: usuario ${id} (${rol})`);

    socket.on('unirse_sala', (sala) => socket.join(sala));

    socket.on('actualizar_estado_entrega', (data) => {
      io.to(`rol_admin`).emit('entrega_actualizada', data);
      io.to(`rol_local`).emit('entrega_actualizada', data);
    });

    socket.on('disconnect', () => console.log(`Socket desconectado: usuario ${id}`));
  });
};
