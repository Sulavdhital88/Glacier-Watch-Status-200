// GlacierWatch Leaflet & OpenStreetMap Geographic Configuration

export const MONITORING_LOCATION = {
  lat: 28.2120,
  lng: 85.5580,
  name: "Glacier Lake Monitoring Station GW-001",
  region: "Langtang National Park, Rasuwa, Nepal",
  elevation: "4,560 m",
  zoom: 12,
};

export const LAKE_LOCATION = {
  lat: 28.2320,
  lng: 85.5580,
  name: "Lirung Glacial Lake",
  elevation: "4,560 m",
  type: "Moraine-Dammed Proglacial Lake",
};

export const STATION_LOCATION = {
  lat: 28.2250,
  lng: 85.5610,
  name: "Station GW-001",
  device: "Samsung Gear 360 + ESP32-S3",
  elevation: "4,320 m",
};

// Potential GLOF flood flow route downstream along Langtang Khola to Trishuli
export const FLOOD_PATH = [
  [28.2320, 85.5580], // Lake (Source)
  [28.2250, 85.5610], // Station GW-001
  [28.2120, 85.5710], // Kyanjin Valley (4 km, T+12m)
  [28.1890, 85.5180], // Ghora Tabela (11 km, T+28m)
  [28.1720, 85.4520], // Lama Hotel (18 km, T+45m)
  [28.1580, 85.3340], // Syabrubesi Settlement (28 km, T+75m)
  [28.0820, 85.2410], // Betrawati Basin (45 km, T+120m)
];

// Downstream settlements along potential flood path
export const DOWNSTREAM_SETTLEMENTS = [
  {
    id: "settle-1",
    name: "Kyanjin Valley",
    lat: 28.2120,
    lng: 85.5710,
    distance: "4.2 km",
    elevation: "3,870 m",
    waveEta: "T+12 min",
  },
  {
    id: "settle-2",
    name: "Ghora Tabela Gorge",
    lat: 28.1890,
    lng: 85.5180,
    distance: "11.5 km",
    elevation: "3,020 m",
    waveEta: "T+28 min",
  },
  {
    id: "settle-3",
    name: "Syabrubesi Settlement",
    lat: 28.1580,
    lng: 85.3340,
    distance: "28.4 km",
    elevation: "1,503 m",
    waveEta: "T+75 min",
  },
];
