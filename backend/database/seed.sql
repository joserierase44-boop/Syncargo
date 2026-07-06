-- =====================================================================
-- SYNCARGO - Datos de prueba (seed)
-- Password para TODOS los usuarios de prueba: password123
-- =====================================================================

USE syncargo;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE logs_auditoria;
TRUNCATE TABLE notificaciones;
TRUNCATE TABLE incidencias;
TRUNCATE TABLE entregas;
TRUNCATE TABLE reservas;
TRUNCATE TABLE ventanas_horarias;
TRUNCATE TABLE locales;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- USUARIOS (hash real de bcrypt para "password123")
-- ---------------------------------------------------------------------
INSERT INTO usuarios (id, nombre, email, password_hash, rol, telefono, empresa, placa_vehiculo, activo) VALUES
(1, 'Carla Méndez',      'admin@syncargo.com',        '$2a$10$D2iZjhBYJuvDa13e8I3vKeujmzxKR0OuRzwJpx3yMpFEWB3mAW71q', 'administrador',  '0991234567', NULL, NULL, TRUE),

(2, 'Jorge Salinas',     'local1@syncargo.com',       '$2a$10$D2iZjhBYJuvDa13e8I3vKeujmzxKR0OuRzwJpx3yMpFEWB3mAW71q', 'local_comercial','0987654321', 'Supermercado El Roble', NULL, TRUE),
(3, 'Andrea Torres',     'local2@syncargo.com',       '$2a$10$D2iZjhBYJuvDa13e8I3vKeujmzxKR0OuRzwJpx3yMpFEWB3mAW71q', 'local_comercial','0987654322', 'Farmacia CentroVida', NULL, TRUE),

(4, 'Distribuidora Andina S.A.', 'distribuidor1@syncargo.com', '$2a$10$D2iZjhBYJuvDa13e8I3vKeujmzxKR0OuRzwJpx3yMpFEWB3mAW71q', 'distribuidor', '0987111222', 'Distribuidora Andina S.A.', NULL, TRUE),
(5, 'AlimentosFrescos Cía. Ltda.', 'distribuidor2@syncargo.com', '$2a$10$D2iZjhBYJuvDa13e8I3vKeujmzxKR0OuRzwJpx3yMpFEWB3mAW71q', 'distribuidor', '0987111333', 'AlimentosFrescos Cía. Ltda.', NULL, TRUE),

(6, 'Luis Quishpe',       'transportista1@syncargo.com', '$2a$10$D2iZjhBYJuvDa13e8I3vKeujmzxKR0OuRzwJpx3yMpFEWB3mAW71q', 'transportista', '0976543210', 'Distribuidora Andina S.A.', 'PBX-1234', TRUE),
(7, 'Mónica Vélez',       'transportista2@syncargo.com', '$2a$10$D2iZjhBYJuvDa13e8I3vKeujmzxKR0OuRzwJpx3yMpFEWB3mAW71q', 'transportista', '0976543211', 'AlimentosFrescos Cía. Ltda.', 'GHQ-5678', TRUE);

-- ---------------------------------------------------------------------
-- LOCALES
-- ---------------------------------------------------------------------
INSERT INTO locales (id, usuario_id, nombre, direccion, ciudad, latitud, longitud, horario_apertura, horario_cierre, capacidad_muelles, duracion_ventana_minutos, activo) VALUES
(1, 2, 'Supermercado El Roble - Sucursal Centro', 'Av. Solano 4-50, Cuenca', 'Cuenca', -2.9006300, -79.0045000, '07:00:00', '19:00:00', 2, 30, TRUE),
(2, 3, 'Farmacia CentroVida - Sucursal Norte', 'Av. de las Américas 3-21, Cuenca', 'Cuenca', -2.8945000, -79.0021000, '08:00:00', '18:00:00', 1, 30, TRUE);

-- ---------------------------------------------------------------------
-- VENTANAS HORARIAS (hoy y los próximos 2 días, ambos locales)
-- ---------------------------------------------------------------------
INSERT INTO ventanas_horarias (id, local_id, fecha, hora_inicio, hora_fin, muelle, estado) VALUES
(1,  1, CURDATE(), '08:00:00', '08:30:00', 1, 'reservada'),
(2,  1, CURDATE(), '08:30:00', '09:00:00', 1, 'reservada'),
(3,  1, CURDATE(), '09:00:00', '09:30:00', 1, 'disponible'),
(4,  1, CURDATE(), '09:30:00', '10:00:00', 1, 'disponible'),
(5,  1, CURDATE(), '08:00:00', '08:30:00', 2, 'reservada'),
(6,  1, CURDATE(), '08:30:00', '09:00:00', 2, 'disponible'),
(7,  1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '08:30:00', 1, 'disponible'),
(8,  1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30:00', '09:00:00', 1, 'disponible'),
(9,  1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '10:30:00', 1, 'disponible'),
(10, 2, CURDATE(), '09:00:00', '09:30:00', 1, 'reservada'),
(11, 2, CURDATE(), '09:30:00', '10:00:00', 1, 'disponible'),
(12, 2, CURDATE(), '10:00:00', '10:30:00', 1, 'disponible'),
(13, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '09:30:00', 1, 'disponible'),
(14, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '11:30:00', 1, 'disponible');

-- ---------------------------------------------------------------------
-- RESERVAS
-- ---------------------------------------------------------------------
INSERT INTO reservas (id, ventana_id, distribuidor_id, descripcion_carga, peso_kg, numero_bultos, estado, motivo_rechazo) VALUES
(1, 1, 4, 'Abarrotes y enlatados',        450.00, 60, 'aprobada', NULL),
(2, 2, 5, 'Productos lácteos refrigerados', 280.00, 35, 'aprobada', NULL),
(3, 5, 4, 'Bebidas embotelladas',          600.00, 80, 'aprobada', NULL),
(4, 10, 5, 'Medicamentos e insumos médicos', 120.00, 15, 'aprobada', NULL),
(5, 3, 4, 'Productos de limpieza',         200.00, 25, 'pendiente', NULL);

-- ---------------------------------------------------------------------
-- ENTREGAS (en distintos estados para demostrar el flujo completo)
-- ---------------------------------------------------------------------
INSERT INTO entregas (id, reserva_id, transportista_id, estado, hora_salida, hora_llegada, hora_inicio_descarga, hora_completado, observaciones) VALUES
(1, 1, 6, 'completada',       CONCAT(CURDATE(), ' 07:15:00'), CONCAT(CURDATE(), ' 07:55:00'), CONCAT(CURDATE(), ' 08:02:00'), CONCAT(CURDATE(), ' 08:25:00'), 'Entrega sin novedad'),
(2, 2, 7, 'descargando',      CONCAT(CURDATE(), ' 07:40:00'), CONCAT(CURDATE(), ' 08:28:00'), CONCAT(CURDATE(), ' 08:33:00'), NULL, NULL),
(3, 3, 6, 'en_ruta',          CONCAT(CURDATE(), ' 08:10:00'), NULL, NULL, NULL, NULL),
(4, 4, 7, 'confirmada',       NULL, NULL, NULL, NULL, NULL);

-- ---------------------------------------------------------------------
-- INCIDENCIAS (ejemplo de un retraso reportado)
-- ---------------------------------------------------------------------
INSERT INTO incidencias (id, entrega_id, reportado_por, tipo, descripcion) VALUES
(1, 2, 7, 'retraso', 'Tráfico intenso en Av. de las Américas, llegada con 15 minutos de retraso.');

-- ---------------------------------------------------------------------
-- NOTIFICACIONES de ejemplo
-- ---------------------------------------------------------------------
INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, leida, entidad_tipo, entidad_id) VALUES
(2, 'Nueva solicitud de reserva', 'Distribuidora Andina S.A. solicitó una ventana horaria para hoy a las 09:00.', 'info', FALSE, 'reserva', 5),
(4, 'Reserva aprobada', 'Tu reserva en Supermercado El Roble fue aprobada para hoy a las 08:00.', 'exito', TRUE, 'reserva', 1),
(6, 'Entrega asignada', 'Se te asignó la entrega #3 con destino Supermercado El Roble.', 'info', FALSE, 'entrega', 3);
