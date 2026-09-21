import React from 'react';
import { Camera, Maximize2, Radio } from 'lucide-react';

export function ImageViewer({ capture, onOpenModal }) {
  const imageUrl = capture?.imageUrl || '/media/received/received_001.jpg';
  const timestamp = capture?.timestamp || '19:42:13';
  const station = capture?.station || 'Station GW-001';
  const source = capture?.source || 'Gear 360';

  return (
    <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-borderWarm">
        <div>
          <h3 className="font-sans font-bold text-base text-textDark">
            Live Monitoring
          </h3>
          <p className="text-xs text-textMuted mt-0.5">
            Latest image received from monitoring station
          </p>
        </div>

        {/* Small LIVE / RECEIVED badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-accentSuccess/30 text-accentSuccess rounded-full">
          <span className="w-2 h-2 rounded-full bg-accentSuccess animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
            ● LIVE
          </span>
        </div>
      </div>

      {/* Hero Image Container */}
      <div
        className="relative my-3.5 w-full aspect-[16/10] bg-bgCream rounded-lg overflow-hidden border border-borderWarm flex items-center justify-center cursor-pointer group"
        onClick={() => onOpenModal && onOpenModal(imageUrl)}
      >
        <img
          src={imageUrl}
          alt="Glacier Lake observation"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Hover inspect hint */}
        <div className="absolute inset-0 bg-textDark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-cardWarm/95 text-textDark px-3 py-1.5 rounded-lg text-xs font-medium shadow flex items-center space-x-1.5 border border-borderWarm">
            <Maximize2 className="w-3.5 h-3.5 text-accentRed" />
            <span>Click to expand</span>
          </span>
        </div>
      </div>

      {/* Meta Strip Under Image */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-borderWarm font-mono text-xs">
        <div>
          <span className="text-[10px] text-textMuted uppercase block">Monitoring Station</span>
          <span className="font-semibold text-textDark">{station}</span>
        </div>
        <div>
          <span className="text-[10px] text-textMuted uppercase block">Last Received</span>
          <span className="font-semibold text-textDark tabular-nums">{timestamp}</span>
        </div>
        <div>
          <span className="text-[10px] text-textMuted uppercase block">Source</span>
          <span className="font-semibold text-textDark">{source}</span>
        </div>
      </div>
    </div>
  );
}
export default ImageViewer;
