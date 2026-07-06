require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});

// Middlewares globales
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hacer io accesible en controladores
app.set('io', io);

// Rutas
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/usuarios',    require('./routes/usuarios.routes'));
app.use('/api/locales',     require('./routes/locales.routes'));
app.use('/api/ventanas',    require('./routes/ventanas.routes'));
app.use('/api/reservas',    require('./routes/reservas.routes'));
app.use('/api/entregas',    require('./routes/entregas.routes'));
app.use('/api/incidencias', require('./routes/incidencias.routes'));
app.use('/api/dashboard',   require('./routes/dashboard.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

// WebSocket eventos
io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);
  socket.on('join_room', (room) => socket.join(room));
  socket.on('disconnect', () => console.log(`Socket desconectado: ${socket.id}`));
});

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a MySQL establecida');
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    server.listen(PORT, () => console.log(`🚀 Syncargo API corriendo en http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Error al conectar con la base de datos:', err);
    process.exit(1);
  });
