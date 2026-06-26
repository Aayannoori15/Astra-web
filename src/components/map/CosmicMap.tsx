'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useZenithStore } from '@/hooks/useZenithStore';
import { useISSTracking } from '@/hooks/useISSTracking';

// Fix default marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom zenith marker (glowing dot)
const zenithIcon = L.divIcon({
  html: `<div class="zenith-marker"></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ISS marker
const issIcon = L.divIcon({
  html: `
    <div style="position:relative;width:32px;height:32px">
      <div style="position:absolute;inset:0;border:2px solid #F59E0B;border-radius:50%;animation:blip-pulse 1.5s ease-in-out infinite;background:rgba(245,158,11,0.2)"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:18px">🛸</div>
    </div>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function ClickHandler() {
  const { setCoordinates } = useZenithStore();
  useMapEvents({
    click(e) {
      setCoordinates({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4)),
      });
    },
  });
  return null;
}

// Store ISS path history (recent ground track)
let issPathHistory: [number, number][] = [];

// Project the ISS's future ground track for the next N minutes using a
// simplified orbital model (92.68 min period, 51.6° inclination).
function projectFutureOrbit(
  curLat: number,
  curLng: number,
  minutesAhead = 90,
  steps = 60
): [number, number][] {
  const ORBIT_PERIOD = 92.68;
  const points: [number, number][] = [];

  const inclination = (51.6 * Math.PI) / 180;
  const phase = Math.asin(Math.min(1, Math.max(-1, curLat / 51.6)));

  for (let i = 0; i <= steps; i++) {
    const t = (minutesAhead * i) / steps;
    const angle = phase + (2 * Math.PI * t) / ORBIT_PERIOD;
    const lat = (Math.asin(Math.sin(angle) * Math.sin(inclination)) * 180) / Math.PI;
    const lngDrift = (360 * t) / 1436.1;
    // Keep longitude continuous to prevent the line from snapping across the screen
    const lng = curLng + (angle - phase) * (180 / Math.PI) * 0.85 - lngDrift;
    points.push([lat, lng]);
  }
  return points;
}

export default function CosmicMap() {
  useISSTracking();
  const { coordinates, issPosition } = useZenithStore();

  useEffect(() => {
    if (issPosition) {
      let newLng = issPosition.longitude;
      if (issPathHistory.length > 0) {
        const lastLng = issPathHistory[issPathHistory.length - 1][1];
        // Ensure continuous longitude to prevent horizontal lines wrapping across the map
        while (newLng - lastLng > 180) newLng -= 360;
        while (lastLng - newLng > 180) newLng += 360;
      }
      issPathHistory.push([issPosition.latitude, newLng]);
      if (issPathHistory.length > 40) issPathHistory.shift();
    }
  }, [issPosition]);

  const futureOrbit = issPosition
    ? projectFutureOrbit(issPosition.latitude, issPosition.longitude)
    : [];

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%', background: '#04060F' }}
      worldCopyJump
    >
      {/* Dark map tiles */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <ClickHandler />

      {/* User selected zenith point */}
      {coordinates && (
        <Marker position={[coordinates.lat, coordinates.lng]} icon={zenithIcon}>
          <Popup className="cosmic-popup">
            <div className="font-mono text-xs text-aurora">
              <strong>ZENITH POINT</strong><br />
              Lat: {coordinates.lat}°<br />
              Lng: {coordinates.lng}°
            </div>
          </Popup>
        </Marker>
      )}

      {/* ISS position */}
      {issPosition && (
        <>
          <Marker position={[issPosition.latitude, issPosition.longitude]} icon={issIcon}>
            <Popup>
              <div className="font-mono text-xs">
                <strong style={{ color: '#F59E0B' }}>ISS</strong><br />
                Lat: {issPosition.latitude.toFixed(2)}°<br />
                Lng: {issPosition.longitude.toFixed(2)}°<br />
                Alt: {issPosition.altitude} km<br />
                Vel: {issPosition.velocity} km/s
              </div>
            </Popup>
          </Marker>
          {issPathHistory.length > 1 && [-360, 0, 360].map((offset) => (
            <Polyline
              key={`history-${offset}`}
              positions={issPathHistory.map(([lat, lng]) => [lat, lng + offset])}
              color="#F59E0B"
              weight={1.5}
              opacity={0.5}
              dashArray="4 8"
            />
          ))}
          {/* Projected future ground track — next 90 minutes */}
          {futureOrbit.length > 1 && [-360, 0, 360].map((offset) => (
            <Polyline
              key={`future-${offset}`}
              positions={futureOrbit.map(([lat, lng]) => [lat, lng + offset])}
              color="#A78BFA"
              weight={1}
              opacity={0.35}
              dashArray="2 6"
            />
          ))}
        </>
      )}
    </MapContainer>
  );
}
