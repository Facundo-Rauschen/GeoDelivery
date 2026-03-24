import React from 'react';
import { Home, MapPin, Trash2, Truck } from 'lucide-react';
import { Card } from '../../../components/ui';

const VistaDepositos = ({ datos, vehiculos = [], onEliminar }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {datos.map((item) => {
        const vehiculosEnDeposito = vehiculos.filter(v => 
          Number(v.deposito_id) === Number(item.id)
        );
        
        const tieneActividad = vehiculosEnDeposito.length > 0;

        return (
          <Card 
            key={item.id} 
            className={`group relative hover:shadow-md border-l-4 transition-all p-5 bg-white ${
              tieneActividad 
                ? 'border-l-orange-500 shadow-sm' 
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
                tieneActividad 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                <Home size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg truncate mb-1">
                  {item.nombre}
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={12} className="shrink-0" />
                    <span className="text-[11px] font-medium truncate">
                      {item.direccion || `ID: ${item.id}`}
                    </span>
                  </div>

                  {/* Badge de Conteo */}
                  <div className={`flex items-center gap-2 w-fit px-2.5 py-1 rounded-lg border transition-all ${
                    tieneActividad 
                      ? 'bg-orange-50 border-orange-100 text-orange-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <Truck size={14} className={tieneActividad ? 'animate-bounce' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {vehiculosEnDeposito.length} {vehiculosEnDeposito.length === 1 ? 'Vehículo' : 'Vehículos'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer de estado */}
            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-2">
              {tieneActividad ? (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600/70">
                    Base Operativa
                  </p>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-slate-200" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
                    Sin flota - Disponible
                  </p>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default VistaDepositos;