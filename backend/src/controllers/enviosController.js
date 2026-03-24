const { pool } = require('../config/db');


const asignarEnvios = async (vehiculo_id, puntos_ids) => {
    let cliente;
    try {
        cliente = await pool.connect();
        await cliente.query('BEGIN');

        for (let p_id of puntos_ids) {
            await cliente.query(
                `DELETE FROM paradas_ruta 
                 WHERE punto_entrega_id = $1 
                 AND estado_entrega = 'PENDIENTE'`,
                [p_id]
            );

        }

        const resRuta = await cliente.query(
            `INSERT INTO hojas_ruta (vehiculo_id, estado, fecha_creacion) 
             VALUES ($1, 'EN_CURSO', CURRENT_TIMESTAMP) RETURNING id`,
            [vehiculo_id]
        );
        const hojaRutaId = resRuta.rows[0].id;

        for (let i = 0; i < puntos_ids.length; i++) {
            await cliente.query(
                `INSERT INTO paradas_ruta (hoja_ruta_id, punto_entrega_id, orden_visita, estado_entrega) 
                 VALUES ($1, $2, $3, 'PENDIENTE')`,
                [hojaRutaId, puntos_ids[i], i + 1]
            );
        }

        await cliente.query('COMMIT');
        return hojaRutaId;
    } catch (error) {
        if (cliente) await cliente.query('ROLLBACK');
        console.error("Error en asignarEnvios:", error.message);
        throw error;
    } finally {
        if (cliente) cliente.release();
    }
};

/**
 * Obtiene las hojas de ruta con sus paradas anidadas
 * @returns {Promise<Array>}
 */
const listarEnviosActivos = async () => {
    const query = `
        SELECT 
            hr.id, 
            hr.vehiculo_id, 
            hr.estado,
            COALESCE(
                (SELECT json_agg(pr) 
                 FROM paradas_ruta pr 
                 WHERE pr.hoja_ruta_id = hr.id), 
                '[]'
            ) as paradas
        FROM hojas_ruta hr
        WHERE hr.estado = 'EN_CURSO';
    `;

    const { rows } = await pool.query(query);
    return rows;
};

const quitarPuntoDeRuta = async (puntoId) => {
    let cliente;
    try {
        cliente = await pool.connect();
        await cliente.query('BEGIN');

        await cliente.query(
            `DELETE FROM paradas_ruta 
             WHERE punto_entrega_id = $1 
             AND estado_entrega = 'PENDIENTE'`,
            [puntoId]
        );


        await cliente.query('COMMIT');
        return true;
    } catch (error) {
        if (cliente) await cliente.query('ROLLBACK');
        console.error("Detalle del error en DB:", error.message);
        throw error;
    } finally {
        if (cliente) cliente.release();
    }
};

module.exports = { asignarEnvios, listarEnviosActivos, quitarPuntoDeRuta };