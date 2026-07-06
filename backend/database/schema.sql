-- =====================================================================
-- SYNCARGO - Esquema de base de datos
-- Plataforma de coordinación logística urbana
-- Motor: MySQL 8.0+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS syncargo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE syncargo;

-- ---------------------------------------------------------------------
-- Tabla: usuarios
-- Almacena los 4 tipos de usuario: administrador, local_comercial,
-- distribuidor, transportista
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('administrador', 'local_comercial', 'distribuidor', 'transportista') NOT NULL,
  telefono VARCHAR(30),
  empresa VARCHAR(150) DEFAULT NULL COMMENT 'Empresa del distribuidor o transportista',
  placa_vehiculo VARCHAR(20) DEFAULT NULL COMMENT 'Solo aplica a transportistas',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_rol (rol),
  INDEX idx_usuarios_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: locales
-- Cada local comercial pertenece a un usuario con rol local_comercial
-- ---------------------------------------------------------------------
CREATE TABLE locales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  latitud DECIMAL(10,7) DEFAULT NULL,
  longitud DECIMAL(10,7) DEFAULT NULL,
  horario_apertura TIME NOT NULL DEFAULT '08:00:00',
  horario_cierre TIME NOT NULL DEFAULT '18:00:00',
  capacidad_muelles INT NOT NULL DEFAULT 1 COMMENT 'Número de muelles/andenes de descarga simultáneos',
  duracion_ventana_minutos INT NOT NULL DEFAULT 30 COMMENT 'Duración estándar de cada ventana horaria',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_locales_ciudad (ciudad)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: ventanas_horarias
-- Bloques de tiempo que el local habilita para recibir mercancía
-- ---------------------------------------------------------------------
CREATE TABLE ventanas_horarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  local_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  muelle INT NOT NULL DEFAULT 1,
  estado ENUM('disponible', 'reservada', 'bloqueada') NOT NULL DEFAULT 'disponible',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE,
  INDEX idx_ventanas_fecha (fecha),
  INDEX idx_ventanas_estado (estado),
  UNIQUE KEY uniq_ventana_muelle (local_id, fecha, hora_inicio, muelle)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: reservas
-- Solicitud de un distribuidor sobre una ventana horaria específica
-- ---------------------------------------------------------------------
CREATE TABLE reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ventana_id INT NOT NULL,
  distribuidor_id INT NOT NULL,
  descripcion_carga VARCHAR(255) DEFAULT NULL,
  peso_kg DECIMAL(8,2) DEFAULT NULL,
  numero_bultos INT DEFAULT NULL,
  estado ENUM('pendiente', 'aprobada', 'rechazada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  motivo_rechazo VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ventana_id) REFERENCES ventanas_horarias(id) ON DELETE CASCADE,
  FOREIGN KEY (distribuidor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_reservas_estado (estado)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: entregas
-- Ejecución física de una reserva aprobada, asignada a un transportista
-- ---------------------------------------------------------------------
CREATE TABLE entregas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id INT NOT NULL,
  transportista_id INT DEFAULT NULL,
  estado ENUM(
    'programada',
    'confirmada',
    'en_ruta',
    'llego_al_local',
    'descargando',
    'completada',
    'cancelada'
  ) NOT NULL DEFAULT 'programada',
  hora_salida DATETIME DEFAULT NULL,
  hora_llegada DATETIME DEFAULT NULL,
  hora_inicio_descarga DATETIME DEFAULT NULL,
  hora_completado DATETIME DEFAULT NULL,
  observaciones VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
  FOREIGN KEY (transportista_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_entregas_estado (estado),
  INDEX idx_entregas_transportista (transportista_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: incidencias
-- Reportes registrados por el transportista durante una entrega
-- ---------------------------------------------------------------------
CREATE TABLE incidencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entrega_id INT NOT NULL,
  reportado_por INT NOT NULL,
  tipo ENUM('retraso', 'mercancia_danada', 'acceso_bloqueado', 'rechazo_local', 'otro') NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE,
  FOREIGN KEY (reportado_por) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: notificaciones
-- Avisos in-app para cualquier usuario
-- ---------------------------------------------------------------------
CREATE TABLE notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje VARCHAR(255) NOT NULL,
  tipo ENUM('info', 'exito', 'advertencia', 'error') NOT NULL DEFAULT 'info',
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  entidad_tipo VARCHAR(50) DEFAULT NULL COMMENT 'reserva | entrega | incidencia',
  entidad_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_notif_usuario_leida (usuario_id, leida)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla: logs_auditoria
-- Trazabilidad de cambios críticos (usada por el administrador)
-- ---------------------------------------------------------------------
CREATE TABLE logs_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT DEFAULT NULL,
  accion VARCHAR(100) NOT NULL,
  entidad_tipo VARCHAR(50) NOT NULL,
  entidad_id INT DEFAULT NULL,
  detalle JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;
