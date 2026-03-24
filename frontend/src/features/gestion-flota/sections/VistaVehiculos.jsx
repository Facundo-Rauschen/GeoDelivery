import React from 'react';
import { Truck, Building2, Map, Package, Trash2, X } from 'lucide-react';
import { Card } from '../../../components/ui';

const VistaVehiculos = ({ datos, depositos, onEliminar, onAbrirDespacho, onAbrirEntrega, onQuitarPunto }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {datos.map((item) => {
        const tieneRutaActiva = item.paradas_actuales && item.paradas_actuales.length > 0;

        return (
          <Card key={item.id} className="group relative hover:shadow-md border-l-4 border-l-blue-500 transition-all p-4 bg-white">
            {/* Botón Eliminar Vehículo */}
            <button 
              onClick={() => onEliminar(item.id)} 
              className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <Trash2 size={18} />
            </button>

            {/* Cabecera del Vehículo */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl ${tieneRutaActiva ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Truck size={22} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 uppercase leading-none mb-1">{item.patente}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 flex items-center gap-1 border border-slate-200/50">
                  <Building2 size={10} />
                  {depositos.find(d => d.id === item.deposito_id)?.nombre || 'Sin Depósito'}
                </span>
              </div>
            </div>

            {/* Listado de Paradas (Ruta Activa) */}
            {tieneRutaActiva ? (
              <div className="mt-2 p-3 rounded-xl border border-blue-100 bg-linear-to-br from-blue-50/40 to-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] uppercase font-black text-blue-600 tracking-wider flex items-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" /> Destinos actuales
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {item.paradas_actuales.map((parada, idx) => (
                    <div 
                      key={parada.id || idx} 
                      className="flex items-center gap-1 bg-white border border-blue-100 pl-2 pr-1 py-0.5 rounded-lg shadow-xs transition-all hover:border-blue-300"
                    >
                      <span className="text-[10px] font-medium text-slate-600">
                        {parada.nombre || parada}
                      </span>
                      <button
                        onClick={() => onQuitarPunto(item.id, parada)} // Pasamos el objeto completo (con ID)
                        className="p-0.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"
                        title="Quitar parada"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-2 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Disponible</p>
              </div>
            )}

            {/* Acciones del Vehículo */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
              <button 
                onClick={() => onAbrirEntrega(item)} 
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              >
                <Map size={14} /> Entrega
              </button>
              <button 
                onClick={() => onAbrirDespacho(item)} 
                className="flex-1 flex items-center justify-center gap-2 bg-orange-50 text-orange-600 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-orange-600 hover:text-white transition-all shadow-sm"
              >
                <Package size={14} /> Despacho
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default VistaVehiculos;