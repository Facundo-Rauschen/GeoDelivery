const { procesarUbicacion } = require('../services/geoService'); // Tu servicio principal
const { calculateBearing } = require('../utils/haversine'); // La función de rumbo

async function simularRecorrido(vehiculoId, origen, destino, pasos = 10) {
    console.log(`🚀 Iniciando viaje del vehículo ${vehiculoId}...`);

    for (let i = 0; i <= pasos; i++) {
        // Calculamos el punto intermedio (Regla de 3 para lat/lng)
        const latActual = origen.lat + (destino.lat - origen.lat) * (i / pasos);
        const lngActual = origen.lng + (destino.lng - origen.lng) * (i / pasos);
        
        // Calculamos hacia donde mira el auto
        const rumbo = calculateBearing(latActual, lngActual, destino.lat, destino.lng);

        // Llamamos a la lógica real
        const resultado = await procesarUbicacion(vehiculoId, latActual, lngActual, rumbo);

        console.log(`📍 Paso ${i}: [${latActual.toFixed(6)}, ${lngActual.toFixed(6)}] | Distancia: ${resultado.distancia}m | Evento: ${resultado.evento || 'Moviéndose'}`);

        // Esperamos 1 segundo entre puntos para simular tiempo real
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("🏁 El vehículo ha llegado al destino.");
}

// EJEMPLO DE USO:
const miAuto = 1;
const puntoA = { lat: -34.6037, lng: -58.3816 }; // Obelisco, BS AS
const puntoB = { lat: -34.6045, lng: -58.3850 }; // Unas cuadras de distancia

simularRecorrido(miAuto, puntoA, puntoB, 15);