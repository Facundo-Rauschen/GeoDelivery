import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/api';
import { useAlerts } from '../features/gestion-flota/context/AlertContext'; 

export const useLogistica = (seccion) => {
  const { showAlert } = useAlerts();
  const [datos, setDatos] = useState([]);
  const [vehiculosTodos, setVehiculosTodos] = useState([]); 
  const [depositosDisponibles, setDepositosDisponibles] = useState([]);
  const [puntosLibres, setPuntosLibres] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      let res;
      if (seccion === 'vehiculos') res = await api.getVehiculos();
      else if (seccion === 'depositos') res = await api.getDepositos();
      else if (seccion === 'puntos') res = await api.getPuntosEntrega();
      setDatos(Array.isArray(res) ? res : (res?.data || []));

      const resVeh = await api.getVehiculos();
      setVehiculosTodos(Array.isArray(resVeh) ? resVeh : (resVeh?.data || []));

      const resDep = await api.getDepositos();
      setDepositosDisponibles(Array.isArray(resDep) ? resDep : (resDep?.data || []));
    } catch (error) {
      showAlert("Error de conexión", "error");
    } finally {
      setCargando(false);
    }
  }, [seccion, showAlert]);

  const cargarPuntosParaEntrega = async () => {
    try {
      const res = await api.getPuntosEntrega();
      const lista = Array.isArray(res) ? res : (res?.data || []);
      setPuntosLibres(lista);
    } catch (error) {
      showAlert("No se pudieron cargar los puntos de entrega", "error");
    }
  };

  const handleGuardarNuevo = async (e, formulario, setFormulario) => {
    e.preventDefault();
    try {
      if (seccion === 'vehiculos') {
        let patente = formulario.nombre.trim().toUpperCase().replace(/\s/g, '');
        if (!patente.includes('-') && patente.length === 6) {
          patente = `${patente.slice(0, 3)}-${patente.slice(3)}`;
        }
        await api.postVehiculo({
          patente,
          modelo: formulario.modelo.trim(),
          deposito_id: formulario.deposito_id ? parseInt(formulario.deposito_id) : null
        });
      } else {
        const payload = {
          nombre: formulario.nombre.trim(),
          lat: parseFloat(formulario.lat),
          lng: parseFloat(formulario.lng)
        };
        if (seccion === 'depositos') await api.postDeposito(payload);
        if (seccion === 'puntos') await api.postPuntoEntrega(payload);
      }

      setFormulario({ nombre: '', modelo: '', lat: '', lng: '', deposito_id: '' });
      await cargarDatos();
      showAlert("Registro guardado con éxito", "success");
    } catch (error) {
      const msg = error.response?.data?.error || "Error al registrar";
      showAlert(msg, "error");
    }
  };

  const handleEliminar = async (id) => {
    try {
      if (seccion === 'vehiculos') await api.deleteVehiculo(id);
      else if (seccion === 'depositos') await api.deleteDeposito(id);
      else if (seccion === 'puntos') await api.deletePuntoEntrega(id);
      await cargarDatos();
      showAlert("Eliminado correctamente", "success");
      return true;
    } catch (error) {
      showAlert("No se pudo eliminar el registro", "error");
      return false;
    }
  };

  const handleConfirmarAccion = async (esEntrega, vehiculo, seleccionId) => {
    if (!seleccionId) {
      showAlert("Seleccione un destino válido", "warning");
      return false;
    }
    setCargando(true);
    try {
      if (esEntrega) {
        await api.asignarEnvios(vehiculo.id, [parseInt(seleccionId)]);
      } else {
        await api.asignarVehiculoADeposito(vehiculo.id, parseInt(seleccionId));
      }
      await cargarDatos();
      return true;
    } catch (error) {
      showAlert("Error en la operación logística", "error");
      return false;
    } finally {
      setCargando(false);
    }
  };

  const handleQuitarPuntoManual = async (puntoId) => {
    try {
      await api.quitarPuntoEntregaDeVehiculo(parseInt(puntoId));
      await cargarDatos();
      showAlert("Punto desvinculado", "info");
    } catch (error) {
      showAlert("Error al quitar punto", "error");
    }
  };

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return {
    datos,
    vehiculosTodos,
    depositosDisponibles,
    puntosLibres,
    cargando,
    handleGuardarNuevo,
    handleEliminar,
    handleConfirmarAccion,
    handleQuitarPuntoManual,
    cargarPuntosParaEntrega
  };
};