const express = require('express');
const router = express.Router();
const { 
    asignarEnvios, 
    listarEnviosActivos, 
    quitarPuntoDeRuta 
} = require('../controllers/enviosController');

router.post('/', async (req, res) => {
    const { vehiculo_id, puntos_ids } = req.body;

    if (!vehiculo_id || !puntos_ids || !Array.isArray(puntos_ids)) {
        return res.status(400).json({ 
            error: "Datos insuficientes: vehiculo_id y puntos_ids (array) son obligatorios." 
        });
    }

    try {

        const hojaRutaId = await asignarEnvios(vehiculo_id, puntos_ids);

        res.status(201).json({ 
            estado: 'exito', 
            envio_id: hojaRutaId,
            mensaje: 'Ruta asignada correctamente'
        });

    } catch (error) {
        
        console.error("❌ Error detallado en router envíos:", error.message);
        res.status(500).json({ 
            error: "Error interno al procesar la asignación de envíos" 
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const envios = await listarEnviosActivos();
        res.status(200).json(envios);
    } catch (error) {
        console.error("❌ Error en Router Envios:", error.message);
        res.status(500).json({ error: "Error al recuperar hojas de ruta" });
    }
});

router.delete('/puntos/:id', async (req, res) => {
    try {
        const { id } = req.params; 
        
        if (!id) return res.status(400).json({ error: "ID de punto requerido" });

        await quitarPuntoDeRuta(id);

        res.status(200).json({ 
            estado: 'exito', 
            mensaje: 'Punto removido de la ruta',
            id_removido: id 
        });
    } catch (error) {
        console.error("❌ Error en DELETE /puntos/:id :", error.message);
        res.status(500).json({ error: "Error al intentar quitar el punto" });
    }
});

module.exports = router;