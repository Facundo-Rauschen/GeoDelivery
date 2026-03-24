const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { 
    getPuntosEntrega, getUltimaUbicacion, getHistorialVehiculo, 
    actualizarUbicacion, ejecutarCicloVehiculo, reiniciarSimulacion
} = require('../controllers/trackingController');


// GET: Puntos de entrega
router.get('/puntos', async (req, res) => {
    try {
        const puntos = await getPuntosEntrega();
        res.status(200).json(puntos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los puntos" });
    }
});

// GET: Última posición de un vehículo
router.get('/vehiculo/:id/ultima', async (req, res) => {
    try {
        const vehiculo = await getUltimaUbicacion(req.params.id);
        if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });
        res.status(200).json(vehiculo);
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// GET: Historial (Polyline)
router.get('/vehiculo/:id/historial', async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ error: "ID de vehículo inválido" });
    try {
        const historial = await getHistorialVehiculo(id);
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Actualizar ubicación manualmente
router.post('/actualizar', async (req, res) => {
    try {
        await actualizarUbicacion(req.body);
        res.status(200).json({ estado: 'éxito' });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar telemetría" });
    }
});

// POST: Iniciar simulación de flota
router.post('/simular', async (req, res) => {
    try {
        const { rows: flota } = await pool.query(`
            SELECT DISTINCT v.id, v.patente 
            FROM vehiculos v
            JOIN hojas_ruta hr ON hr.vehiculo_id = v.id
            JOIN paradas_ruta pr ON pr.hoja_ruta_id = hr.id
            WHERE hr.estado = 'EN_CURSO' AND pr.estado_entrega = 'PENDIENTE'
        `);


        if (flota.length === 0) {
            return res.status(200).json({ 
                mensaje: "No hay rutas pendientes para simular en este momento.",
                vehiculos_iniciados: [] 
            });
        }

        res.json({ 
            mensaje: `Simulación iniciada para ${flota.length} vehículos.`,
            vehiculos: flota.map(v => v.patente) // Enviamos las patentes que empezaron
        });


        flota.forEach(v => {
            console.log(`🚚 Despachando unidad: ${v.patente} (ID: ${v.id})`);
            ejecutarCicloVehiculo(v.id); 
        });

    } catch (error) {
        console.error("❌ Fallo en la ruta /simular:", error.message);
        res.status(500).json({ error: "Fallo interno en el motor de simulación" });
    }
});

// POST: Reiniciar toda la base de datos (Reset)
router.post('/reiniciar', async (req, res) => {
    try {
        await reiniciarSimulacion();

        // Limpiamos headers para asegurar una respuesta limpia
        if (!res.headersSent) {
            return res.status(200).json({ 
                estado: 'éxito', 
                mensaje: 'Base de datos de simulación reseteada correctamente' 
            });
        }
    } catch (error) {
        console.error("❌ Error en ruta /reiniciar:", error.message);
        if (!res.headersSent) {
            return res.status(500).json({ 
                estado: 'error', 
                mensaje: "No se pudo reiniciar la simulación" 
            });
        }
    }
});

module.exports = router;