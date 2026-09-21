import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import {
  MONITORING_LOCATION,
  LAKE_LOCATION,
  FLOOD_PATH,
  DOWNSTREAM_SETTLEMENTS,
} from '../config/mapConfig';

// Custom Minimal Leaflet DivIcons
const lakeIcon = L.divIcon({
  className: 'custom-lake-icon',
  html: `
    <div style="
      width: 18px;
      height: 18px;
      background-color: #0284c7;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const settlementIcon = L.divIcon({
  className: 'custom-settlement-icon',
  html: `
    <div style="
      width: 12px;
      height: 12px;
      background-color: #241F1B;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    "></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export function MapView({
  location = MONITORING_LOCATION,
  floodPath = FLOOD_PATH,
  height = '360px',
}) {
  return (
    <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-borderWarm">
        <div>
          <h3 className="font-sans font-bold text-base text-textDark">
            Risk &amp; Flood Path
          </h3>
          <p className="text-xs text-textMuted mt-0.5">
            OpenStreetMap topographic overview &amp; potential GLOF trajectory
          </p>
        </div>

        <div className="text-[11px] font-mono text-textMuted flex items-center space-x-1">
          <Navigation className="w-3 h-3 text-textMuted" />
          <span>{location.region}</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative my-3.5 w-full rounded-lg overflow-hidden border border-borderWarm" style={{ height }}>
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={location.zoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* OpenStreetMap Clean Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Potential Flood Path Polyline (Red Accent #B42318) */}
          <Polyline
            positions={floodPath}
            pathOptions={{
              color: '#B42318',
              weight: 4,
              opacity: 0.9,
              dashArray: '8, 6',
            }}
          />

          {/* Lake Marker */}
          <Marker position={[LAKE_LOCATION.lat, LAKE_LOCATION.lng]} icon={lakeIcon}>
            <Popup>
              <div className="font-sans text-xs space-y-1">
                <strong className="text-textDark block text-sm">{LAKE_LOCATION.name}</strong>
                <p className="text-textMuted">Source Moraine Basin</p>
                <p className="font-mono text-xs">Elevation: {LAKE_LOCATION.elevation}</p>
              </div>
            </Popup>
          </Marker>

          {/* Downstream Settlements Along River Path */}
          {DOWNSTREAM_SETTLEMENTS.map((st) => (
            <Marker key={st.id} position={[st.lat, st.lng]} icon={settlementIcon}>
              <Popup>
                <div className="font-sans text-xs space-y-0.5">
                  <strong className="text-textDark block text-xs">{st.name}</strong>
                  <p className="text-textMuted font-mono">Distance: {st.distance} • {st.elevation}</p>
                  <p className="text-accentRed font-mono font-bold">Flood Wave ETA: {st.waveEta}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Small Elegant Legend */}
        <div className="absolute bottom-3 left-3 bg-cardWarm/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-borderWarm shadow-md text-[11px] font-mono text-textDark z-[1000] space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] inline-block border border-white" />
            <span>Glacier Lake (Source)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-0.5 bg-accentRed inline-block" />
            <span>Potential Flood Path</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-borderWarm flex items-center justify-between text-xs font-mono text-textMuted">
        <span>Path: Langtang Khola → Trishuli River</span>
        <span>Downstream Reach: 45.0 km</span>
      </div>
    </div>
  );
}
export default MapView;
