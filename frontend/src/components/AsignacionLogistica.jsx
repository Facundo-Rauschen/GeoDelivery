import React, { useMemo } from 'react';
import { X, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ModalAsignacion({ 
  isOpen, 
  onClose, 
  vehiculo, 
  puntosEntrega, 
  vehiculos, 
  puntosSeleccionados, 
  togglePunto, 
  handleConfirmarAsignacion 
}) {
  if (!isOpen || !vehiculo) return null;

  const puntosDisponibles = useMemo(() => {
    const idsOcupados = new Set(
      vehiculos.flatMap(v => v.paradas_ids || []).map(id => Number(id))
    );

    return puntosEntrega.filter(punto => !idsOcupados.has(Number(punto.id)));
  }, [vehiculos, puntosEntrega]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        
        {/* Cabecera */}
        <div className="p-5 border-b flex justify-between items-center bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Nueva Hoja de Ruta</h2>
            <p className="text-xs text-slate-500 font-medium">Asignando a: <span className="text-blue-600 uppercase">{vehiculo.patente}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-5 overflow-y-auto bg-slate-50 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Puntos de Entrega Libres</h3>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {puntosDisponibles.length} Disponibles
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {puntosDisponibles.length > 0 ? (
              puntosDisponibles.map(punto => {
                const seleccionado = puntosSeleccionados.includes(punto.id);
                return (
                  <button
                    key={punto.id}
                    onClick={() => togglePunto(punto.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      seleccionado 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-white bg-white text-slate-600 hover:border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded-md ${seleccionado ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <MapPin size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-none mb-1">{punto.nombre}</span>
                      <span className="text-[10px] opacity-70">ID: #{punto.id}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center text-slate-400">
                <AlertCircle size={32} strokeWidth={1.5} className="mb-2 opacity-20" />
                <p className="text-xs italic">No hay puntos disponibles en el sistema.</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="p-5 border-t bg-white flex gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button 
            disabled={puntosSeleccionados.length === 0}
            onClick={() => {
              handleConfirmarAsignacion();
              onClose();
            }}
            className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle2 size={16} />
            Crear Hoja de Ruta ({puntosSeleccionados.length})
          </button>
        </div>
      </div>
    </div>
  );
}