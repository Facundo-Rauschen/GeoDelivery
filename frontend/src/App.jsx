import React, { useState, useEffect } from 'react';
import { 
  Truck, Map as MapIcon, Settings, Activity, 
  Play, RotateCcw, Search 
} from 'lucide-react';

// Infraestructura y Contexto
import { iniciarSimulacion, reiniciarSimulacion as apiReiniciar } from './api/api';
import { useTelemetria } from './hooks/useTelemetria';
import { AlertProvider, useAlerts } from './features/gestion-flota/context/AlertContext'; 

// UI y Módulos
import { Button, Card, Badge } from './components/ui';
import Mapa from './components/Mapa/Mapa';
import GestionLogistica from './features/gestion-flota/GestionFlota';

// Creamos un componente interno para poder usar useAlerts() dentro de la estructura
const AppContent = () => {
  const { showAlert } = useAlerts(); 
  const [tabActiva, setTabActiva] = useState('mapa');
  const [cargando, setCargando] = useState(false);
  const [simulacionActiva, setSimulacionActiva] = useState(false);

  const { telemetria, conectado, limpiarTelemetria } = useTelemetria();
  const listaVehiculos = Object.values(telemetria);

  // --- MONITOREO DE FINALIZACIÓN AUTOMÁTICA ---
  useEffect(() => {
    if (simulacionActiva && listaVehiculos.length > 0) {
      const todosLlegaron = listaVehiculos.every(v => {
        const evento = v.evento?.toLowerCase() || "";
        const estaEnBase = evento.includes('limpio') || evento.includes('base');
        const estaDetenido = v.velocidad === 0;
        return estaEnBase && estaDetenido;
      });

      if (todosLlegaron) {
        const timer = setTimeout(() => {
          setSimulacionActiva(false);
          showAlert("Simulación finalizada: Todas las unidades en base", "info");
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [telemetria, simulacionActiva, showAlert]);

  const handleIniciar = async () => {
    if (cargando || simulacionActiva) return;
    setCargando(true);
    try {
      await iniciarSimulacion();
      setSimulacionActiva(true);
      showAlert("Flota iniciada correctamente", "success");
    } catch (err) {
      showAlert("Error al conectar con el servidor de simulación", "error");
    } finally {
      setCargando(false);
    }
  };

  const handleReiniciar = async () => {
    if (!window.confirm("¿Reiniciar sistema? Se perderán los recorridos actuales.")) return;
    setCargando(true);
    try {
      await apiReiniciar();
      setSimulacionActiva(false);
      limpiarTelemetria();
      showAlert("Sistema reiniciado", "warning");
    } catch (err) {
      showAlert("No se pudo reiniciar la simulación", "error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* NAVBAR */}
      <nav className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><Truck size={20} /></div>
          <h1 className="text-xl font-bold tracking-tight">GeoDelivery <span className="text-blue-400 font-light">Pro</span></h1>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <Button 
            variant={tabActiva === 'mapa' ? 'primary' : 'ghost'} 
            onClick={() => setTabActiva('mapa')} 
            size="sm"
            className="px-6"
          >
            <MapIcon size={16} /> Mapa
          </Button>
          <Button 
            variant={tabActiva === 'flota' ? 'primary' : 'ghost'} 
            onClick={() => setTabActiva('flota')} 
            size="sm"
            className="px-6"
          >
            <Settings size={16} /> Configuración
          </Button>
        </div>

        <Badge color={conectado ? 'green' : 'red'} variant="outline" className="px-3 py-1">
          <Activity size={12} className={conectado ? 'animate-pulse' : ''} />
          <span className="ml-2 text-[10px] font-bold tracking-widest">{conectado ? 'CONNECTED' : 'OFFLINE'}</span>
        </Badge>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-hidden relative">
        {tabActiva === 'mapa' ? (
          <div className="flex h-full">
            {/* SIDEBAR DE ESTADO */}
            <aside className="w-85 bg-white border-r border-slate-200 p-6 shadow-xl z-10 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades Activas</h2>
                   <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                     {listaVehiculos.length}
                   </span>
                </div>
                
                <div className="space-y-3">
                  {listaVehiculos.length > 0 ? (
                    listaVehiculos.map((v) => (
                      <Card key={v.vehiculo_id} className="group border-slate-100 hover:border-blue-200 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Patente</span>
                            <div className="font-mono text-sm font-black text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              {v.patente ? v.patente.toUpperCase() : 'SIN-ID'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-slate-300 font-bold tracking-tighter">ID {v.vehiculo_id}</span>
                            <div className="text-[10px] font-black text-blue-600">{v.velocidad} km/h</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                          <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${v.velocidad > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                            {v.evento || 'En espera'}
                          </p>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-xs text-slate-400 font-medium">No hay datos de telemetría</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CONTROLES DE SIMULACIÓN */}
              <div className="pt-6 border-t mt-4">
                <Button 
                  variant={simulacionActiva ? 'danger' : 'primary'} 
                  className="w-full py-7 rounded-2xl shadow-lg font-black uppercase tracking-widest" 
                  onClick={simulacionActiva ? handleReiniciar : handleIniciar} 
                  disabled={cargando}
                >
                  {cargando ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {simulacionActiva ? <RotateCcw size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
                      {simulacionActiva ? 'Reiniciar Sistema' : 'Iniciar Flota'}
                    </>
                  )}
                </Button>
              </div>
            </aside>

            {/* MAPA A PANTALLA COMPLETA */}
            <div className="flex-1 relative bg-slate-200">
              <Mapa telemetria={telemetria} />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto bg-slate-50">
            <GestionLogistica />
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AlertProvider>
      <AppContent />
    </AlertProvider>
  );
}

export default App;