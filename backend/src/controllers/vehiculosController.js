const { pool } = require('../config/db');


// obtiene la flota completa con su ubicación y estado de ruta actual

const getVehiculos = async () => {
    const consulta = `
        SELECT 
            v.id, 
            v.patente, 
            v.modelo, 
            v.esta_activo,
            v.rumbo,
            v.deposito_id,
            d.nombre as nombre_deposito,
            ST_Y(v.ultima_ubicacion::geometry) as lat, 
            ST_X(v.ultima_ubicacion::geometry) as lng,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', pe.id, 
                            'nombre', pe.nombre
                        ) ORDER BY pr.orden_visita
                    )
                    FROM paradas_ruta pr
                    JOIN puntos_entrega pe ON pr.punto_entrega_id = pe.id
                    JOIN hojas_ruta hr ON pr.hoja_ruta_id = hr.id
                    WHERE hr.vehiculo_id = v.id 
                    AND hr.estado = 'EN_CURSO'
                ), 
                '[]'
            ) as paradas_actuales,
            (
                SELECT hr.estado 
                FROM hojas_ruta hr 
                WHERE hr.vehiculo_id = v.id 
                AND hr.estado = 'EN_CURSO' 
                LIMIT 1
            ) as estado_ruta
        FROM vehiculos v
        LEFT JOIN depositos d ON v.deposito_id = d.id
        ORDER BY v.id ASC;
    `;

    const { rows } = await pool.query(consulta);
    return rows;
};

/**
 * Registra un nuevo vehículo asignándole la ubicación de su depósito por defecto
 */
const crearVehiculo = async (patente, modelo, deposito_id) => {
    const consulta = `
        INSERT INTO vehiculos (patente, modelo, deposito_id, ultima_ubicacion)
        VALUES (
            $1, 
            $2, 
            $3, 
            COALESCE(
                (SELECT ubicacion::geography FROM depositos WHERE id = $3), 
                ST_SetSRID(ST_MakePoint(-58.3816, -34.6037), 4326)::geography
            )
        )
        RETURNING id, patente, modelo, esta_activo, deposito_id;
    `;
    
    const { rows } = await pool.query(consulta, [
        patente.toUpperCase().trim(), 
        modelo.trim(), 
        deposito_id || null
    ]);
    
    return rows[0];
};

const asignarDeposito = async (vehiculoId, depositoId) => {
    // 1. Importación dinámica para limpiar el mapa después de moverlo
    const tracking = require('../controllers/trackingController');

    const consulta = `
        UPDATE vehiculos v
        SET 
            deposito_id = $1,
            ultima_ubicacion = d.ubicacion, -- Aquí ocurre el "salto" físico en el mapa
            rumbo = 0                      -- Reseteamos la rotación del ícono
        FROM depositos d
        WHERE v.id = $2 AND d.id = $1
        RETURNING v.id, v.patente, ST_Y(v.ultima_ubicacion::geometry) as lat, ST_X(v.ultima_ubicacion::geometry) as lng;
    `;

    const resultado = await pool.query(consulta, [depositoId, vehiculoId]);

    if (resultado.rowCount === 0) {
        throw new Error("Vehículo o Depósito no encontrado");
    }

    if (tracking && typeof tracking.reiniciarSimulacion === 'function') {
        await tracking.reiniciarSimulacion();
        console.log(`--- 📍 LOG: Vehículo ${vehiculoId} movido al depósito ${depositoId} ---`);
    }

    return resultado.rows[0];
};

const eliminarVehiculo = async (id) => {

    await pool.query('DELETE FROM paradas_ruta WHERE hoja_ruta_id IN (SELECT id FROM hojas_ruta WHERE vehiculo_id = $1)', [id]);
    await pool.query('DELETE FROM hojas_ruta WHERE vehiculo_id = $1', [id]);

    const result = await pool.query('DELETE FROM vehiculos WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
        throw new Error("Vehículo no encontrado");
    }

    return result.rows[0];
};

module.exports = {
    getVehiculos,
    crearVehiculo,
    asignarDeposito,
    eliminarVehiculo
};