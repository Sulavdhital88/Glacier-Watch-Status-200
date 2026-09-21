import React from 'react';
import { Droplets, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function WaterLevelCard({ waterData }) {
  const value = Number(waterData?.value_cm || 120.0);
  const rate = Number(waterData?.rate_of_rise_cm_min || 0.0);
  const isSimulated = waterData?.source === 'simulated';

  let status = 'NORMAL';
  let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let valueColor = 'text-white';

  if (value >= 180 || rate >= 2.0) {
    status = 'DANGER';
    badgeClass = 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
    valueColor = 'text-red-400';
  } else if (value >= 140 || rate >= 0.8) {
    status = 'WARNING';
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    valueColor = 'text-amber-300';
  }

  const isRising = rate > 0.05;
  const isFalling = rate < -0.05;

  return (
    <div className="bg-[#0d161b] p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Droplets className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans font-bold text-sm text-white tracking-wide">
            WATER LEVEL (HYDROLOGY)
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
          <span className="text-sm font-semibold text-slate-400 font-mono">cm</span>
        </div>

        {/* Rate of Change Callout */}
        <div className="text-right">
          <div className="flex items-center justify-end space-x-1 font-mono text-xs font-bold">
            {isRising ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
            ) : isFalling ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className={rate >= 1.0 ? 'text-red-400' : rate > 0.3 ? 'text-amber-400' : 'text-slate-300'}>
              {rate > 0 ? `+${rate.toFixed(2)}` : rate.toFixed(2)} cm/min
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Rate of rise</span>
        </div>
      </div>

      {/* Threshold Reference Indicator */}
      <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
        <span>Baseline: <strong>120 cm</strong></span>
        <span>Watch: <strong className="text-amber-400">140 cm</strong></span>
        <span>Danger: <strong className="text-red-400">180 cm</strong></span>
      </div>
    </div>
  );
}
export default WaterLevelCard;
