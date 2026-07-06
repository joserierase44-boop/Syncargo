// Punto único para acceder a la instancia de Socket.io desde cualquier controlador,
// sin necesidad de pasarla como parámetro en cada función.

let io = null;

function inicializar(socketIoInstance) {
  io = socketIoInstance;
}

// Emite un evento a un usuario específico (cada usuario se une a una "room" con su propio id)
function emitirAUsuario(usuarioId, evento, datos) {
  if (!io) return;
  io.to(`usuario_${usuarioId}`).emit(evento, datos);
}

// Emite un evento a todos los usuarios conectados con un rol específico
function emitirARol(rol, evento, datos) {
  if (!io) return;
  io.to(`rol_${rol}`).emit(evento, datos);
}

module.exports = { inicializar, emitirAUsuario, emitirARol };
