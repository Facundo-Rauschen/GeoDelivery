import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  Home,
  Truck,
  Navigation,
  Package,
  Activity,
  Map as MapIcon
} from 'lucide-react';

import { getDepositos, getPuntosEntrega, getVehiculos } from '../../api/api'; import {
  crearIconoVehiculo,
  crearIconoDeposito,
  crearIconoPunto
} from './MarcadoresPersonalizados';

const CENTRO_POR_DEFECTO = [-34.6037, -58.3816];

const Mapa = ({ telemetria = {} }) => {
  const [depositos, setDepositos] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const vehiculosOnLine = Object.values(telemetria);
  const [vehiculosBase, setVehiculosBase] = useState([]);

  useEffect(() => {
    const cargarInfraestructura = async () => {
      try {
        const [d, p, v] = await Promise.all([
          getDepositos(),
          getPuntosEntrega(),
          getVehiculos()
        ]);
        setDepositos(Array.isArray(d) ? d : []);
        setPuntos(Array.isArray(p) ? p : []);
        setVehiculosBase(Array.isArray(v) ? v : []); 
      } catch (err) {
        console.error("Error al cargar infraestructura");
      }
    };
    cargarInfraestructura();
  }, []);

  const flotaCompleta = vehiculosBase.map(v => {
    const online = telemetria[v.id];
    return {
      ...v,
      lat: online ? online.lat : v.lat,
      lng: online ? online.lng : v.lng,
      en_vivo: !!online // Indica si el camión se está moviendo actualmente
    };
  });

  return (
    <div className="h-full w-full relative bg-slate-100">
      <MapContainer
        center={CENTRO_POR_DEFECTO}
        zoom={12}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <ZoomControl position="bottomright" />

        {/* --- RADIOS Y MARCADORES DE DEPÓSITOS --- */}
        {depositos.map(d => (
          <React.Fragment key={`depo-group-${d.id}`}>
            {/* Círculo de Radio para Depósito (500m por defecto o d.radio) */}
            <Circle
              center={[d.lat, d.lng]}
              radius={d.radio || 500}
              pathOptions={{
                fillColor: '#1e293b',
                fillOpacity: 0.1,
                color: '#1e293b',
                weight: 1,
                dashArray: '5, 10'
              }}
            />
            <Marker position={[d.lat, d.lng]} icon={crearIconoDeposito()}>
              <Popup className="custom-popup">
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Home size={14} className="text-slate-800" />
                    <span className="font-black text-slate-800 text-[10px] uppercase">Base Logística</span>
                  </div>
                  <p className="font-bold text-slate-600 text-xs">{d.nombre}</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* --- RADIOS Y MARCADORES DE PUNTOS DE ENTREGA --- */}
        {puntos.map(p => (
          <React.Fragment key={`punto-group-${p.id}`}>
            {/* Círculo de Radio para Punto de Entrega (200m por defecto) */}
            <Circle
              center={[p.lat, p.lng]}
              radius={p.radio || 200}
              pathOptions={{
                fillColor: '#22c55e',
                fillOpacity: 0.15,
                color: '#22c55e',
                weight: 2,
                dashArray: '2, 6'
              }}
            />
            <Marker position={[p.lat, p.lng]} icon={crearIconoPunto()}>
              <Popup className="custom-popup">
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={14} className="text-green-600" />
                    <span className="font-black text-slate-800 text-[10px] uppercase">Cliente</span>
                  </div>
                  <p className="font-bold text-slate-600 text-xs">{p.nombre}</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* --- VEHÍCULOS --- */}
        {flotaCompleta.map(v => (
          v.lat && v.lng && (
            <Marker
              key={`v-${v.id}`}
              position={[v.lat, v.lng]}
              icon={crearIconoVehiculo(v)}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck size={14} className={v.en_vivo ? "text-blue-600" : "text-slate-400"} />
                    <span className="font-black text-slate-800 text-[10px] uppercase">{v.patente}</span>
                  </div>
                  <p className="font-bold text-slate-600 text-[10px]">
                    Estado: {v.en_vivo ? '🛰️ Transmitiendo' : '💤 Estacionado'}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* LEYENDA FLOTANTE */}
      <div className="absolute bottom-8 left-8 z-500 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white space-y-3">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Referencias</h5>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-dashed border-slate-800 bg-slate-800/10" />
          <span className="text-[11px] font-bold text-slate-600">Radio Depósito (500m)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-dashed border-green-500 bg-green-500/10" />
          <span className="text-[11px] font-bold text-slate-600">Radio Entrega (200m)</span>
        </div>
      </div>
    </div>
  );
};

export default Mapa;