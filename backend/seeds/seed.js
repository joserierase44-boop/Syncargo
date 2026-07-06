require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Local, VentanaHoraria, Reserva, Entrega } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('[SEED] Conectado a MySQL');
    await sequelize.sync({ force: true });
    console.log('[SEED] Tablas recreadas');

    const hash = (p) => bcrypt.hash(p, 10);

    const usuarios = await Usuario.bulkCreate([
      { nombre: 'Admin Syncargo',          email: 'admin@syncargo.com',  password_hash: await hash('admin123'), rol: 'admin',         telefono: '0999000001' },
      { nombre: 'Supermercado La Favorita',email: 'local1@syncargo.com', password_hash: await hash('local123'), rol: 'local',         empresa: 'La Favorita S.A.',  telefono: '0987000001' },
      { nombre: 'Farmacia Cruz Azul',      email: 'local2@syncargo.com', password_hash: await hash('local123'), rol: 'local',         empresa: 'Cruz Azul S.A.',    telefono: '0987000002' },
      { nombre: 'Distribuidora El Norte',  email: 'dist1@syncargo.com',  password_hash: await hash('dist123'),  rol: 'distribuidor',  empresa: 'Dist. El Norte',    telefono: '0998000001' },
      { nombre: 'Logística Andes',         email: 'dist2@syncargo.com',  password_hash: await hash('dist123'),  rol: 'distribuidor',  empresa: 'Logística Andes',   telefono: '0998000002' },
      { nombre: 'Carlos Transportes',      email: 'trans1@syncargo.com', password_hash: await hash('trans123'), rol: 'transportista', telefono: '0976000001' },
      { nombre: 'María López',             email: 'trans2@syncargo.com', password_hash: await hash('trans123'), rol: 'transportista', telefono: '0976000002' },
    ], { individualHooks: false });

    const locales = await Local.bulkCreate([
      { usuario_id: usuarios[1].id, nombre: 'La Favorita - Centro', direccion: 'Av. Solano y Florencia Astudillo', ciudad: 'Cuenca', capacidad_muelles: 3, hora_apertura: '07:00:00', hora_cierre: '20:00:00', latitud: -2.9001, longitud: -79.0059 },
      { usuario_id: usuarios[2].id, nombre: 'Farmacia Cruz Azul - Feria Libre', direccion: 'Av. Hurtado de Mendoza y Americas', ciudad: 'Cuenca', capacidad_muelles: 1, hora_apertura: '08:00:00', hora_cierre: '18:00:00', latitud: -2.9190, longitud: -79.0100 },
    ]);

    const ventanas = [];
    for (let d = 0; d < 5; d++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + d);
      const f = fecha.toISOString().split('T')[0];
      const slots = [['08:00:00','09:30:00'],['09:30:00','11:00:00'],['11:00:00','12:30:00'],['14:00:00','15:30:00'],['15:30:00','17:00:00']];
      slots.forEach(([ini,fin],idx) => {
        ventanas.push({ local_id: locales[0].id, fecha: f, hora_inicio: ini, hora_fin: fin, muelle: (idx%3)+1 });
        if (idx < 3) ventanas.push({ local_id: locales[1].id, fecha: f, hora_inicio: ini, hora_fin: fin, muelle: 1 });
      });
    }
    const vs = await VentanaHoraria.bulkCreate(ventanas);

    const r1 = await Reserva.create({ ventana_id: vs[0].id, distribuidor_id: usuarios[3].id, descripcion_carga: 'Lácteos y embutidos refrigerados', peso_kg: 250, bultos: 48, estado: 'confirmada' });
    await vs[0].update({ estado: 'reservada' });
    await Entrega.create({ reserva_id: r1.id, transportista_id: usuarios[5].id, estado: 'en_ruta', placa_vehiculo: 'GBD-1234' });

    const r2 = await Reserva.create({ ventana_id: vs[1].id, distribuidor_id: usuarios[4].id, descripcion_carga: 'Medicamentos y suplementos', peso_kg: 80, bultos: 20, estado: 'pendiente' });
    await vs[1].update({ estado: 'reservada' });

    const r3 = await Reserva.create({ ventana_id: vs[5].id, distribuidor_id: usuarios[3].id, descripcion_carga: 'Abarrotes varios y limpieza', peso_kg: 400, bultos: 120, estado: 'confirmada' });
    await vs[5].update({ estado: 'reservada' });
    await Entrega.create({ reserva_id: r3.id, transportista_id: usuarios[6].id, estado: 'programada', placa_vehiculo: 'GCA-5678' });

    console.log('\n SEED COMPLETADO');
    console.log('admin@syncargo.com   / admin123');
    console.log('local1@syncargo.com  / local123');
    console.log('dist1@syncargo.com   / dist123');
    console.log('trans1@syncargo.com  / trans123');
    process.exit(0);
  } catch (err) {
    console.error('[SEED] Error:', err.message);
    process.exit(1);
  }
}

seed();
