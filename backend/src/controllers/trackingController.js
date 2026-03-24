const { pool } = require('../config/db');
const { getIO } = require('../config/socket');
const { estaActiva, detener, iniciar } = require('../config/estadoSimulacion');
const redis = require('../config/redis');
const { procesarUbicacion } = require('../services/geoService');
const axios = require('axios');

const getPuntosEntrega = async () => {
    const query = `
        SELECT id, nombre, 
               ST_Y(ubicacion::geometry) as lat, 
               ST_X(ubicacion::geometry) as lng 
        FROM puntos_entrega`;
    const { rows } = await pool.query(query);
    return rows;
};

const getUltimaUbicacion = async (id) => {
    const query = `
        SELECT id, patente, modelo, rumbo,
               ST_Y(ultima_ubicacion::geometry) as lat, 
               ST_X(ultima_ubicacion::geometry) as lng 
        FROM vehiculos WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
};

const getHistorialVehiculo = async (id) => {
    const query = `
        SELECT ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng 
        FROM historial_gps WHERE vehiculo_id = $1 
        ORDER BY fecha_creacion ASC LIMIT 100`;
    const { rows } = await pool.query(query, [id]);
    return rows;
};

const actualizarUbicacion = async (data) => {
    const { vehiculo_id, lat, lng, velocidad, rumbo, hoja_ruta_id } = data;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `UPDATE vehiculos SET ultima_ubicacion = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, rumbo = $3 WHERE id = $4`,
            [lng, lat, rumbo || 0, vehiculo_id]
        );
        await client.query(
            `INSERT INTO historial_gps (vehiculo_id, hoja_ruta_id, geom, velocidad, rumbo)
             VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6)`,
            [vehiculo_id, hoja_ruta_id, lng, lat, velocidad, rumbo]
        );
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

// --- LÓGICA DE SIMULACIÓN ---

const ejecutarCicloVehiculo = async (vehiculoId) => {
    const io = getIO();

    try {
        // 1. OBTENER PATENTE AL INICIO
        const resV = await pool.query("SELECT patente FROM vehiculos WHERE id = $1", [vehiculoId]);
        if (resV.rows.length === 0) return;
        const patente = resV.rows[0].patente.trim(); // Limpiamos espacios

        console.log(`🚀 Despachando unidad: ${patente}`);

        while (estaActiva()) {
            // 2. BUSCAR SIGUIENTE PARADA PENDIENTE
            let { rows } = await pool.query(`
                SELECT ST_X(v.ultima_ubicacion::geometry) as start_lng, ST_Y(v.ultima_ubicacion::geometry) as start_lat,
                       ST_X(p.ubicacion::geometry) as end_lng, ST_Y(p.ubicacion::geometry) as end_lat,
                       pr.id as parada_id, 'CLIENTE' as tipo_destino
                FROM vehiculos v
                JOIN hojas_ruta hr ON hr.vehiculo_id = v.id
                JOIN paradas_ruta pr ON pr.hoja_ruta_id = hr.id
                JOIN puntos_entrega p ON p.id = pr.punto_entrega_id
                WHERE v.id = $1 AND hr.estado = 'EN_CURSO' AND pr.estado_entrega = 'PENDIENTE'
                ORDER BY pr.orden_visita ASC LIMIT 1`, [vehiculoId]);

            let esRegresoABase = false;

            // 3. SI NO HAY PARADAS, VOLVER AL DEPÓSITO
            if (rows.length === 0) {
                const resDeposito = await pool.query(`
                    SELECT ST_X(v.ultima_ubicacion::geometry) as start_lng, ST_Y(v.ultima_ubicacion::geometry) as start_lat,
                           ST_X(d.ubicacion::geometry) as end_lng, ST_Y(d.ubicacion::geometry) as end_lat,
                           'DEPOSITO' as tipo_destino
                    FROM vehiculos v
                    JOIN depositos d ON d.id = v.deposito_id
                    WHERE v.id = $1`, [vehiculoId]);

                if (resDeposito.rows.length === 0) break;

                const d = resDeposito.rows[0];
                const distAlPuntoFinal = Math.sqrt(Math.pow(d.start_lng - d.end_lng, 2) + Math.pow(d.start_lat - d.end_lat, 2));

                // Si ya estamos "encima" del depósito (rango muy corto aquí porque ya terminó el viaje)
                if (distAlPuntoFinal < 0.0002) {

                    await pool.query(
                        "UPDATE hojas_ruta SET estado = 'COMPLETADO' WHERE vehiculo_id = $1 AND estado = 'EN_CURSO'",
                        [vehiculoId]
                    );

                    io.emit('tracking:update', {
                        vehiculo_id: vehiculoId,
                        patente: patente,
                        lat: d.end_lat,
                        lng: d.end_lng,
                        evento: '🏠 Volvió al depósito'
                    });

                    console.log(`✅ Unidad ${patente} finalizó.`);

                    const { rows: activos } = await pool.query(
                        "SELECT id FROM hojas_ruta WHERE estado = 'EN_CURSO'"
                    );

                    if (activos.length === 0) {
                        console.log("🏁 Flota completa. Iniciando limpieza automática de tableros...");

                        setTimeout(async () => {
                            await reiniciarSimulacion();
                        }, 2000);
                    }
                    break;
                }

                rows = resDeposito.rows;
                esRegresoABase = true;
            }

            const trayecto = rows[0];

            try {
                const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${trayecto.start_lng},${trayecto.start_lat};${trayecto.end_lng},${trayecto.end_lat}?overview=full&geometries=geojson`;
                const response = await axios.get(osrmUrl);

                if (!response.data.routes[0]) break;
                const coords = response.data.routes[0].geometry.coordinates;

                //  BUCLE DE MOVIMIENTO
                for (let i = 0; i < coords.length; i++) {
                    if (!estaActiva()) return;

                    const [lng, lat] = coords[i];
                    const resultado = await procesarUbicacion(vehiculoId, lat, lng, 0);

                    let mensajeEvento = resultado.evento || '🚚 En camino...';

                    if (esRegresoABase) {
                        const distActualAlDeposito = Math.sqrt(
                            Math.pow(lng - trayecto.end_lng, 2) +
                            Math.pow(lat - trayecto.end_lat, 2)
                        );

                        // RANGO AUMENTADO: 0.001 (Aprox 100 metros)
                        // O si es uno de los últimos 3 puntos de la ruta
                        if (distActualAlDeposito < 0.001 || i >= coords.length - 3) {
                            mensajeEvento = '🏠 Volvió al depósito';
                        } else {
                            mensajeEvento = '🏁 Regresando a base...';
                        }
                    }

                    io.emit('tracking:update', {
                        vehiculo_id: vehiculoId,
                        patente: patente,
                        lat,
                        lng,
                        evento: mensajeEvento
                    });

                    await new Promise(r => setTimeout(r, 600));
                }

                if (!esRegresoABase && trayecto.parada_id) {
                    await pool.query("UPDATE paradas_ruta SET estado_entrega = 'ENTREGADO' WHERE id = $1", [trayecto.parada_id]);
                }

            } catch (err) {
                console.error(`❌ Error en trayecto de ${patente}:`, err.message);
                break;
            }
        }
    } catch (error) {
        console.error("❌ Error crítico:", error.message);
    }
};

const reiniciarSimulacion = async () => {
    //  Detener el motor de simulación para que no se creen nuevos puntos
    detener();
    const io = getIO();

    //  Tiempo de espera (1.2s) para asegurar que los bucles activos mueran
    await new Promise(resolve => setTimeout(resolve, 1200));

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("🧹 Limpiando historial y reubicando flota...");


        await client.query('TRUNCATE TABLE registros_entrega, historial_gps RESTART IDENTITY CASCADE');


        await client.query(`UPDATE paradas_ruta SET estado_entrega = 'PENDIENTE'`);
        await client.query(`UPDATE hojas_ruta SET estado = 'EN_CURSO'`);

        //  MOVER VEHÍCULOS AL DEPÓSITO Y CAPTURAR COORDENADAS
        const { rows: vehiculosReubicados } = await client.query(`
            UPDATE vehiculos v
            SET ultima_ubicacion = d.ubicacion, 
                rumbo = 0
            FROM depositos d
            WHERE v.deposito_id = d.id
            RETURNING v.id as vehiculo_id, 
                      ST_Y(d.ubicacion::geometry) as lat, 
                      ST_X(d.ubicacion::geometry) as lng
        `);

        await client.query('COMMIT');


        vehiculosReubicados.forEach(v => {
            io.emit('tracking:update', {
                vehiculo_id: v.vehiculo_id,
                lat: v.lat,
                lng: v.lng,
                evento: 'Regreso a Base (Limpio)',
                rumbo: 0,
                velocidad: 0,
                historial: [] 
            });
        });

        const keys = await redis.keys('status:vehiculo:*');
        if (keys.length > 0) await redis.del(keys);

        iniciar();

        console.log(`✅ Simulación reiniciada. ${vehiculosReubicados.length} camiones en base.`);
        return { exito: true };

    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error("❌ Error en reiniciarSimulacion:", e.message);
        throw e;
    } finally {
        client.release();
    }
};

module.exports = {
    getPuntosEntrega,
    getUltimaUbicacion,
    getHistorialVehiculo,
    actualizarUbicacion,
    ejecutarCicloVehiculo,
    reiniciarSimulacion
};