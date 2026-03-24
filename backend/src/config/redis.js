const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('❌ Redis Client Error', err));

const connectRedis = async () => {
    await client.connect();
    console.log('✅ Conectado a Redis para Gestión de Estado');
};

connectRedis();

module.exports = client;