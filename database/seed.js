require('dotenv').config({ path: '../backend/.env' });
const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Local, VentanaHoraria, Reserva, Entrega } = require('../backend/models');

const hash = (p) => bcrypt.hashSync(p, 10);

const hoy = new Date();
const fecha = (dias) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
};

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('📋 Tablas sincronizadas');

    // USUARIOS
    const usuarios = await Usuario.bulkCreate([
      { nombre: 'Admin Syncargo', email: 'admin@syncargo.com', password_hash: hash('admin123'), rol: 'admin', empresa: 'Syncargo' },
      { nombre: 'Supermercado La Colina', email: 'local@syncargo.com', password_hash: hash('local123'), rol: 'local', empresa: 'La Colina S.A.', telefono: '0991234567' },
      { nombre: 'Farmacia Central', email: 'farmacia@syncargo.com', password_hash: hash('local123'), rol: 'local', empresa: 'Farmacia Central', telefono: '0992345678' },
      { nombre: 'Distribuidora Norte', email: 'dist@syncargo.com', password_hash: hash('dist123'), rol: 'distribuidor', empresa: 'Distribuidora Norte CIA.', telefono: '0993456789' },
      { nombre: 'Importaciones Andinas', email: 'andinas@syncargo.com', password_hash: hash('dist123'), rol: 'distribuidor', empresa: 'Importaciones Andinas', telefono: '0994567890' },
      { nombre: 'Carlos Transportes', email: 'trans@syncargo.com', password_hash: hash('trans123'), rol: 'transportista', empresa: 'Transportes Veloz', telefono: '0995678901' },
      { nombre: 'María Logística', email: 'maria@syncargo.com', password_hash: hash('trans123'), rol: 'transportista', empresa: 'ML Express', telefono: '0996789012' }
    ], { individualHooks: false });
    console.log(`✅ ${usuarios.length} usuarios creados`);

    // LOCALES
    const locales = await Local.bulkCreate([
      { usuario_id: usuarios[1].id, nombre: 'Supermercado La Colina - Cuenca Centro', direccion: 'Av. Huayna Capac 1-56 y Av. España', ciudad: 'Cuenca', latitud: -2.8974, longitud: -79.0045, horario_apertura: '07:00:00', horario_cierre: '22:00:00', capacidad_muelles: 3 },
      { usuario_id: usuarios[2].id, nombre: 'Farmacia Central - Sucursal Norte', direccion: 'Av. Américas 1-234 y Turuhuaico', ciudad: 'Cuenca', latitud: -2.8701, longitud: -79.0123, horario_apertura: '08:00:00', horario_cierre: '20:00:00', capacidad_muelles: 1 }
    ]);
    console.log(`✅ ${locales.length} locales creados`);

    // VENTANAS HORARIAS
    const ventanas = await VentanaHoraria.bulkCreate([
      // Local 1
      { local_id: locales[0].id, fecha: fecha(0), hora_inicio: '08:00:00', hora_fin: '09:00:00', muelle: 1, estado: 'disponible' },
      { local_id: locales[0].id, fecha: fecha(0), hora_inicio: '09:00:00', hora_fin: '10:00:00', muelle: 1, estado: 'reservada' },
      { local_id: locales[0].id, fecha: fecha(0), hora_inicio: '10:00:00', hora_fin: '11:00:00', muelle: 2, estado: 'disponible' },
      { local_id: locales[0].id, fecha: fecha(1), hora_inicio: '08:00:00', hora_fin: '09:30:00', muelle: 1, estado: 'disponible' },
      { local_id: locales[0].id, fecha: fecha(1), hora_inicio: '10:00:00', hora_fin: '11:00:00', muelle: 2, estado: 'disponible' },
      { local_id: locales[0].id, fecha: fecha(2), hora_inicio: '14:00:00', hora_fin: '15:00:00', muelle: 1, estado: 'disponible' },
      // Local 2
      { local_id: locales[1].id, fecha: fecha(0), hora_inicio: '09:00:00', hora_fin: '10:00:00', muelle: 1, estado: 'disponible' },
      { local_id: locales[1].id, fecha: fecha(1), hora_inicio: '11:00:00', hora_fin: '12:00:00', muelle: 1, estado: 'disponible' }
    ]);
    console.log(`✅ ${ventanas.length} ventanas horarias creadas`);

    // RESERVA con entrega de ejemplo (ventana[1] ya está reservada)
    const reserva = await Reserva.create({
      ventana_id: ventanas[1].id,
      distribuidor_id: usuarios[3].id,
      descripcion_carga: 'Bebidas y lácteos - 200 unidades',
      peso_kg: 450.50,
      num_bultos: 25,
      vehiculo_placa: 'ABC-1234',
      estado: 'confirmada',
      notas: 'Requiere refrigeración'
    });

    const entrega = await Entrega.create({
      reserva_id: reserva.id,
      transportista_id: usuarios[5].id,
      estado: 'en_ruta'
    });
    console.log(`✅ Reserva #${reserva.id} y Entrega #${entrega.id} de ejemplo creadas`);

    console.log('\n🎉 SEED COMPLETADO');
    console.log('═══════════════════════════════════════');
    console.log('CREDENCIALES DE ACCESO:');
    console.log('  Admin:         admin@syncargo.com    / admin123');
    console.log('  Local 1:       local@syncargo.com    / local123');
    console.log('  Local 2:       farmacia@syncargo.com / local123');
    console.log('  Distribuidor:  dist@syncargo.com     / dist123');
    console.log('  Transportista: trans@syncargo.com    / trans123');
    console.log('═══════════════════════════════════════\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err);
    process.exit(1);
  }
}

seed();
