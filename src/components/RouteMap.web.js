import L from 'leaflet';
import React, { useEffect } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_REGION } from '../config/constants';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

// Leaflet's default marker images break with bundlers, so use a CSS-only pin.
const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;background:#dc2626;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function Controller({ userLocation, route, follow, onSelectDestination }) {
  const map = useMap();
  const centered = React.useRef(false);

  // The container is sized by CSS after mount; make Leaflet re-measure it.
  useEffect(() => {
    const timers = [100, 500, 1500].map((ms) => setTimeout(() => map.invalidateSize(), ms));
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  useMapEvents({
    click: (e) => onSelectDestination({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
  });

  useEffect(() => {
    if (userLocation && !centered.current) {
      centered.current = true;
      map.setView([userLocation.latitude, userLocation.longitude], 15);
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (route.length > 1) {
      map.fitBounds(route.map((p) => [p.latitude, p.longitude]), { padding: [60, 60] });
    }
  }, [route, map]);

  useEffect(() => {
    if (follow && userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], Math.max(map.getZoom(), 17), { animate: true });
    }
  }, [follow, userLocation, map]);

  return null;
}

export default function RouteMap(props) {
  const { userLocation, destination, route, trail } = props;

  useEffect(() => {
    if (document.querySelector(`link[href="${LEAFLET_CSS}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }, []);

  const toPts = (pts) => pts.map((p) => [p.latitude, p.longitude]);

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 0, isolation: 'isolate', overflow: 'hidden' }}>
      <MapContainer center={[DEFAULT_REGION.latitude, DEFAULT_REGION.longitude]} zoom={12} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Controller {...props} />
        {route.length > 1 && <Polyline positions={toPts(route)} pathOptions={{ color: '#2563eb', weight: 6 }} />}
        {trail.length > 1 && <Polyline positions={toPts(trail)} pathOptions={{ color: '#16a34a', weight: 6 }} />}
        {destination && <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon} />}
        {userLocation && (
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={9}
            pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
