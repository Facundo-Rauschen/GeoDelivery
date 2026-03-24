const express = require('express');
const router = express.Router();
const { getDepositos, crearDeposito, eliminarDeposito } = require('../controllers/depositoController');

// GET: /api/v1/depositos
router.get('/', async (req, res) => {
    try {
        const depositos = await getDepositos();
        res.status(200).json(depositos);
    } catch (err) {
        console.error("❌ Error en Router GET:", err.message);
        res.status(500).json({ error: "Error al obtener los depósitos" });
    }
});

// POST: /api/v1/depositos
router.post('/', async (req, res) => {
    const { nombre, direccion, lat, lng } = req.body;

    if (!nombre || lat === undefined || lng === undefined) {
        return res.status(400).json({ error: "Faltan datos obligatorios (nombre, lat, lng)" });
    }

    try {
        const nuevoDeposito = await crearDeposito(nombre, direccion, lat, lng);
        res.status(201).json(nuevoDeposito);
    } catch (err) {
        console.error("❌ Error en Router POST:", err.message);
        res.status(500).json({ error: "Error interno al crear depósito" });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await eliminarDeposito(id);
        res.status(200).json({ mensaje: "Depósito eliminado con éxito" });

    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ 
                error: "No se puede eliminar el depósito",
                detalle: "Este depósito tiene vehículos asignados. Debes mover los vehículos a otro depósito o quitarlos antes de borrar la base."
            });
        }

        if (err.code === 'NOT_FOUND') {
            return res.status(404).json({ error: err.message });
        }

        console.error("❌ Error inesperado:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;