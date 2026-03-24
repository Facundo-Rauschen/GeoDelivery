CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Puntos de entrega
CREATE TABLE IF NOT EXISTS puntos_entrega (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion GEOGRAPHY(POINT, 4326) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_puntos_entrega_ubicacion ON puntos_entrega USING GIST (ubicacion);

-- 2. Flota de vehículos
CREATE TABLE IF NOT EXISTS vehiculos(
    id SERIAL PRIMARY KEY,
    patente VARCHAR(20) UNIQUE NOT NULL,
    modelo VARCHAR(50),
    esta_activo BOOLEAN DEFAULT TRUE,
    ultima_ubicacion GEOGRAPHY(POINT, 4326),
    rumbo FLOAT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vehiculos_ubicacion ON vehiculos USING GIST (ultima_ubicacion);

-- 3. Hojas de ruta
CREATE TABLE IF NOT EXISTS hojas_ruta (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER REFERENCES vehiculos(id) ON DELETE CASCADE,
    estado VARCHAR(20) CHECK (estado IN ('EN_CURSO', 'COMPLETADO')) DEFAULT 'EN_CURSO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- 4. Paradas de la ruta
CREATE TABLE IF NOT EXISTS paradas_ruta(
    id SERIAL PRIMARY KEY,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id) ON DELETE CASCADE,
    punto_entrega_id INTEGER REFERENCES puntos_entrega(id) ON DELETE CASCADE,
    orden_visita INTEGER,
    estado_entrega VARCHAR(20) DEFAULT 'PENDIENTE', 
    hora_llegada_estimada TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Historial de recorrido (Telemetría)
CREATE TABLE IF NOT EXISTS historial_gps (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER REFERENCES vehiculos(id) ON DELETE CASCADE,
    hoja_ruta_id INTEGER REFERENCES hojas_ruta(id) ON DELETE SET NULL,
    geom GEOGRAPHY(POINT, 4326) NOT NULL,
    velocidad FLOAT DEFAULT 0,
    rumbo FLOAT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);
CREATE INDEX IF NOT EXISTS idx_historial_gps_ruta ON historial_gps(hoja_ruta_id);
CREATE INDEX IF NOT EXISTS idx_historial_gps_geom ON historial_gps USING GIST (geom);

-- 6. Eventos de cumplimiento (Geofencing)
CREATE TABLE IF NOT EXISTS registros_entrega (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER REFERENCES vehiculos(id) ON DELETE CASCADE,
    punto_entrega_id INTEGER REFERENCES puntos_entrega(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(20), 
    geom GEOGRAPHY(POINT, 4326),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_registros_entrega_geom ON registros_entrega USING GIST (geom);

-- 7. Depósitos (Bases Logísticas)
CREATE TABLE IF NOT EXISTS depositos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    ubicacion GEOGRAPHY(POINT, 4326) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_depositos_ubicacion ON depositos USING GIST (ubicacion);

-- Agregamos la relación en la tabla vehículos para saber a qué depósito pertenece
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS deposito_id INTEGER;

-- 2. Quitamos cualquier restricción previa para evitar conflictos
ALTER TABLE vehiculos DROP CONSTRAINT IF EXISTS vehiculos_deposito_id_fkey;

-- 3. Agregamos la relación con RESTRICT (Esto impide el borrado si hay vehículos)
ALTER TABLE vehiculos 
ADD CONSTRAINT vehiculos_deposito_id_fkey 
FOREIGN KEY (deposito_id) REFERENCES depositos(id) ON DELETE RESTRICT;