import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Truck, Home, MapPin, Send } from 'lucide-react';

const reactToHtml = (component) => renderToString(component);

export const crearIconoVehiculo = (vehiculo) => {
  const estaMoviendose = (vehiculo.velocidad || 0) > 0;
  
  const html = reactToHtml(
    <div className="relative flex items-center justify-center">
      {estaMoviendose && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
      )}
      
      <div className={`relative flex items-center justify-center h-10 w-10 rounded-2xl shadow-xl border-2 transition-all ${
        estaMoviendose ? 'bg-blue-600 border-white text-white' : 'bg-white border-blue-600 text-blue-600'
      }`}>
        <Truck size={20} />
      </div>
      
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap shadow-md">
        {vehiculo.patente || `ID-${vehiculo.vehiculo_id}`}
      </div>
    </div>
  );

  return L.divIcon({
    html: html,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40], 
    popupAnchor: [0, -40] 
  });
};

export const crearIconoDeposito = () => {
  const html = reactToHtml(
    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-800 border-4 border-white text-white shadow-2xl">
      <Home size={18} />
    </div>
  );

  return L.divIcon({
    html: html,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20], 
    popupAnchor: [0, -20]
  });
};

export const crearIconoPunto = () => {
  const html = reactToHtml(
    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-500 border-4 border-white text-white shadow-2xl transform rotate-45">
      <div className="transform -rotate-45">
        <Send size={16} />
      </div>
    </div>
  );

  return L.divIcon({
    html: html,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};