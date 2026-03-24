const express = require('express');
const cors = require('cors');

const trackingRoutes = require('./src/routes/trackingRoutes');
const vehiculoRoutes = require('./src/routes/vehiculosRouter');
const puntosEntregaRouter = require('./src/routes/puntoEntregaRouter'); 
const enviosRouter = require('./src/routes/enviosRouter');
const depositoRoutes = require('./src/routes/depositoRoutes');
const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json());

// DEFINICIÓN DE RUTAS
app.use('/api/v1/tracking', trackingRoutes);        
app.use('/api/v1/vehiculos', vehiculoRoutes);      
app.use('/api/v1/puntos-entrega', puntosEntregaRouter); 
app.use('/api/v1/envios', enviosRouter);           
app.use('/api/v1/depositos', depositoRoutes);

module.exports = app;