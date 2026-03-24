import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  upgrade: false
});

export const useTelemetria = () => {
  const [telemetria, setTelemetria] = useState({});
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));

    socket.on('tracking:update', (data) => {
      setTelemetria(prev => ({
        ...prev,
        [data.vehiculo_id]: {
          ...data,
          velocidad: data.evento === 'Regreso a Base' ? 0 : data.velocidad
        }
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('tracking:update');
    };
  }, []);

  const limpiarTelemetria = () => setTelemetria({});

  return { telemetria, conectado, limpiarTelemetria };
};