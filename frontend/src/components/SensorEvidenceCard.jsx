import React from 'react';
import { Droplets, Activity, Thermometer, CloudRain, AlertCircle } from 'lucide-react';

export function SensorEvidenceCard({ evidence }) {
  const waterLevel = evidence?.water_level ?? 14.4;
  const waterChange = evidence?.water_level_change ?? 0.6;
  const earthquake = evidence?.earthquake_magnitude ?? 4.8;
  const isEarthquakeRecent = evidence?.earthquake_recent ?? true;

  return (
    <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-[#0284c7]" />
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-textMuted">
            SENSOR EVIDENCE
          </h3>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
          SIMULATED DATA
        </span>
      </div>

      {/* Sensor Metrics Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* 1. Water Level */}
        <div className="p-3 bg-bgCream/50 rounded-lg border border-borderWarm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-textMuted uppercase">Water Level</span>
            <span className="text-[10px] font-mono font-bold text-accentRed flex items-center">
              ↑ +{waterChange} m
            </span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-sans text-textDark tabular-nums">
              {waterLevel}
            </span>
            <span className="text-xs font-semibold text-textMuted font-mono">m</span>
          </div>
          <span className="text-[10px] text-accentRed font-mono block">
            Exceeds warning threshold (14.0 m)
          </span>
        </div>

        {/* 2. Seismic Activity */}
        <div className="p-3 bg-bgCream/50 rounded-lg border border-borderWarm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-textMuted uppercase">Seismic Activity</span>
            {isEarthquakeRecent && (
              <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                RECENT
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-sans text-textDark tabular-nums">
              {earthquake > 0 ? `${earthquake}` : '0.0'}
            </span>
            <span className="text-xs font-semibold text-textMuted font-mono">M</span>
          </div>
          <span className="text-[10px] text-textMuted font-mono block">
            {earthquake > 4.0 ? '14 km NW of Langtang Valley' : 'No recent tremors'}
          </span>
        </div>
      </div>

      {/* Auxiliary Context */}
      <div className="pt-2 border-t border-borderWarm flex items-center justify-between text-[11px] font-mono text-textMuted">
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Station ST-01 Langtang Khola</span>
        </span>
        <span>Telemetry Rate: 10s</span>
      </div>
    </div>
  );
}

export default SensorEvidenceCard;
