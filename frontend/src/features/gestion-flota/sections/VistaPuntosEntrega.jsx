import React from 'react';
import { MapPin, Trash2, Navigation, PackageCheck } from 'lucide-react';
import { Card } from '../../../components/ui';

const VistaPuntosEntrega = ({ datos, vehiculos = [], onEliminar }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {datos.map((item) => {
        const vehiculosVisitando = vehiculos.filter(v => 
          v.paradas_actuales?.some(parada => 
            Number(parada.id) === Number(item.id) || parada.nombre === item.nombre
          )
        );

        const tieneVisitasPendientes = vehiculosVisitando.length > 0;

        return (
          <Card 
            key={item.id} 
            className={`group relative hover:shadow-md border-l-4 transition-all p-5 bg-white ${
              tieneVisitasPendientes 
                ? 'border-l-emerald-500 shadow-sm' 
                : 'border-l-slate-300'
            }`}
          >
            {/* Botón Eliminar */}
            <button 
              onClick={() => onEliminar(item.id)} 
              className="absolute top-3 right-3 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <Trash2 size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl transition-all duration-500 ${
                tieneVisitasPendientes 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                <Navigation size={22} className={tieneVisitasPendientes ? 'animate-pulse' : ''} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg truncate mb-1">
                  {item.nombre}
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={12} className="shrink-0" />
                    <span className="text-[10px] font-mono uppercase tracking-tighter">
                      GPS: {item.lat} / {item.lng}
                    </span>
                  </div>

                  {/* Badge de Estado de Entrega */}
                  <div className={`flex items-center gap-2 w-fit px-2.5 py-1 rounded-lg border transition-all ${
                    tieneVisitasPendientes 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <PackageCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {tieneVisitasPendientes 
                        ? `${vehiculosVisitando.length} En camino` 
                        : 'Sin entregas'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer de estado informativo */}
            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-2">
              {tieneVisitasPendientes ? (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70">
                    Punto Activo - Entrega en curso
                  </p>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-slate-200" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
                    Libre - Sin actividad logística
                  </p>
                </>
              )}
            </div>

            {/* Mostrar qué vehículos van hacia allá (mini patentes) */}
            {tieneVisitasPendientes && (
              <div className="mt-3 flex flex-wrap gap-1">
                {vehiculosVisitando.map(v => (
                  <span key={v.id} className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm font-bold border border-emerald-100">
                    {v.patente}
                  </span>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default VistaPuntosEntrega;