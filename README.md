# 🚚 GeoDelivery: Manual de Inteligencia Logística

**GeoDelivery** es un ecosistema de última milla diseñado para transformar coordenadas estáticas en una operación logística dinámica. A diferencia de los sistemas de gestión tradicionales, GeoDelivery utiliza motores de cálculo real, persistencia geográfica y geometría esférica para optimizar cada movimiento de la flota.

---

## 🧠 El Cerebro de la Aplicación

El valor diferencial de GeoDelivery reside en la combinación de tres pilares tecnológicos que permiten una toma de decisiones basada en datos geográficos reales:

### 🛣️ Motor de Enrutamiento: OSRM
La aplicación no calcula distancias en "línea recta", sino que utiliza **OSRM (Open Source Routing Machine)** sobre redes viales reales:
* **Rutas Reales:** Considera calles, sentidos de circulación y giros prohibidos.
* **Precisión de Arribo (ETA):** Proporciona tiempos estimados basados en la jerarquía de las vías.
* **Algoritmos MLD:** Implementa *Multi-Level Dijkstra* para procesar rutas complejas en milisegundos.

### 📏 Geofencing con Fórmula de Haversine
Para la validación de eventos sin intervención manual, implementamos la **Fórmula de Haversine**. Esta permite calcular la distancia ortodrómica entre el vehículo y su destino:
* **Detección de Proximidad:** Determina si un vehículo ha ingresado al radio de acción (ej. 100m) de un punto de entrega.
* **Automatización:** Dispara eventos de llegada y cambios de estado en la hoja de ruta de forma autónoma mediante comparaciones esféricas.

### 🛰️ Telemetría y Persistencia Geoespacial
* **Streaming Real-time:** Mediante **Socket.io**, los vehículos envían su posición constantemente, actualizando el mapa global.
* **PostGIS:** Utilizamos la extensión espacial de PostgreSQL para almacenar coordenadas en tipos `GEOGRAPHY (POINT, 4326)`, permitiendo consultas espaciales nativas.
* **Redis Cache:** Implementado para gestionar estados de sesión y caché de rutas frecuentes, reduciendo la latencia de respuesta.

---

## 🏗️ Entidades del Ecosistema

GeoDelivery se articula sobre cuatro pilares fundamentales que definen la operación logística en el terreno:

1. **🏬 Depósitos (Bases Operativas)**
Son los centros de origen. Cada depósito tiene una ubicación geográfica fija (`ST_Point`) y funciona como el "Home" de una flota específica.
* **Lógica de Negocio:** Un depósito se considera **Activo (color Naranja)** si tiene vehículos vinculados. El sistema impide su eliminación si existen unidades asignadas para garantizar la integridad de la base.

2. **🚛 Vehículos (Unidades de Flota)**
Representan los activos móviles del sistema. Cada vehículo está vinculado a un depósito de origen y posee telemetría en tiempo real.
* **Estado Dinámico:** Cambian de color (**Azul**) al iniciar una Hoja de Ruta.
* **Telemetría:** Almacenan rumbo (*heading*), velocidad y un historial de coordenadas para dibujar el rastro del recorrido (**Polyline**).

3. **📍 Puntos de Entrega (Destinos/Clientes)**
Son las paradas finales de la cadena. Se representan como geocercas en el mapa.
* **Inteligencia Geográfica:** Gracias a la fórmula de Haversine, el punto detecta la llegada del vehículo de forma autónoma. Cambia a color **Esmeralda** cuando un envío está en curso hacia esa posición.

4. **📋 Envíos y Hojas de Ruta (La Operación)**
Es la capa lógica que une a las tres anteriores.
* **Hoja de Ruta:** Define una secuencia de visitas optimizada (calculada mediante OSRM).
* **Estados de Entrega:** Cada parada dentro de la ruta transiciona de `PENDIENTE` a `ENTREGADO` automáticamente al cruzar el umbral del Geofence (100 metros).

---

### 🐳 Infraestructura (Docker Stack)
El proyecto está orquestado mediante **Docker Compose**, garantizando un entorno de desarrollo idéntico al de producción:
* **geo_db (PostGIS 15):** Base de datos relacional con persistencia gestionada en volúmenes. Incluye scripts de inicialización automática (`init.sql`).
* **geo_cache (Redis):** Capa de alta disponibilidad para datos temporales y persistencia de mensajes *append-only*.
* **osrm_argentina:** Motor de enrutamiento cargado con el dataset de la región, exponiendo servicios en el puerto 5000.

---

## 🚀 Requisitos de Infraestructura
Para iniciar el ecosistema completo:
```bash
docker-compose up -d

```

---

## 🛠️ Tecnologías Principales

### 🖥️ Frontend (Centro de Control de Operaciones)
Diseñado para ofrecer una experiencia de usuario fluida, procesando flujos de datos constantes sin degradar el rendimiento.

* **React 18 & Vite:** Base del desarrollo por componentes con tiempos de compilación y recarga ultra rápidos.
* **Tailwind CSS:** Sistema de diseño basado en utilidades para una interfaz responsiva, moderna y de alta densidad informativa.
* **Leaflet & React-Leaflet:** Motor de mapas interactivo para la renderización de capas geográficas, geocercas y activos móviles.
* **Lucide React:** Set de iconos vectoriales consistentes para una señalética logística clara.
* **Socket.io-client:** Comunicación bidireccional de baja latencia para el movimiento de la flota en tiempo real.
* **Axios:** Cliente HTTP para la gestión de peticiones asíncronas a la API REST.

---

### ⚙️ Backend (Motor de Procesamiento y Lógica)
Un núcleo transaccional preparado para cálculos geométricos pesados y gestión de estados dinámicos.

* **Node.js & Express:** Entorno de ejecución y framework web para una API RESTful escalable y eficiente.
* **Socket.io:** Servidor de eventos para el broadcast masivo de telemetría a todos los clientes conectados.
* **OSRM (Open Source Routing Machine):** Motor de enrutamiento de alto rendimiento que calcula trayectorias sobre redes viales reales (OpenStreetMap), devolviendo geometrías precisas y ETAs.
* **PostgreSQL + PostGIS:** Base de datos relacional con inteligencia geoespacial nativa para el almacenamiento y consulta de datos geográficos.
* **Redis:** Capa de alta disponibilidad para la gestión de estados de sesión y caché de geofencing.

---

<details>
  <summary><b>🖥️ Ver Detalles de Backend: Arquitectura y Motor Logístico</b></summary>

  ## ⚙️ Backend: Arquitectura y Motor Logístico

  El backend de **GeoDelivery** es un motor de eventos geoespaciales de alta disponibilidad diseñado para gestionar el ciclo de vida de la flota y el cumplimiento de entregas en tiempo real.

  ### 🧠 GeoService: El Corazón Transaccional
  Este servicio es el encargado de procesar cada reporte de telemetría enviado por los vehículos a través de WebSockets. Está optimizado para ejecutar un pipeline de validación y cálculo en menos de **50ms**.

  #### **Pipeline de Procesamiento de Ubicación:**
  1. **Persistencia de Telemetría:** Actualización de `ultima_ubicacion` y alimentación de la tabla `historial_gps` para auditoría y trazabilidad de rutas.
  2. **Inteligencia Espacial (PostGIS):** Mediante funciones como `ST_Distance` y `ST_SetSRID`, el sistema identifica automáticamente cuál es la próxima parada pendiente en la hoja de ruta activa.
  3. **Cálculo de Proximidad (Haversine):** Implementación de la fórmula de Haversine para obtener la distancia real en metros sobre la curvatura terrestre.
  4. **Gestión de Estados con Redis:** Para evitar "rebotes" de señal GPS y garantizar la atomicidad, utilizamos **Redis** como memoria de corto plazo. Almacenamos claves dinámicas `status:vehiculo:X:punto:Y` para asegurar que un evento de llegada se procese exactamente una vez.

  > **Geofencing Automático:** Si la distancia es $\le 100$ metros:
  > * Registra el evento `ENTER_STORE` en el historial.
  > * Cambia el estado de la parada a `ENTREGADO` en PostgreSQL.
  > * Dispara una notificación push/socket al frontend.

  ### 🛰️ Motor de Simulación (The Simulation Engine)
  Es el componente encargado de "dar vida" a la flota sin necesidad de hardware GPS real.
  * **Trayectorias Inteligentes:** No utiliza líneas rectas; cada ciclo consulta a **OSRM** para obtener el camino real por calles y avenidas.
  * **Concurrencia:** Utiliza un modelo de ejecución no bloqueante donde cada unidad tiene su propio ciclo de vida (`ejecutarCicloVehiculo`), actualizando su posición cada **600ms**.
  * **Control Total:** Incluye un "Reset Maestro" que ejecuta un `TRUNCATE` de historiales, reubica la flota en sus depósitos y limpia las llaves de Redis.

  ---

  ## 🛣️ API Design & Business Logic
  La interfaz de comunicación está construida bajo estándares **RESTful**, con un enfoque en la consistencia eventual y la validación geoespacial.

  ### 🎮 Core Engine: Telemetría y Simulación

  | Método | Endpoint | Descripción Técnica |
  | :--- | :--- | :--- |
  | `POST` | `/api/v1/simular` | Trigger del **Simulation Engine**. Inicia hilos no bloqueantes de movimiento. |
  | `POST` | `/api/v1/actualizar` | Inserción atómica de coordenadas (`Update` posicion + `Insert` historial). |
  | `GET` | `/api/v1/vehiculo/:id/historial` | Recupera el rastro de telemetría (últimos 100 puntos) para polilíneas. |
  | `POST` | `/api/v1/reiniciar` | **Master Reset:** `TRUNCATE` de logs y flush de geofences en Redis. |

  ### 🛠️ Módulos Operativos (Recursos)

  #### 🚚 Flota de Vehículos
  * **Registro Inteligente:** El `POST /vehiculos` utiliza **Regex** para normalizar patentes y captura el error **PostgreSQL 23505** para evitar duplicados.
  * **Gestión de Base:** Al usar `PATCH /:id/deposito`, el sistema resetea el rumbo y limpia el historial previo para garantizar una visualización limpia.

  #### 📦 Despacho y Envíos
  * **Lógica de Disponibilidad:** El endpoint `GET /puntos/disponibles` aplica un filtro de exclusión: solo retorna destinos que no figuren en una hoja activa.
  * **Modificación en Caliente:** El `DELETE /envios/puntos/:id` permite dar de baja una parada de una ruta activa sin afectar el resto de la misión.

  ### 🔄 Flujo de Estados del Envío
  El backend gestiona la máquina de estados para asegurar la sincronización con el Frontend:
  1. **PENDIENTE:** Punto creado, listo para ser asignado.
  2. **ASIGNADO:** Vinculación vehículo-punto con orden de visita definido.
  3. **EN CURSO:** Telemetría activa y monitoreo de proximidad vía **Haversine**.
  4. **COMPLETADO:** Geofence disparado ($\le 100m$), registro de evento y cierre de hoja de ruta.

</details>

<details>
  <summary><b>💻 Ver Detalles de Frontend: Dashboard y Centro de Control</b></summary>

  ## 💻 Frontend: Dashboard Logístico y Centro de Control

  El frontend de **GeoDelivery** es una SPA (Single Page Application) de alto rendimiento construida con **React**, diseñada para transformar flujos de datos complejos en una interfaz operativa intuitiva, reactiva y robusta.

  ### 🗺️ Componente Core: Visualización Geoespacial
  El mapa actúa como la **Single Source of Truth** visual, consolidando la infraestructura física y el movimiento de la flota en tiempo real.

  * **Motor de Renderizado:** Basado en **React Leaflet** con la capa `light_all` de **CARTO**, seleccionada específicamente para maximizar la legibilidad de los activos sobre el terreno.
  * **Lógica de Telemetría Dinámica:** Implementa un sistema de **Data Merging** (Fusión de Datos). El componente cruza los datos estáticos de la base de datos con el flujo de Sockets. Si un vehículo tiene telemetría activa, se prioriza su posición GPS real; de lo contrario, aplica un *fallback* automático a su última ubicación conocida.
  * **Geofencing Visual:** Uso de radios de acción mediante capas circulares:
    * **Depósitos:** Radio de 500m con bordes discontinuos en color *Slate*.
    * **Puntos de Entrega:** Radio de 200m en color *Esmeralda*, representando la zona de éxito para el arribo de mercadería.
  * **Iconografía Inteligente:** Los marcadores ajustan su rotación (rumbo) y color dinámicamente según el estado del vehículo, utilizando popups diseñados con **Tailwind CSS** y **Lucide React** para mostrar jerarquía visual.

  ### 🔌 Capa de Servicios y Comunicación
  La comunicación con el backend se centraliza en un cliente de **Axios** configurado para ser el puente robusto entre la UI y la API.

  * **Configuración del Cliente:** Base URL apuntando a `/api/v1` con un timeout de 5000ms para prevenir esperas infinitas.
  * **Interceptores de Respuesta:** Extraen automáticamente `response.data`, simplificando el flujo de datos hacia los componentes.
  * **Resiliencia:** Métodos como `getPuntosEntrega()` incluyen bloques `.catch(() => [])` preventivos, asegurando que la UI no se rompa y devuelva listas vacías en caso de fallos parciales del servidor.

  ### 🛠️ Panel de Gestión Logística (Back-Office)
  Un módulo integral de administración que permite el mantenimiento de la flota y la infraestructura desde un panel unificado.

  * **🧠 Lógica de Negocio: Custom Hook `useLogistica`:** Es el corazón operativo del panel, encargado de desacoplar la complejidad técnica de la interfaz. Maneja la sincronización multicapa, estados de carga y la sanitización de datos (normalización de patentes y casteo de tipos para PostGIS).
  * **🎛️ Vistas Especializadas y UI Polimórfica:**
    * **Formulario de Registro Adaptativo:** Un único componente que reconfigura sus campos según la sección activa (Vehículos, Depósitos o Puntos) con validaciones nativas por Regex.
    * **Vista de Vehículos:** Permite la remoción "en caliente" de paradas individuales mediante etiquetas dinámicas.
    * **Vista de Puntos:** Identifica visualmente vehículos dirigiéndose a un destino mediante indicadores `animate-pulse` y etiquetas de patentes en tiempo real.
    * **Vista de Depósitos:** Monitor de capacidad con efectos de radar (`animate-ping`) para bases activas.

  ### 📡 Telemetría en Tiempo Real (`useTelemetria`)
  Para la experiencia "en vivo", el sistema implementa una arquitectura basada en eventos utilizando **Socket.io**.

  * **Conexión por WebSockets:** Forza el protocolo nativo para reducir latencia y evita el overhead de HTTP polling. Incluye limpieza de listeners para prevenir *memory leaks*.
  * **Procesamiento de Señales:** Indexación de datos por ID para búsquedas $O(1)$. Implementa lógica local para forzar velocidad a 0 en eventos de "Regreso a Base".
  * **Indicadores de Conectividad:** Expone un estado de conexión global (LED visual) para informar al operador sobre la salud del enlace de datos.

  ### 🎨 Diseño y User Experience (UX)
  * **Asignación Visual:** Creación de hojas de ruta mediante modales con **Lógica de Filtrado Inteligente (`useMemo`)**, que oculta puntos ya asignados.
  * **Feedback Inmediato:** Sistema de alertas globales (`AlertContext`) con códigos de color semánticos (Éxito/Verde, Advertencia/Amarillo, Error/Rojo).
  * **Estética Profesional:** Uso de **Glassmorphism** (`backdrop-blur`), animaciones fluidas (`animate-in zoom-in-95`) y layouts adaptativos.

</details>