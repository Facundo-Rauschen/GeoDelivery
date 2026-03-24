const db = require('../../src/config/db');

const seedData = async () => {
    if (!db || !db.pool) {
        console.error("❌ Error: No se pudo cargar el pool.");
        return;
    }

    const pool = db.pool;
    let client;

    try {
        client = await pool.connect();

        console.log("🧹 Limpiando base de datos (incluyendo depósitos)...");
        client = await pool.connect();

        console.log("🌱 Iniciando Seeder con Depósitos Logísticos...");

        const depositosDef = [
            { nombre: 'Depósito Norte - Retiro', lat: -34.5910, lng: -58.3740 },
            { nombre: 'Depósito Sur - Barracas', lat: -34.6450, lng: -58.3800 },
            { nombre: 'Depósito Oeste - Liniers', lat: -34.6420, lng: -58.5240 }
        ];

        const depositoIds = [];
        for (const d of depositosDef) {
            const res = await client.query(
                `INSERT INTO depositos (nombre, ubicacion) 
                 VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography) RETURNING id`,
                [d.nombre, d.lat, d.lng]
            );
            depositoIds.push(res.rows[0].id);
        }

        const puntosDef = [
            { nombre: 'Punto 1: Obelisco', lat: -34.6037, lng: -58.3816 },
            { nombre: 'Punto 2: Plaza de Mayo', lat: -34.6083, lng: -58.3712 },
            { nombre: 'Punto 3: Puerto Madero', lat: -34.6117, lng: -58.3647 },
            { nombre: 'Punto 4: Congreso', lat: -34.6097, lng: -58.3926 },
            { nombre: 'Punto 5: Facultad de Derecho', lat: -34.5831, lng: -58.3921 },
            { nombre: 'Punto 6: Planetario', lat: -34.5696, lng: -58.4116 }
        ];

        const puntosIds = [];
        for (const p of puntosDef) {
            const res = await client.query(
                `INSERT INTO puntos_entrega (nombre, ubicacion) 
                 VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography) RETURNING id`,
                [p.nombre, p.lat, p.lng]
            );
            puntosIds.push(res.rows[0].id);
        }

        // Vehículos vinculados a sus respectivos Depósitos
        const configVehiculos = [
            {
                id: 1, patente: 'AAA-111', modelo: 'Camioneta A',
                deposito_id: depositoIds[0], 
                paradas: [puntosIds[0], puntosIds[1]]
            },
            {
                id: 2, patente: 'BBB-222', modelo: 'Furgón B',
                deposito_id: depositoIds[1], 
                paradas: [puntosIds[2]]
            },
            {
                id: 3, patente: 'CCC-333', modelo: 'Moto C',
                deposito_id: depositoIds[2],
                paradas: [puntosIds[3], puntosIds[4], puntosIds[5]]
            }
        ];

        for (const v of configVehiculos) {
            const depRes = await client.query(`SELECT ubicacion FROM depositos WHERE id = $1`, [v.deposito_id]);
            const ubicacionBase = depRes.rows[0].ubicacion;

            //  JITTER: Pequeño movimiento aleatorio para que no se encimen si hay varios en un depósito
            const jitterLat = (Math.random() - 0.5) * 0.0002;
            const jitterLng = (Math.random() - 0.5) * 0.0002;

            await client.query(
                `INSERT INTO vehiculos (id, patente, modelo, deposito_id, ultima_ubicacion) 
                 VALUES ($1, $2, $3, $4, 
                    ST_SetSRID(ST_MakePoint(
                        ST_X($5::geometry) + $6, 
                        ST_Y($5::geometry) + $7
                    ), 4326)::geography
                 )`,
                [v.id, v.patente, v.modelo, v.deposito_id, ubicacionBase, jitterLng, jitterLat]
            );

            const resRuta = await client.query(
                `INSERT INTO hojas_ruta (vehiculo_id, estado) VALUES ($1, 'EN_CURSO') RETURNING id`,
                [v.id]
            );
            const rutaId = resRuta.rows[0].id;

            for (let i = 0; i < v.paradas.length; i++) {
                await client.query(
                    `INSERT INTO paradas_ruta (hoja_ruta_id, punto_entrega_id, orden_visita, estado_entrega) 
                     VALUES ($1, $2, $3, 'PENDIENTE')`,
                    [rutaId, v.paradas[i], i + 1]
                );
            }
            console.log(`✅ Vehículo ${v.id} (${v.patente}) asignado al Depósito ${v.deposito_id}.`);
        }

        //  Sincronización de secuencias
        await client.query("SELECT setval('vehiculos_id_seq', (SELECT MAX(id) FROM vehiculos))");
        await client.query("SELECT setval('puntos_entrega_id_seq', (SELECT MAX(id) FROM puntos_entrega))");
        await client.query("SELECT setval('depositos_id_seq', (SELECT MAX(id) FROM depositos))");

        console.log("\n🚀 Seeder finalizado con éxito.");

    } catch (err) {
        console.error("❌ Error en seeding:", err.stack);
    } finally {
        if (client) client.release();
    }
};

module.exports = seedData;