const { Server } = require('socket.io');

let io;

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // En producción pondrás la URL de tu front (ej: localhost:5173)
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Nuevo cliente conectado: ${socket.id}`);
        
        socket.on('disconnect', () => {
            console.log('❌ Cliente desconectado');
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io no ha sido inicializado");
    }
    return io;
};

module.exports = { init, getIO };