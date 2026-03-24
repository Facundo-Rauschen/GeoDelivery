const { pool } = require('../config/db');

const getDepositos = async () => {
    const query = `
        SELECT 
            id, 
            nombre, 
            direccion,
            ST_Y(ubicacion::geometry) as lat, 
            ST_X(ubicacion::geometry) as lng,
            fecha_creacion
        FROM depositos
        ORDER BY nombre ASC;
    `;
    
    const { rows } = await pool.query(query);
    return rows; 
};

const crearDeposito = async (nombre, direccion, lat, lng) => {
    const query = `
        INSERT INTO depositos (nombre, direccion, ubicacion)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography)
        RETURNING id, nombre, ST_Y(ubicacion::geometry) as lat, ST_X(ubicacion::geometry) as lng;
    `;
    
    const { rows } = await pool.query(query, [nombre, direccion, lat, lng]);
    return rows[0]; 
};

const eliminarDeposito = async (id) => {
    const result = await pool.query(
        'DELETE FROM depositos WHERE id = $1 RETURNING *', 
        [id]
    );

    if (result.rowCount === 0) {
        const error = new Error("Depósito no encontrado");
        error.code = 'NOT_FOUND';
        throw error;
    }

    return result.rows[0];
};

module.exports = { getDepositos, crearDeposito, eliminarDeposito };