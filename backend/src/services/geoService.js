const redis = require('../config/redis');
const { pool } = require('../config/db');
const { calculateDistance } = require('../utils/haversine');

const RADIO_GEOFENCE_METROS = 100;

async function procesarUbicacion(vehiculoId, lat, lng, heading) {
    if (lat === undefined || lng === undefined || vehiculoId === undefined) {
        return { error: true, mensaje: "Datos incompletos" };
    }

    try {
        //  Actualizar vehículo y Rumbo (Sin transacción pesada para mayor velocidad)
        // Usamos una consulta directa ya que el 'historial' es lo que importa para el track
        await pool.query(`
            UPDATE vehiculos 
            SET ultima_ubicacion = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                rumbo = $3
            WHERE id = $4`, 
            [lng, lat, heading || 0, vehiculoId]
        );

        //  Insertar Telemetría (Historial)
        await pool.query(
            `INSERT INTO historial_gps (vehiculo_id, geom, velocidad, rumbo) 
             VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5)`,
            [vehiculoId, lng, lat, 40, heading || 0]
        );

        //  Buscar la parada PENDIENTE más cercana/actual
        const puntoQuery = `
            SELECT p.id, p.nombre, ST_X(p.ubicacion::geometry) as lng, ST_Y(p.ubicacion::geometry) as lat
            FROM puntos_entrega p
            JOIN paradas_ruta pr ON pr.punto_entrega_id = p.id
            JOIN hojas_ruta hr ON hr.id = pr.hoja_ruta_id
            WHERE hr.vehiculo_id = $1 
              AND hr.estado = 'EN_CURSO' 
              AND pr.estado_entrega = 'PENDIENTE'
            ORDER BY pr.orden_visita ASC LIMIT 1;
        `;
        const resPunto = await pool.query(puntoQuery, [vehiculoId]);

        // Si no hay paradas pendientes, devolvemos info neutra (el camión solo se mueve)
        if (resPunto.rows.length === 0) {
            return { distancia: null, evento: null };
        }

        const punto = resPunto.rows[0];
        const distancia = calculateDistance(lat, lng, punto.lat, punto.lng);
        const estaCerca = distancia <= RADIO_GEOFENCE_METROS;

        // Máquina de Estados con Redis
        const redisKey = `status:vehiculo:${vehiculoId}:punto:${punto.id}`;
        const estadoAnterior = await redis.get(redisKey);

        let evento = null;

        if (estaCerca && estadoAnterior !== 'IN') {
            evento = 'ENTER_STORE';
            await redis.set(redisKey, 'IN');
            
            //  Registrar evento y marcar como ENTREGADO en la DB
            await pool.query(
                `INSERT INTO registros_entrega (vehiculo_id, punto_entrega_id, tipo_evento, geom) 
                 VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)`,
                [vehiculoId, punto.id, evento, lng, lat]
            );

            // Actualizamos la parada a entregada automáticamente
            await pool.query(`
                UPDATE paradas_ruta 
                SET estado_entrega = 'ENTREGADO' 
                WHERE punto_entrega_id = $1 
                AND hoja_ruta_id = (SELECT id FROM hojas_ruta WHERE vehiculo_id = $2 AND estado = 'EN_CURSO' LIMIT 1)`,
                [punto.id, vehiculoId]
            );
            
            console.log(`✅ [GEOFENCE] Vehículo ${vehiculoId} llegó a ${punto.nombre}`);

        } else if (!estaCerca && estadoAnterior === 'IN') {
            evento = 'EXIT_STORE';
            await redis.set(redisKey, 'OUT');
            
            await pool.query(
                `INSERT INTO registros_entrega (vehiculo_id, punto_entrega_id, tipo_evento, geom) 
                 VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)`,
                [vehiculoId, punto.id, evento, lng, lat]
            );
        }

        return { distancia: Math.round(distancia), evento };

    } catch (error) {
        console.error("⚠️ Error en procesarUbicacion:", error.message);
        return { error: true, detalle: error.message };
    }
}

module.exports = { procesarUbicacion };