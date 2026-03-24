import L from 'leaflet';

export const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

export const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/606/606114.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

export const depotIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2312/2312701.png',
  iconSize: [35, 35],
  iconAnchor: [17, 17],
  popupAnchor: [0, -15],
});