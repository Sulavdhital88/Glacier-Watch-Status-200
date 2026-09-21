// Map configuration for GlacierWatch Leaflet offline view

export const MAP_CONFIG = {
  // SVG or JPG map asset path
  imagePath: '/maps/rasuwa-riverside.svg',
  fallbackImagePath: '/maps/rasuwa-riverside.jpg',
  attribution: 'GlacierWatch Rasuwa Riverside Field Survey Map (Offline Demarcation)',
  // Natural coordinate bounds of the image (height, width)
  imageDimensions: {
    height: 1600,
    width: 1200,
  },
  initialCenter: [800, 600],
  initialZoom: -0.5,
  minZoom: -1.5,
  maxZoom: 2,

  // Multi-hazard station info markers (non-clickable)
  stations: [
    {
      id: 'stn_camera',
      name: 'Glacial Lake & Camera Station (Gear 360)',
      type: 'camera',
      x_pct: 54.0,
      y_pct: 10.5,
      elevation: '4,560m',
      source: 'gear360',
    },
    {
      id: 'stn_water',
      name: 'Hydrological Station (Langtang Khola)',
      type: 'water_level',
      x_pct: 46.0,
      y_pct: 32.0,
      elevation: '3,240m',
      source: 'simulated',
    },
    {
      id: 'stn_seismic',
      name: 'Seismic Telemetry Station (Syabrubesi)',
      type: 'seismic',
      x_pct: 35.0,
      y_pct: 64.0,
      elevation: '1,503m',
      source: 'simulated',
    },
  ],
};
