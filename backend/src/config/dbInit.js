const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

const inicializarTablas = async () => {
  try {
    console.log('⏳ Verificando tablas en la base de datos...');
    
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    
    const checkExt = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'postgis'");
    console.log('🔍 Extensiones activas:', checkExt.rows);

    const sqlPath = path.join(__dirname, '../../database/migrations/init.sql');
    
    if (!fs.existsSync(sqlPath)) {
        throw new Error(`No se encontró el archivo init.sql en: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');


    await pool.query(sql);
    
    console.log('✅ Tablas verificadas/creadas correctamente.');
  } catch (err) {
    console.error('❌ Error al inicializar las tablas:', err.message);
    throw err; 
  }
};

module.exports = inicializarTablas;