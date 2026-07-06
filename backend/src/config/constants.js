// Constantes centralizadas para evitar strings sueltos repetidos en el código

const ROLES = {
  ADMINISTRADOR: 'administrador',
  LOCAL_COMERCIAL: 'local_comercial',
  DISTRIBUIDOR: 'distribuidor',
  TRANSPORTISTA: 'transportista'
};

const ESTADOS_ENTREGA = {
  PROGRAMADA: 'programada',
  CONFIRMADA: 'confirmada',
  EN_RUTA: 'en_ruta',
  LLEGO_AL_LOCAL: 'llego_al_local',
  DESCARGANDO: 'descargando',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
};

// Transiciones válidas: desde qué estado se puede pasar a cuál
const TRANSICIONES_VALIDAS = {
  [ESTADOS_ENTREGA.PROGRAMADA]: [ESTADOS_ENTREGA.CONFIRMADA, ESTADOS_ENTREGA.CANCELADA],
  [ESTADOS_ENTREGA.CONFIRMADA]: [ESTADOS_ENTREGA.EN_RUTA, ESTADOS_ENTREGA.CANCELADA],
  [ESTADOS_ENTREGA.EN_RUTA]: [ESTADOS_ENTREGA.LLEGO_AL_LOCAL, ESTADOS_ENTREGA.CANCELADA],
  [ESTADOS_ENTREGA.LLEGO_AL_LOCAL]: [ESTADOS_ENTREGA.DESCARGANDO],
  [ESTADOS_ENTREGA.DESCARGANDO]: [ESTADOS_ENTREGA.COMPLETADA],
  [ESTADOS_ENTREGA.COMPLETADA]: [],
  [ESTADOS_ENTREGA.CANCELADA]: []
};

const ESTADOS_RESERVA = {
  PENDIENTE: 'pendiente',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  CANCELADA: 'cancelada'
};

const ESTADOS_VENTANA = {
  DISPONIBLE: 'disponible',
  RESERVADA: 'reservada',
  BLOQUEADA: 'bloqueada'
};

module.exports = { ROLES, ESTADOS_ENTREGA, TRANSICIONES_VALIDAS, ESTADOS_RESERVA, ESTADOS_VENTANA };
