import React from 'react';
import { Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { truckIcon, deliveryIcon, depotIcon } from './MapIcons';

export const DepositoMarkers = ({ depositos }) => (
  <>
    {depositos.map(dep => (
      <Marker key={`dep-${dep.id}`} position={[dep.lat, dep.lng]} icon={depotIcon}>
        <Popup><p className="font-bold m-0">{dep.nombre}</p></Popup>
      </Marker>
    ))}
  </>
);

export const VehiculoMarkers = ({ flotaReales }) => (
  <>
    {flotaReales.map(vehiculo => (
      <Marker
        key={`veh-${vehiculo.id}`}
        position={[parseFloat(vehiculo.lat), parseFloat(vehiculo.lng)]}
        icon={truckIcon}
      >
        <Popup>
          <div className="p-1">
            <p className="font-bold text-lg m-0">Vehículo #{vehiculo.id}</p>
            <div className="mt-2 text-[10px] font-bold p-1 rounded text-center uppercase bg-green-500 text-black">
              {vehiculo.evento || 'En ruta'}
            </div>
          </div>
        </Popup>
      </Marker>
    ))}
  </>
);

export const HistorialPaths = ({ historiales }) => (
  <>
    {Object.keys(historiales).map(vId => (
      historiales[vId] && historiales[vId].length > 1 && (
        <Polyline
          key={`poly-${vId}`}
          positions={historiales[vId]}
          pathOptions={{ color: '#39FF14', weight: 5, opacity: 0.8, lineJoin: 'round' }}
        />
      )
    ))}
  </>
);