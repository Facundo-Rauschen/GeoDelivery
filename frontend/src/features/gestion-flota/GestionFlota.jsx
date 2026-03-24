import React, { useState, useEffect } from 'react';
import { Truck, Home, MapPin, Search, List } from 'lucide-react';

// Hooks
import { useLogistica } from '../../hooks/useLogistica';
import { useAlerts } from '../../features/gestion-flota/context/AlertContext';

// Sub-componentes
import FormularioLogistica from './sections/FormularioLogistica';
import VistaVehiculos from './sections/VistaVehiculos';
import VistaDepositos from './sections/VistaDepositos';
import VistaPuntosEntrega from './sections/VistaPuntosEntrega';
import ModalDespacho from './modals/ModalDespacho';
import ModalEntrega from './modals/ModalEntrega';

const GestionLogistica = () => {
  const { showAlert } = useAlerts();

  // --- ESTADOS DE NAVEGACIÓN Y BÚSQUEDA ---
  const [seccion, setSeccion] = useState('vehiculos');
  const [busqueda, setBusqueda] = useState('');

  // --- HOOK DE LÓGICA ---
  const {
    datos,
    vehiculosTodos,
    cargando,
    depositosDisponibles,
    puntosLibres,
    handleGuardarNuevo,
    handleEliminar,
    handleConfirmarAccion,
    handleQuitarPuntoManual,
    cargarPuntosParaEntrega
  } = useLogistica(seccion);

  // --- ESTADOS LOCALES DE UI (Modales) ---
  const [modalDespachoAbierto, setModalDespachoAbierto] = useState(false);
  const [modalEntregaAbierto, setModalEntregaAbierto] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [seleccionId, setSeleccionId] = useState('');
  const [formulario, setFormulario] = useState({
    nombre: '', modelo: '', lat: '', lng: '', deposito_id: ''
  });

  // Limpiar estados al cambiar de pestaña
  useEffect(() => {
    setFormulario({ nombre: '', modelo: '', lat: '', lng: '', deposito_id: '' });
    setBusqueda('');
  }, [seccion]);

  const datosFiltrados = (Array.isArray(datos) ? datos : []).filter(item =>
    (item.nombre || item.patente || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- MANEJADORES DE MODALES ---
  const abrirDespacho = (v) => {
    setVehiculoSeleccionado(v);
    setSeleccionId(v.deposito_id || '');
    setModalDespachoAbierto(true);
  };

  const abrirEntrega = async (v) => {
    setVehiculoSeleccionado(v);
    setSeleccionId('');
    await cargarPuntosParaEntrega();
    setModalEntregaAbierto(true);
  };

  const confirmarAccionModal = async () => {
    if (!seleccionId) {
      showAlert("Debes seleccionar un destino", "warning");
      return;
    }

    // Buscamos el nombre del destino para la alerta antes de cerrar el modal
    const nombreDestino = modalEntregaAbierto
      ? puntosLibres.find(p => String(p.id) === String(seleccionId))?.nombre
      : depositosDisponibles.find(d => String(d.id) === String(seleccionId))?.nombre;

    const esEntrega = modalEntregaAbierto;
    const exito = await handleConfirmarAccion(esEntrega, vehiculoSeleccionado, seleccionId);

    if (exito) {
      setModalEntregaAbierto(false);
      setModalDespachoAbierto(false);
      setVehiculoSeleccionado(null);
      setSeleccionId('');

      showAlert(
        `${esEntrega ? 'Entrega' : 'Despacho'} confirmado: ${vehiculoSeleccionado?.patente} -> ${nombreDestino}`,
        "success"
      );
    } else {
      showAlert("Hubo un error al procesar la solicitud", "error");
    }
  };

  const onDelete = async (id) => {
    await handleEliminar(id);
  };

  // --- RENDERIZADO CONDICIONAL ---
  const renderContenido = () => {
    if (cargando) return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
      </div>
    );

    const propsComunes = { datos: datosFiltrados, onEliminar: onDelete };

    switch (seccion) {
      case 'vehiculos':
        return (
          <VistaVehiculos
            {...propsComunes}
            depositos={depositosDisponibles}
            onAbrirDespacho={abrirDespacho}
            onAbrirEntrega={abrirEntrega}
            onQuitarPunto={handleQuitarPuntoManual}
          />
        );
      case 'depositos':
        return (
          <VistaDepositos
            {...propsComunes}
            vehiculos={vehiculosTodos}
          />
        );
      case 'puntos':
        return (
          <VistaPuntosEntrega
            {...propsComunes}
            vehiculos={vehiculosTodos}
          />
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 bg-slate-50/50 min-h-screen">

      {/* HEADER & TABS */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <nav className="flex bg-white p-1.5 rounded-2xl border shadow-sm gap-1">
          {[
            { id: 'vehiculos', icon: Truck, label: 'Vehículos' },
            { id: 'depositos', icon: Home, label: 'Depósitos' },
            { id: 'puntos', icon: MapPin, label: 'Puntos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSeccion(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${seccion === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-medium"
            placeholder={`Buscar en ${seccion}...`}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA FORMULARIO */}
        <aside className="lg:col-span-4">
          <FormularioLogistica
            seccion={seccion}
            formulario={formulario}
            setFormulario={setFormulario}
            depositos={depositosDisponibles}
            onGuardar={async (e) => {
              await handleGuardarNuevo(e, formulario, setFormulario);
            }}
          />
        </aside>

        {/* COLUMNA LISTADO */}
        <section className="lg:col-span-8 space-y-5">
          <div className="flex items-center gap-2 mb-2 ml-1 text-slate-400">
            <List size={20} />
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Gestión de {seccion}</h3>
          </div>
          {renderContenido()}
        </section>
      </main>

      {/* MODALES */}
      <ModalDespacho
        isOpen={modalDespachoAbierto}
        onClose={() => setModalDespachoAbierto(false)}
        vehiculo={vehiculoSeleccionado}
        depositos={depositosDisponibles}
        seleccionId={seleccionId}
        setSeleccionId={setSeleccionId}
        onConfirm={confirmarAccionModal}
      />

      <ModalEntrega
        isOpen={modalEntregaAbierto}
        onClose={() => setModalEntregaAbierto(false)}
        vehiculo={vehiculoSeleccionado}
        puntos={puntosLibres}
        seleccionId={seleccionId}
        setSeleccionId={setSeleccionId}
        onConfirm={confirmarAccionModal}
      />
    </div>
  );
};

export default GestionLogistica;