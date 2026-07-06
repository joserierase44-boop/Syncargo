-- ============================================
--  SYNCARGO — Script de creación de base de datos
-- ============================================
CREATE DATABASE IF NOT EXISTS syncargo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE syncargo;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('admin','local','distribuidor','transportista') NOT NULL,
  telefono      VARCHAR(20),
  activo        TINYINT(1) DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locales (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id        INT NOT NULL,
  nombre            VARCHAR(150) NOT NULL,
  direccion         VARCHAR(255) NOT NULL,
  ciudad            VARCHAR(100) NOT NULL,
  latitud           DECIMAL(10,8),
  longitud          DECIMAL(11,8),
  horario_apertura  TIME NOT NULL DEFAULT '08:00:00',
  horario_cierre    TIME NOT NULL DEFAULT '20:00:00',
  capacidad_muelles INT NOT NULL DEFAULT 1,
  activo            TINYINT(1) DEFAULT 1,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ventanas_horarias (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  local_id     INT NOT NULL,
  fecha        DATE NOT NULL,
  hora_inicio  TIME NOT NULL,
  hora_fin     TIME NOT NULL,
  muelle       INT NOT NULL DEFAULT 1,
  estado       ENUM('disponible','reservada','bloqueada') DEFAULT 'disponible',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservas (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  ventana_id         INT NOT NULL,
  distribuidor_id    INT NOT NULL,
  descripcion_carga  TEXT,
  peso_kg            DECIMAL(8,2),
  num_bultos         INT,
  estado             ENUM('pendiente','confirmada','rechazada','cancelada') DEFAULT 'pendiente',
  motivo_rechazo     TEXT,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ventana_id)      REFERENCES ventanas_horarias(id) ON DELETE CASCADE,
  FOREIGN KEY (distribuidor_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS entregas (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id        INT NOT NULL UNIQUE,
  transportista_id  INT,
  estado            ENUM('programada','confirmada','en_ruta','llego_local','descargando','completada','cancelada') DEFAULT 'programada',
  hora_llegada      DATETIME,
  hora_inicio_descarga DATETIME,
  hora_completado   DATETIME,
  observaciones     TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reserva_id)       REFERENCES reservas(id) ON DELETE CASCADE,
  FOREIGN KEY (transportista_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS incidencias (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  entrega_id   INT NOT NULL,
  tipo         ENUM('retraso','dano_mercancia','accidente','rechazo_local','otro') NOT NULL,
  descripcion  TEXT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  titulo      VARCHAR(150) NOT NULL,
  mensaje     TEXT NOT NULL,
  tipo        ENUM('info','success','warning','danger') DEFAULT 'info',
  leida       TINYINT(1) DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
