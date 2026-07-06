// Configuración del pool de conexiones a MySQL
// Se reutiliza en todos los modelos para evitar abrir una conexión por consulta

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'syncargo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // evita conversiones automáticas de fechas a objetos Date con zona horaria
});

// Verifica la conexión al iniciar el servidor
async function verificarConexion() {
  try {
    const conn = await pool.getConnection();
    console.log('Conexión a MySQL establecida correctamente');
    conn.release();
  } catch (error) {
    console.error('Error al conectar con MySQL:', error.message);
    process.exit(1);
  }
}

module.exports = { pool, verificarConexion };
