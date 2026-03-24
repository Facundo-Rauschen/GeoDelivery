const http = require('http');
const app = require('./app');
const { init } = require('./src/config/socket');
const { conectarDB, pool } = require('./src/config/db');
const inicializarDB = require('./src/config/dbInit');
const ejecutarSeed = require('./database/seeders/seed');

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

const io = init(server);
app.set('socketio', io);

const bootstrap = async () => {
    try {
        await conectarDB();
        
        await inicializarDB();

        const { rows } = await pool.query('SELECT COUNT(*) FROM depositos');
        const count = parseInt(rows[0].count);

        if (count === 0) {
            console.log("📭 Base de datos vacía. Poblado inicial en marcha...");
            await ejecutarSeed(); 
        } else {
            console.log(`📡 DB detectada con ${count} depósitos. Modo producción/continuidad.`);
        }

        server.listen(PORT, () => {
            console.log(`🚀 Servidor listo en puerto ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
};

bootstrap();