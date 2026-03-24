import React from 'react';
import { MapPin, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui'; 
import Modal from './Modal';

const ModalEntrega = ({ isOpen, onClose, vehiculo, puntos = [], seleccionId, setSeleccionId, onConfirm }) => {
  
  const puntoSeleccionado = puntos?.find(p => Number(p.id) === Number(seleccionId));
  
  const yaAsignado = puntoSeleccionado && 
                     puntoSeleccionado.vehiculo_id && 
                     Number(puntoSeleccionado.vehiculo_id) !== Number(vehiculo?.id);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planificar Entrega">
      <div className="space-y-6">
        
        {/* Info del Vehículo Destino */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Vehículo Destino</p>
            <p className="text-lg font-black text-slate-800">{vehiculo?.patente || 'Sin Patente'}</p>
          </div>
          <div className="p-3 bg-white rounded-full shadow-sm">
             <MapPin className="text-emerald-500" size={24} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase ml-1">
            {/* Usamos optional chaining para evitar errores si puntos es nulo */}
            Puntos de Entrega ({puntos?.length || 0})
          </label>
          
          <div className="relative">
            <select 
              className={`w-full p-4 bg-white border-2 rounded-2xl outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer ${
                yaAsignado ? 'border-orange-300 bg-orange-50' : 'border-slate-100 focus:border-emerald-500'
              }`}
              value={seleccionId}
              onChange={(e) => setSeleccionId(e.target.value)}
            >
              <option value="">-- Seleccione un destino --</option>
              {/* Mapeo seguro con optional chaining */}
              {puntos?.map(p => {
                const perteneceAotro = p.vehiculo_id && Number(p.vehiculo_id) !== Number(vehiculo?.id);
                const esDelActual = p.vehiculo_id && Number(p.vehiculo_id) === Number(vehiculo?.id);

                return (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {
                      perteneceAotro 
                        ? ` -> En uso por: ${p.patente_vehiculo || 'Otro'}` 
                        : esDelActual 
                          ? ' (Ya asignado aquí)' 
                          : ' (Libre)'
                    }
                  </option>
                );
              })}
            </select>
            <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
          </div>

          {/* Alerta de Reasignación */}
          {yaAsignado && (
            <div className="flex items-start gap-2 p-3 bg-orange-100 rounded-xl border border-orange-200 animate-in fade-in zoom-in duration-200">
              <AlertCircle size={16} className="text-orange-600 mt-0.5 shrink-0" />
              <div className="text-[11px] text-orange-700 font-medium leading-tight">
                <p>
                  <strong>Atención:</strong> Este punto pertenece a: 
                  <span className="ml-1 px-1.5 py-0.5 bg-orange-200 rounded text-orange-800 font-bold">
                    {puntoSeleccionado.patente_vehiculo || 'N/A'}
                  </span>
                </p>
                <p className="mt-1 text-[10px] opacity-80 italic">
                  Se reasignará automáticamente al confirmar.
                </p>
              </div>
            </div>
          )}
        </div>

        <Button 
          className={`w-full py-4 font-bold uppercase transition-all hover:scale-[1.02] shadow-lg ${
            yaAsignado 
              ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' 
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
          }`}
          disabled={!seleccionId}
          onClick={onConfirm}
        >
          {yaAsignado ? 'Confirmar Reasignación' : 'Confirmar Asignación'}
        </Button>
      </div>
    </Modal>
  );
};

export default ModalEntrega;