const express = require('express');
const router = express.Router();
const { getVehiculos, crearVehiculo, asignarDeposito,eliminarVehiculo } = require('../controllers/vehiculosController');

// GET: /api/v1/vehiculos
router.get('/', async (req, res) => {
    try {
        const flota = await getVehiculos();
        res.status(200).json(flota);
    } catch (error) {
        console.error("❌ Error en Router Vehículos (GET):", error.message);
        res.status(500).json({ error: "Error al obtener la flota de vehículos" });
    }
});

// POST: /api/v1/vehiculos
router.post('/', async (req, res) => {
    const { patente, modelo, deposito_id } = req.body;

    // 1. Validación de datos obligatorios
    if (!patente || !modelo) {
        return res.status(400).json({ error: "La patente y el modelo son obligatorios" });
    }

    // 2. Validación de formato de patente (3 letras - 3 letras)
    const patenteRegex = /^[a-zA-Z]{3}-[a-zA-Z]{3}$/;
    
    if (!patenteRegex.test(patente)) {
        return res.status(400).json({ 
            error: "Formato de patente inválido. Debe ser: AAA-BBB" 
        });
    }

    try {
        const patenteNormalizada = patente.toUpperCase();

        const nuevoVehiculo = await crearVehiculo(patenteNormalizada, modelo, deposito_id);
        
        res.status(201).json({
            mensaje: "Vehículo registrado con éxito",
            vehiculo: nuevoVehiculo
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: "Esa patente ya se encuentra registrada" });
        }
        
        console.error("❌ Error en Router Vehículos (POST):", error.message);
        res.status(500).json({ error: "Error interno al registrar el vehículo" });
    }
});

// PATCH: /api/v1/vehiculos/:id/deposito
// Permite asignar o cambiar el depósito de un vehículo existente
router.patch('/:id/deposito', async (req, res) => {
    const { id } = req.params;
    const { deposito_id } = req.body;

    if (!deposito_id) {
        return res.status(400).json({ error: "El id del depósito es obligatorio" });
    }

    try {
        const vehiculoActualizado = await asignarDeposito(id, deposito_id);
        
        res.status(200).json({
            mensaje: "Depósito asignado correctamente",
            vehiculo: vehiculoActualizado
        });
    } catch (error) {
        console.error("❌ Error en Router Vehículos (PATCH):", error.message);
        if (error.message.includes("no encontrado")) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: "Error al asignar el depósito al vehículo" });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await eliminarVehiculo(id);
        
        res.status(200).json({
            mensaje: `Vehículo con ID ${id} eliminado con éxito`
        });
    } catch (error) {
        console.error("❌ Error en Router Vehículos (DELETE):", error.message);

        if (error.message.includes("no encontrado")) {
            return res.status(404).json({ error: error.message });
        }

        res.status(500).json({ 
            error: "Error interno al intentar eliminar el vehículo" 
        });
    }
});

module.exports = router;