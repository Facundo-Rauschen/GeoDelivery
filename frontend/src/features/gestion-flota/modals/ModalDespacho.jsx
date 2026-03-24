import React from 'react';
import { Package, ChevronRight, Building2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui'; 
import Modal from './Modal'; 

const ModalDespacho = ({ isOpen, onClose, vehiculo, depositos = [], seleccionId, setSeleccionId, onConfirm }) => {
  
  const depositoSeleccionado = depositos?.find(d => String(d.id) === String(seleccionId));
  
  const esMismoDeposito = String(vehiculo?.deposito_id) === String(seleccionId);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Despacho">
      <div className="space-y-6">
        
        {/* INFO VEHÍCULO CON FLUJO VISUAL */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-orange-50 p-4 rounded-2xl border border-orange-100">
            <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Vehículo</p>
            <p className="text-lg font-black text-slate-800 tracking-tight">{vehiculo?.patente}</p>
          </div>
          
          <div className="p-2 bg-slate-100 rounded-full text-slate-400">
            <ArrowRight size={20} />
          </div>

          <div className={`flex-1 p-4 rounded-2xl border transition-all ${
            depositoSeleccionado ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-dashed border-slate-200'
          }`}>
            <p className={`text-[10px] font-black uppercase mb-1 ${depositoSeleccionado ? 'text-blue-400' : 'text-slate-400'}`}>
              Destino
            </p>
            <p className={`text-sm font-black truncate ${depositoSeleccionado ? 'text-slate-800' : 'text-slate-300 italic'}`}>
              {depositoSeleccionado ? depositoSeleccionado.nombre : 'No seleccionado'}
            </p>
          </div>
        </div>

        {/* LISTA DE DEPÓSITOS */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-500 uppercase ml-1 flex justify-between">
            Seleccionar Depósito de Origen
            <span className="text-blue-600 lowercase font-normal">{depositos?.length || 0} disponibles</span>
          </label>
          
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {depositos?.length > 0 ? (
              depositos.map((d) => {
                const esSeleccionado = String(seleccionId) === String(d.id);
                const esActual = String(vehiculo?.deposito_id) === String(d.id);

                return (
                  <div 
                    key={d.id}
                    onClick={() => setSeleccionId(d.id)}
                    className={`
                      relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${esSeleccionado 
                        ? 'border-orange-500 bg-orange-50/50 shadow-md' 
                        : 'border-slate-100 bg-white hover:border-slate-300'}
                    `}
                  >
                    <div className={`p-2 rounded-lg ${esSeleccionado ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Building2 size={20} />
                    </div>

                    <div className="flex-1">
                      <p className={`font-bold text-sm ${esSeleccionado ? 'text-orange-900' : 'text-slate-700'}`}>
                        {d.nombre}
                      </p>
                      {esActual && (
                        <span className="text-[10px] font-bold text-blue-500 uppercase">Ubicación Actual</span>
                      )}
                    </div>

                    {esSeleccionado && <CheckCircle2 size={20} className="text-orange-500 animate-in zoom-in" />}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-slate-400 text-sm">
                No hay depósitos registrados
              </div>
            )}
          </div>
        </div>

        {/* MENSAJE DE ADVERTENCIA / ALERTA DINÁMICA */}
        {depositoSeleccionado && (
          <div className={`flex items-start gap-3 p-3 rounded-xl border animate-in fade-in slide-in-from-top-2 ${
            esMismoDeposito ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <AlertCircle size={18} className={esMismoDeposito ? 'text-blue-500' : 'text-orange-500'} />
            <p className={`text-[11px] font-medium leading-tight ${esMismoDeposito ? 'text-blue-700' : 'text-orange-700'}`}>
              {esMismoDeposito 
                ? `El vehículo ya se encuentra en ${depositoSeleccionado.nombre}. Se actualizará el registro de estancia.`
                : `Se registrará la salida del vehículo ${vehiculo?.patente} hacia el depósito ${depositoSeleccionado.nombre}.`}
            </p>
          </div>
        )}

        {/* BOTÓN DE ACCIÓN */}
        <div className="pt-2">
            <Button 
                className="w-full py-6 font-black bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100 uppercase tracking-widest text-sm"
                disabled={!seleccionId}
                onClick={onConfirm}
            >
              {esMismoDeposito ? 'Actualizar Registro' : 'Confirmar Salida'}
            </Button>
            <p className="text-[10px] text-center text-slate-400 mt-4 uppercase">
                Esta acción registrará la salida inmediata del vehículo
            </p>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDespacho;