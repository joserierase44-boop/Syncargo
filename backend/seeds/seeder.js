require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Local, VentanaHoraria, Reserva, Entrega } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('🗄️  Tablas sincronizadas');

    const hash = pwd => bcrypt.hashSync(pwd, 10);

    // ── Usuarios ─────────────────────────────────────────
    const [admin, local1u, local2u, dist1, dist2, trans1, trans2] = await Usuario.bulkCreate([
      { nombre: 'Admin Syncargo',     email: 'admin@syncargo.com',       password_hash: hash('admin123'),  rol: 'admin' },
      { nombre: 'Supermercado Favi',  email: 'local@favi.com',           password_hash: hash('local123'),  rol: 'local',         telefono: '0987654321' },
      { nombre: 'Farmacia Saludmed',  email: 'local@saludmed.com',       password_hash: hash('local123'),  rol: 'local',         telefono: '0976543210' },
      { nombre: 'Distrib. NorteExpress', email: 'dist@norteexpress.com', password_hash: hash('dist123'),   rol: 'distribuidor',  telefono: '0965432109' },
      { nombre: 'Distrib. CargaRápida',  email: 'dist@cargarapida.com',  password_hash: hash('dist123'),   rol: 'distribuidor',  telefono: '0954321098' },
      { nombre: 'Carlos Transportes', email: 'trans@carlos.com',         password_hash: hash('trans123'),  rol: 'transportista', telefono: '0943210987' },
      { nombre: 'María Logística',    email: 'trans@maria.com',          password_hash: hash('trans123'),  rol: 'transportista', telefono: '0932109876' }
    ]);
    console.log('👥 Usuarios creados');

    // ── Locales ───────────────────────────────────────────
    const [localFavi, localSalud] = await Local.bulkCreate([
      { usuario_id: local1u.id, nombre: 'Supermercado Favi Centro', direccion: 'Av. Solano 4-35', ciudad: 'Cuenca', latitud: -2.8975, longitud: -79.0045, horario_apertura: '07:00:00', horario_cierre: '21:00:00', capacidad_muelles: 3 },
      { usuario_id: local2u.id, nombre: 'Farmacia Saludmed Norte',  direccion: 'Av. Ordóñez Lasso 2-18', ciudad: 'Cuenca', latitud: -2.8800, longitud: -79.0200, horario_apertura: '08:00:00', horario_cierre: '20:00:00', capacidad_muelles: 2 }
    ]);
    console.log('🏪 Locales creados');

    // ── Ventanas horarias ─────────────────────────────────
    const hoy = new Date();
    const dias = [0,1,2,3,4].map(d => { const f = new Date(hoy); f.setDate(f.getDate()+d); return f.toISOString().split('T')[0]; });

    const ventanasData = [];
    for (const fecha of dias) {
      for (const [h_ini, h_fin] of [['08:00','09:30'],['09:30','11:00'],['11:00','12:30'],['14:00','15:30'],['15:30','17:00']]) {
        ventanasData.push({ local_id: localFavi.id, fecha, hora_inicio: h_ini+':00', hora_fin: h_fin+':00', muelle: 1, estado: 'disponible' });
        if (ventanasData.filter(v => v.fecha === fecha && v.local_id === localFavi.id).length <= 3)
          ventanasData.push({ local_id: localFavi.id, fecha, hora_inicio: h_ini+':00', hora_fin: h_fin+':00', muelle: 2, estado: 'disponible' });
      }
      for (const [h_ini, h_fin] of [['09:00','10:30'],['10:30','12:00'],['14:00','15:30'],['15:30','17:00']]) {
        ventanasData.push({ local_id: localSalud.id, fecha, hora_inicio: h_ini+':00', hora_fin: h_fin+':00', muelle: 1, estado: 'disponible' });
      }
    }
    const ventanas = await VentanaHoraria.bulkCreate(ventanasData);
    console.log(`🕐 ${ventanas.length} ventanas horarias creadas`);

    // ── Reservas y Entregas de ejemplo ────────────────────
    const v1 = ventanas[0]; const v2 = ventanas[1]; const v3 = ventanas[10];
    await v1.update({ estado: 'reservada' });
    await v2.update({ estado: 'reservada' });
    await v3.update({ estado: 'reservada' });

    const r1 = await Reserva.create({ ventana_id: v1.id, distribuidor_id: dist1.id, descripcion_carga: 'Lácteos y productos refrigerados', peso_kg: 450, num_bultos: 12, estado: 'confirmada' });
    const r2 = await Reserva.create({ ventana_id: v2.id, distribuidor_id: dist2.id, descripcion_carga: 'Bebidas y abarrotes', peso_kg: 800, num_bultos: 30, estado: 'pendiente' });
    const r3 = await Reserva.create({ ventana_id: v3.id, distribuidor_id: dist1.id, descripcion_carga: 'Medicamentos y sueros', peso_kg: 120, num_bultos: 8, estado: 'confirmada' });

    await Entrega.create({ reserva_id: r1.id, transportista_id: trans1.id, estado: 'en_ruta' });
    await Entrega.create({ reserva_id: r2.id, estado: 'programada' });
    await Entrega.create({ reserva_id: r3.id, transportista_id: trans2.id, estado: 'confirmada' });

    console.log('📦 Reservas y entregas de prueba creadas');
    console.log('\n✅ Seed completado. Credenciales de acceso:');
    console.log('  Admin:         admin@syncargo.com    / admin123');
    console.log('  Local 1:       local@favi.com        / local123');
    console.log('  Local 2:       local@saludmed.com    / local123');
    console.log('  Distribuidor:  dist@norteexpress.com / dist123');
    console.log('  Transportista: trans@carlos.com      / trans123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err);
    process.exit(1);
  }
}

seed();
