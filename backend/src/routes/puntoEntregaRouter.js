const express = require('express');
const router = express.Router();
const {
    crearPuntoEntrega,
    obtenerPuntosEntrega,
    obtenerPuntoPorId,
    obtenerPuntosDisponibles,
    eliminarPuntoEntrega
} = require('../controllers/puntoEntregaController');

// POST: Crear punto de entrega
router.post('/', async (req, res) => {
    const { nombre, lat, lng } = req.body;

    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ error: "El nombre del punto es obligatorio" });
    }

    if (lat === undefined || lng === undefined || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        return res.status(400).json({ error: "La latitud y longitud son obligatorias y deben ser números" });
    }

    try {
        const nuevoPunto = await crearPuntoEntrega(nombre, lat, lng);
        
        res.status(201).json({
            mensaje: "Punto de entrega creado exitosamente",
            punto: nuevoPunto
        });
    } catch (err) {
        console.error("❌ Error en el POST de Puntos:", err.message);
        res.status(500).json({ error: "Error interno: " + err.message });
    }
});

// GET: Obtener todos
router.get('/', async (req, res) => {
    try {
        const puntos = await obtenerPuntosEntrega();
        res.status(200).json(puntos);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener puntos" });
    }
});

router.get('/disponibles', async (req, res) => {
    try {
        const puntos = await obtenerPuntosDisponibles();
        res.json(puntos); // Axios e interceptores manejarán el resto
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Obtener por ID
router.get('/:id', async (req, res) => {
    try {
        const punto = await obtenerPuntoPorId(req.params.id);
        if (!punto) {
            return res.status(404).json({ error: "Punto no encontrado" });
        }
        res.status(200).json(punto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const puntoBorrado = await eliminarPuntoEntrega(id);

        res.status(200).json({
            mensaje: "Eliminado con éxito",
            data: puntoBorrado
        });

    } catch (err) {
        console.error("❌ Error en Router DELETE:", err.message);

        if (err.message === "PUNTO_NO_ENCONTRADO") {
            return res.status(404).json({ error: "No existe un punto con ese ID" });
        }

        // Si es un error de clave foránea de Postgres (Código 23503)
        if (err.code === '23503') {
            return res.status(400).json({
                error: "No se puede eliminar: el punto está vinculado a otras operaciones activas.",
                detalle: err.detail
            });
        }

        res.status(500).json({
            error: "Error interno del servidor",
            detalle: err.message
        });
    }
});

router.delete('/puntos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await desvincularPuntoDeRuta(id);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: "No se pudo quitar el punto de la ruta" });
    }
});

module.exports = router;