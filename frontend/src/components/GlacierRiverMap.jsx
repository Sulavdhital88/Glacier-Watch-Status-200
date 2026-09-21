import React, { useState } from 'react';
import { Compass, Waves, MapPin, Info, AlertTriangle, ShieldCheck, Clock, ArrowDownRight } from 'lucide-react';

export function GlacierRiverMap({ dangerLevel = 'NORMAL', className = '' }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showSimulatedWave, setShowSimulatedWave] = useState(false);

  const isDanger = dangerLevel === 'DANGER';
  const isWarning = dangerLevel === 'WARNING';

  // River checkpoints downstream from the glacier lake
  const checkpoints = [
    {
      id: 'lake',
      name: 'Lirung Glacial Lake',
      role: 'Source Basin',
      elevation: '4,560 m',
      distance: '0 km',
      eta: 'Origin',
      x: 610,
      y: 140,
      desc: 'High-altitude moraine-dammed glacial lake monitored by Samsung Gear 360 camera.',
    },
    {
      id: 'kyanjin',
      name: 'Kyanjin Valley',
      role: 'Upper Settlement',
      elevation: '3,870 m',
      distance: '4.2 km',
      eta: 'T+12 min',
      x: 570,
      y: 390,
      desc: 'First inhabited tourist village downstream. Evacuation zone 1.',
    },
    {
      id: 'ghora',
      name: 'Ghora Tabela Gorge',
      role: 'Narrow Defile',
      elevation: '3,020 m',
      distance: '11.5 km',
      eta: 'T+28 min',
      x: 510,
      y: 540,
      desc: 'High-velocity hydraulic choke point with rapid water rise amplification.',
    },
    {
      id: 'lama',
      name: 'Lama Hotel Rapids',
      role: 'Mid-Valley Crossing',
      elevation: '2,470 m',
      distance: '18.1 km',
      eta: 'T+45 min',
      x: 460,
      y: 720,
      desc: 'Suspension bridge and riverside lodge clusters.',
    },
    {
      id: 'syabru',
      name: 'Syabrubesi Confluence',
      role: 'Regional Hub',
      elevation: '1,503 m',
      distance: '28.4 km',
      eta: 'T+75 min',
      x: 385,
      y: 1090,
      desc: 'Main highway junction and major population center with hydro intake.',
    },
    {
      id: 'betrawati',
      name: 'Betrawati Lowlands',
      role: 'Downstream Basin',
      elevation: '620 m',
      distance: '45.0 km',
      eta: 'T+120 min',
      x: 290,
      y: 1570,
      desc: 'Broad alluvial plains connecting into Trishuli River downstream basin.',
    },
  ];

  // Colors based on danger status
  const riverColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#06b6d4';
  const riverGlow = isDanger ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.35)' : 'rgba(6, 182, 212, 0.3)';

  return (
    <div className={`bg-[#0d161b] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col ${className}`}>
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#111c23]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-white tracking-wide flex items-center space-x-2">
              <span>GLACIAL LAKE &amp; DOWNSTREAM RIVER PATH</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                FLOOD TRAJECTORY
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Lirung Lake (4,560m) → Langtang Khola → Trishuli River Basin
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowSimulatedWave(!showSimulatedWave)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors border ${
              showSimulatedWave
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            {showSimulatedWave ? 'Flood Wave: Active' : 'Simulate Wave'}
          </button>
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="relative w-full flex-1 min-h-[420px] bg-[#070e12] overflow-hidden select-none">
        <svg
          viewBox="0 0 1200 1600"
          className="w-full h-full object-contain"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="glacierLakeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#a5f3fc" />
              <stop offset="45%" stop-color="#22d3ee" />
              <stop offset="85%" stop-color="#0891b2" />
              <stop offset="100%" stop-color="#0e7490" />
            </radialGradient>

            <linearGradient id="activeRiverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color={isDanger ? '#f87171' : isWarning ? '#fbbf24' : '#38bdf8'} />
              <stop offset="35%" stop-color={riverColor} />
              <stop offset="100%" stop-color={isDanger ? '#b91c1c' : isWarning ? '#b45309' : '#0284c7'} />
            </linearGradient>

            <filter id="riverGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <pattern id="cleanGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="1" />
            </pattern>
          </defs>

          {/* Minimal grid */}
          <rect width="1200" height="1600" fill="url(#cleanGrid)" />

          {/* River Corridor Basin Shade */}
          <path
            d="M 660,180 Q 720,280 620,380 T 560,520 T 510,700 T 440,890 T 420,1080 T 430,1260 T 360,1440 T 320,1600
               L 240,1600 Q 280,1440 330,1260 T 340,1080 T 350,890 T 410,700 T 450,520 T 520,380 T 560,280 Z"
            fill="rgba(6, 182, 212, 0.04)"
          />

          {/* 1. Downstream River Path (Ambient Glow) */}
          <path
            d="M 610,210 Q 640,290 570,390 T 510,540 T 460,720 T 400,910 T 385,1090 T 395,1270 T 330,1440 T 290,1600"
            fill="none"
            stroke={riverColor}
            stroke-width="28"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.2"
            filter="url(#riverGlowFilter)"
          />

          {/* 2. Downstream River Path (Main Flow Line) */}
          <path
            d="M 610,210 Q 640,290 570,390 T 510,540 T 460,720 T 400,910 T 385,1090 T 395,1270 T 330,1440 T 290,1600"
            fill="none"
            stroke="url(#activeRiverGrad)"
            stroke-width="12"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          {/* 3. Luminous Core Stream Line */}
          <path
            d="M 610,210 Q 640,290 570,390 T 510,540 T 460,720 T 400,910 T 385,1090 T 395,1270 T 330,1440 T 290,1600"
            fill="none"
            stroke="#ffffff"
            stroke-width="3"
            stroke-linecap="round"
            opacity={showSimulatedWave ? '1' : '0.75'}
            stroke-dasharray={showSimulatedWave ? '16,12' : 'none'}
            className={showSimulatedWave ? 'animate-pulse' : ''}
          />

          {/* Flow Direction Arrows */}
          <g fill={riverColor} opacity="0.85">
            <path d="M 570,440 L 562,458 L 578,458 Z" transform="rotate(28, 570, 450)" />
            <path d="M 480,630 L 472,648 L 488,648 Z" transform="rotate(24, 480, 640)" />
            <path d="M 425,820 L 417,838 L 433,838 Z" transform="rotate(18, 425, 830)" />
            <path d="M 388,1000 L 380,1018 L 396,1018 Z" transform="rotate(8, 388, 1010)" />
            <path d="M 390,1180 L 382,1198 L 398,1198 Z" transform="rotate(5, 390, 1190)" />
            <path d="M 355,1360 L 347,1378 L 363,1378 Z" transform="rotate(20, 355, 1370)" />
            <path d="M 305,1520 L 297,1538 L 313,1538 Z" transform="rotate(14, 305, 1530)" />
          </g>

          {/* 4. MAIN GLACIER LAKE (Source) */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedPoint(checkpoints[0])}
          >
            {/* Outer Aura */}
            <ellipse cx="610" cy="140" rx="140" ry="85" fill="#06b6d4" opacity="0.15" filter="url(#riverGlowFilter)" />

            {/* Lake Polygon */}
            <path
              d="M 520,110 C 580,75 690,80 725,120 C 750,155 700,195 625,205 C 545,215 480,175 490,140 C 495,120 505,115 520,110 Z"
              fill="url(#glacierLakeGlow)"
              stroke="#67e8f9"
              stroke-width="3.5"
            />

            {/* Internal Ripples */}
            <ellipse cx="610" cy="142" rx="65" ry="32" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.7" />
            <circle cx="610" cy="142" r="6" fill="#ffffff" />
            <circle cx="610" cy="142" r="16" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.8" className="animate-ping" style={{ transformOrigin: '610px 142px' }} />
          </g>

          {/* 5. Checkpoints Markers along the River Path */}
          {checkpoints.map((pt, idx) => {
            const isSelected = selectedPoint?.id === pt.id;
            const isOrigin = idx === 0;

            return (
              <g
                key={pt.id}
                className="cursor-pointer group"
                onClick={() => setSelectedPoint(pt)}
              >
                {/* Node point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isOrigin ? 8 : 6}
                  fill={isOrigin ? '#22d3ee' : isSelected ? '#ffffff' : '#38bdf8'}
                  stroke="#0b1318"
                  stroke-width="2"
                />

                {/* Minimal Label Badge beside River */}
                <g transform={`translate(${pt.x + (isOrigin ? 95 : 60)}, ${pt.y})`}>
                  <rect
                    x="0"
                    y="-18"
                    width={isOrigin ? 270 : 210}
                    height="36"
                    rx="6"
                    fill={isSelected ? '#1e293b' : '#0c161d'}
                    stroke={isSelected ? '#38bdf8' : 'rgba(255,255,255,0.12)'}
                    stroke-width={isSelected ? '2' : '1'}
                    className="transition-colors group-hover:stroke-cyan-400"
                  />
                  <text
                    x="12"
                    y="-2"
                    fill="#ffffff"
                    font-family="system-ui, sans-serif"
                    font-size="12"
                    font-weight="bold"
                  >
                    {pt.name}
                  </text>
                  <text
                    x="12"
                    y="12"
                    fill={isOrigin ? '#67e8f9' : '#94a3b8'}
                    font-family="monospace"
                    font-size="10"
                  >
                    {pt.elevation} • {pt.distance} • {pt.eta}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Checkpoint Card Overlay */}
        {selectedPoint && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-[#0f1b22]/95 border border-cyan-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-fadeIn text-white">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  {selectedPoint.role}
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedPoint.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-1.5 py-0.5 bg-white/5 rounded"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">{selectedPoint.desc}</p>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/10 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Elevation</span>
                <span className="font-semibold text-cyan-300">{selectedPoint.elevation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Distance</span>
                <span className="font-semibold text-slate-200">{selectedPoint.distance}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Wave ETA</span>
                <span className="font-semibold text-amber-400">{selectedPoint.eta}</span>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Bottom Legend */}
        <div className="absolute bottom-3 right-3 bg-[#081116]/90 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-300 flex items-center space-x-4 backdrop-blur-sm">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#22d3ee]" />
            <span>Glacier Lake Origin</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-1 rounded bg-cyan-500 inline-block" />
            <span>Downstream River Path</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default GlacierRiverMap;
