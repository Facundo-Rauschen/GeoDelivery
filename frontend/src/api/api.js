import axios from 'axios';

/**
 * Configuración base de Axios
 */
const api = axios.create({
    baseURL: 'http://localhost:3001/api/v1',
    timeout: 5000,
});

/**
 * INTERCEPTOR DE RESPUESTA
 */
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error(`❌ Error API [${error.config?.url}]:`, error.message);
        return Promise.reject(error);
    }
);

/**
 * --- MÓDULO: VEHÍCULOS ---
 */
export const getVehiculos = () => api.get('/vehiculos');
export const postVehiculo = (vehiculoData) => api.post('/vehiculos', vehiculoData);
export const deleteVehiculo = (id) => api.delete(`/vehiculos/${id}`);
export const asignarVehiculoADeposito = (vehiculoId, depositoId) => 
    api.patch(`/vehiculos/${vehiculoId}/deposito`, { deposito_id: depositoId });

/**
 * --- MÓDULO: DEPÓSITOS (BASES) ---
 */
export const getDepositos = () => api.get('/depositos').catch(() => []);
export const postDeposito = (depositoData) => api.post('/depositos', depositoData);
export const deleteDeposito = (id) => api.delete(`/depositos/${id}`); 

/**
 * --- MÓDULO: PUNTOS DE ENTREGA / CONTROL ---
 */
export const getPuntosEntrega = () => api.get('/puntos-entrega').catch(() => []);
export const postPuntoEntrega = (puntoData) => api.post('/puntos-entrega', puntoData);
export const deletePuntoEntrega = (id) => api.delete(`/puntos-entrega/${id}`); 
export const getPuntosDisponibles = () => api.get('/puntos-entrega/disponibles').catch(() => []);


/**
 * --- MÓDULO: SEGUIMIENTO (TRACKING) ---
 */
export const getLatestLocation = (id) => api.get(`/tracking/vehiculo/${id}/ultima`);
export const getHistorialVehiculo = (id) => api.get(`/tracking/vehiculo/${id}/historial`).catch(() => []);
export const iniciarSimulacion = () => api.post('/tracking/simular');
export const reiniciarSimulacion = () => api.post('/tracking/reiniciar').catch(() => ({ status: 'error' }));

/**
 * --- MÓDULO: ENVÍOS ---
 */
export const getEnvios = () => api.get('/envios').catch(() => []);
export const asignarEnvios = (vehiculoId, listaPuntosIds) => 
    api.post('/envios', {
        vehiculo_id: vehiculoId,
        puntos_ids: listaPuntosIds
    });
export const getHojasRuta = () => api.get('/envios');
export const quitarPuntoEntregaDeVehiculo = (puntoId) => 
    api.delete(`/envios/puntos/${puntoId}`);