
// función matemática que determinará hacia dónde mira el icono en tu mapa:

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
 * @param {number} lat1 - Latitud del punto origen
 * @param {number} lon1 - Longitud del punto origen
 * @param {number} lat2 - Latitud del punto destino
 * @param {number} lon2 - Longitud del punto destino
 * @returns {number} Distancia en metros
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    
    // Convertir grados a radianes
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    // Fórmula de Haversine
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distancia final en metros
    return Math.round(distance * 100) / 100; // Retorna con 2 decimales
};

/**
 * Determina si un punto está dentro de un radio específico (Geofencing)
 * @param {number} lat1, lon1 - Coordenadas del vehículo
 * @param {number} lat2, lon2 - Coordenadas de la tienda
 * @param {number} radiusInMeters - Radio de exclusión (ej. 100m)
 * @returns {boolean}
 */
const isInsideGeofence = (lat1, lon1, lat2, lon2, radiusInMeters) => {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusInMeters;
};

const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
              Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    
    const theta = Math.atan2(y, x);
    const bearing = (theta * 180 / Math.PI + 360) % 360; 
    
    return Math.round(bearing);
};
module.exports = {
    calculateDistance,
    isInsideGeofence,
    calculateBearing
};