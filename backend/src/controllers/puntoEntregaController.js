const { pool } = require('../config/db');

const crearPuntoEntrega = async (nombre, lat, lng) => {
    const query = `
        INSERT INTO puntos_entrega (nombre, ubicacion)
        VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography)    
        RETURNING id, nombre, ST_AsGeoJSON(ubicacion) as ubicacion;
    `;
    const { rows } = await pool.query(query, [nombre, lat, lng]);
    
    return {
        id: rows[0].id,
        nombre: rows[0].nombre,
        ubicacion: JSON.parse(rows[0].ubicacion)
    };
};

const obtenerPuntosEntrega = async () => {
    const query = `
        SELECT 
            p.id, 
            p.nombre, 
            ST_Y(p.ubicacion::geometry) as lat, 
            ST_X(p.ubicacion::geometry) as lng,
            -- Buscamos el vehículo que tiene este punto en una ruta EN_CURSO
            (SELECT hr.vehiculo_id 
             FROM paradas_ruta pr 
             JOIN hojas_ruta hr ON pr.hoja_ruta_id = hr.id 
             WHERE pr.punto_entrega_id = p.id AND hr.estado = 'EN_CURSO' 
             LIMIT 1) as vehiculo_id,
            -- Buscamos la patente de ese vehículo
            (SELECT v.patente 
             FROM paradas_ruta pr 
             JOIN hojas_ruta hr ON pr.hoja_ruta_id = hr.id 
             JOIN vehiculos v ON hr.vehiculo_id = v.id
             WHERE pr.punto_entrega_id = p.id AND hr.estado = 'EN_CURSO' 
             LIMIT 1) as patente_vehiculo
        FROM puntos_entrega p
        ORDER BY p.id ASC;
    `;
    try {
        const { rows } = await pool.query(query);
        return rows;
    } catch (error) {
        console.error("❌ ERROR EN SQL:", error.message);
        throw error;
    }
};

const obtenerPuntoPorId = async (id) => {
    const query = `SELECT id, nombre, ST_AsGeoJSON(ubicacion) as ubicacion FROM puntos_entrega WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) return null;
    
    return { 
        ...rows[0], 
        ubicacion: JSON.parse(rows[0].ubicacion) 
    };
};

const obtenerPuntosDisponibles = async () => {
    const query = `
        SELECT 
            p.id, 
            p.nombre, 
            ST_Y(p.ubicacion::geometry) as lat, 
            ST_X(p.ubicacion::geometry) as lng,
            p.vehiculo_id,
            v.patente AS patente_vehiculo
        FROM puntos_entrega p
        LEFT JOIN vehiculos v ON p.vehiculo_id = v.id
        WHERE NOT EXISTS (
            SELECT 1 
            FROM paradas_ruta pr
            JOIN hojas_ruta hr ON pr.hoja_ruta_id = hr.id
            WHERE pr.punto_entrega_id = p.id
            AND hr.estado = 'EN_CURSO'
        )
        ORDER BY p.id DESC;
    `;
    try {
        const { rows } = await pool.query(query); 
        return rows;
    } catch (error) {
        console.error("❌ ERROR EN obtenerPuntosDisponibles:", error.message);
        throw error; 
    }
};

const desvincularPuntoDeRuta = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const puntoId = parseInt(id, 10);


        await client.query(`
            DELETE FROM paradas_ruta 
            WHERE punto_entrega_id = $1 
            AND hoja_ruta_id IN (SELECT id FROM hojas_ruta WHERE estado = 'EN_CURSO')
        `, [puntoId]);

        await client.query(`
            UPDATE puntos_entrega 
            SET vehiculo_id = NULL 
            WHERE id = $1
        `, [puntoId]);

        await client.query('COMMIT');
        return { success: true, id: puntoId };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ ERROR AL DESVINCULAR PUNTO:", err.message);
        throw err;
    } finally {
        client.release();
    }
};


const eliminarPuntoEntrega = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const puntoId = parseInt(id, 10);

        await client.query('DELETE FROM registros_entrega WHERE punto_entrega_id = $1', [puntoId]);
        await client.query('DELETE FROM paradas_ruta WHERE punto_entrega_id = $1', [puntoId]);

        const result = await client.query(
            'DELETE FROM puntos_entrega WHERE id = $1 RETURNING *',
            [puntoId]
        );

        if (result.rowCount === 0) {
            throw new Error("PUNTO_NO_ENCONTRADO");
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ ERROR REAL EN POSTGRES:", err.message);
        throw err; 
    } finally {
        client.release();
    }
};
module.exports = { 
    crearPuntoEntrega, 
    obtenerPuntosEntrega, 
    obtenerPuntoPorId,
    obtenerPuntosDisponibles,
    eliminarPuntoEntrega,
    desvincularPuntoDeRuta
};