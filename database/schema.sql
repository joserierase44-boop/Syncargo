-- ============================================
-- SYNCARGO - Schema de Base de Datos MySQL
-- ============================================

CREATE DATABASE IF NOT EXISTS syncargo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE syncargo;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','local','distribuidor','transportista') NOT NULL,
  telefono VARCHAR(20),
  empresa VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rol (rol),
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS locales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  latitud DECIMAL(10,8),
  longitud DECIMAL(11,8),
  horario_apertura TIME DEFAULT '08:00:00',
  horario_cierre TIME DEFAULT '20:00:00',
  capacidad_muelles INT DEFAULT 1,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS ventanas_horarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  local_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  muelle INT DEFAULT 1,
  estado ENUM('disponible','reservada','bloqueada') DEFAULT 'disponible',
  notas TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (local_id) REFERENCES locales(id),
  INDEX idx_fecha_estado (fecha, estado),
  INDEX idx_local_fecha (local_id, fecha)
);

CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ventana_id INT NOT NULL,
  distribuidor_id INT NOT NULL,
  descripcion_carga TEXT,
  peso_kg DECIMAL(10,2),
  num_bultos INT,
  vehiculo_placa VARCHAR(20),
  estado ENUM('pendiente','confirmada','rechazada','cancelada') DEFAULT 'pendiente',
  motivo_rechazo TEXT,
  notas TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ventana_id) REFERENCES ventanas_horarias(id),
  FOREIGN KEY (distribuidor_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS entregas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id INT NOT NULL,
  transportista_id INT,
  estado ENUM('programada','confirmada','en_ruta','llego_local','descargando','completada','cancelada') DEFAULT 'programada',
  hora_llegada DATETIME,
  hora_inicio_descarga DATETIME,
  hora_completado DATETIME,
  observaciones TEXT,
  calificacion INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reserva_id) REFERENCES reservas(id),
  FOREIGN KEY (transportista_id) REFERENCES usuarios(id),
  INDEX idx_estado (estado),
  INDEX idx_transportista (transportista_id)
);

CREATE TABLE IF NOT EXISTS incidencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entrega_id INT NOT NULL,
  reportado_por INT NOT NULL,
  tipo ENUM('retraso','daño_mercancia','acceso_negado','error_direccion','otro') NOT NULL,
  descripcion TEXT NOT NULL,
  resuelta BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (entrega_id) REFERENCES entregas(id),
  FOREIGN KEY (reportado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo ENUM('info','exito','advertencia','error') DEFAULT 'info',
  leida BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_usuario_leida (usuario_id, leida)
);
