import React from 'react';
import { Activity } from 'lucide-react';

export function EarthquakeCard({ seismicData }) {
  const value = Number(seismicData?.peak_mg || 2.0);
  const isSimulated = seismicData?.source === 'simulated';

  let status = 'NORMAL';
  let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let levelText = 'Quiet Baseline';
  let valueColor = 'text-white';

  if (value >= 50) {
    status = 'DANGER';
    badgeClass = 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
    levelText = 'Strong Shaking';
    valueColor = 'text-red-400';
  } else if (value >= 15) {
    status = 'WARNING';
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    levelText = 'Tremor Detected';
    valueColor = 'text-amber-300';
  }

  return (
    <div className="bg-[#0d161b] p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans font-bold text-sm text-white tracking-wide">
            SEISMIC TELEMETRY
          </span>
          {isSimulated && (
            <span className="px-2 py-0.5 text-[9px] bg-white/5 text-slate-400 rounded-full font-mono border border-white/10">
              SIM
            </span>
          )}
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeClass}`}>
          ● {status}
        </span>
      </div>

      {/* Main Big Metric */}
      <div className="flex items-baseline justify-between pt-1">
        <div className="flex items-baseline space-x-2">
          <span className={`font-sans font-bold text-4xl md:text-5xl tabular-nums ${valueColor}`}>
            {value.toFixed(1)}
          </span>
          <span className="text-sm font-semibold text-slate-400 font-mono">mg</span>
        </div>

        <div className="text-right">
          <span className={`font-mono text-xs font-bold uppercase ${
            status === 'DANGER' ? 'text-red-400' : status === 'WARNING' ? 'text-amber-300' : 'text-emerald-400'
          }`}>
            {levelText}
          </span>
          <div className="text-[10px] text-slate-500 font-mono">Peak ground accel.</div>
        </div>
      </div>

      {/* Threshold Reference Indicator */}
      <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
        <span>Baseline: <strong>2 mg</strong></span>
        <span>Tremor: <strong className="text-amber-400">15 mg</strong></span>
        <span>Strong: <strong className="text-red-400">50 mg</strong></span>
      </div>
    </div>
  );
}
export default EarthquakeCard;
