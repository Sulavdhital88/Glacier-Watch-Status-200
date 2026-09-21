import React, { useState, useEffect } from 'react';
import { Activity, Droplets, Thermometer, CloudRain, Snowflake, Cpu, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getSensors } from '../services/api';

export function SensorsPage() {
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await getSensors();
      setSensorData(data);
    }
    load();
  }, []);

  const water = sensorData?.waterLevel;
  const earthquake = sensorData?.earthquake;
  const temp = sensorData?.temperature;
  const snow = sensorData?.snowDepth;
  const rain = sensorData?.rainfall;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* Intro Banner: Multi-Signal Environmental Architecture */}
      <div className="bg-cardWarm p-6 rounded-xl border border-borderWarm shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider font-semibold">
            Environmental Telemetry Architecture
          </span>
          <h2 className="font-sans font-bold text-xl text-textDark mt-1">
            Multi-Hazard Sensor Scalability
          </h2>
          <p className="text-xs text-textMuted mt-1 max-w-2xl leading-relaxed">
            GlacierWatch integrates visual camera observations with hydrological and seismic telemetry to eliminate single-point false alarms and provide robust GLOF early advisories.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3.5 py-2 bg-bgCream border border-borderWarm rounded-lg flex-shrink-0">
          <Cpu className="w-4 h-4 text-accentRed" />
          <span className="text-xs font-mono font-medium text-textDark">
            5 Signals Planned (Simulated)
          </span>
        </div>
      </div>

      {/* Sensor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Water Level Gauge */}
        <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-[#0284c7]" />
              <h3 className="font-sans font-bold text-sm text-textDark">
                Water Level Gauge
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
              SIMULATED DATA
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xs font-mono text-textMuted uppercase block">Water Level</span>
              <span className="font-sans font-bold text-3xl text-textDark tabular-nums">
                {water?.value ?? 12.4}
              </span>
              <span className="text-sm font-semibold text-textMuted font-mono ml-1">{water?.unit ?? 'm'}</span>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-[10px] text-textMuted uppercase block">Rate of Change</span>
              <span className="font-bold text-accentRed">{water?.change ?? '+0.3 m'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-borderWarm text-[11px] font-mono text-textMuted flex justify-between">
            <span>Status: <strong className="text-textMuted">● PLANNED</strong></span>
            <span>Last Reading: {water?.lastReading ?? '19:41:52'}</span>
          </div>
        </div>

        {/* 2. Earthquake Sensor */}
        <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-accentWarning" />
              <h3 className="font-sans font-bold text-sm text-textDark">
                Earthquake Sensor
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
              SIMULATED DATA
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xs font-mono text-textMuted uppercase block">Current Activity</span>
              <span className="font-sans font-bold text-2xl text-textDark">
                {earthquake?.currentActivity ?? 'Normal'}
              </span>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-[10px] text-textMuted uppercase block">Magnitude</span>
              <span className="font-bold text-textDark">{earthquake?.magnitude ?? '--'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-borderWarm text-[11px] font-mono text-textMuted flex justify-between">
            <span>Status: <strong className="text-textMuted">● PLANNED</strong></span>
            <span>Last Reading: {earthquake?.lastReading ?? '19:38:21'}</span>
          </div>
        </div>

        {/* 3. Ambient Temperature */}
        <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-textDark" />
              <h3 className="font-sans font-bold text-sm text-textDark">
                Ambient Temperature
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
              SIMULATED DATA
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xs font-mono text-textMuted uppercase block">Air Temp</span>
              <span className="font-sans font-bold text-3xl text-textDark tabular-nums">
                {temp?.value ?? -4.2}
              </span>
              <span className="text-sm font-semibold text-textMuted font-mono ml-1">{temp?.unit ?? '°C'}</span>
            </div>
            <div className="text-right font-mono text-xs text-textMuted">
              <span>Freeze Boundary Active</span>
            </div>
          </div>

          <div className="pt-3 border-t border-borderWarm text-[11px] font-mono text-textMuted flex justify-between">
            <span>Status: <strong className="text-textMuted">● PLANNED</strong></span>
            <span>Last Reading: {temp?.lastReading ?? '19:42:00'}</span>
          </div>
        </div>

        {/* 4. Snow Depth Gauge */}
        <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
            <div className="flex items-center space-x-2">
              <Snowflake className="w-4 h-4 text-cyan-600" />
              <h3 className="font-sans font-bold text-sm text-textDark">
                Snow Depth Gauge
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
              SIMULATED DATA
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xs font-mono text-textMuted uppercase block">Snowpack Depth</span>
              <span className="font-sans font-bold text-3xl text-textDark tabular-nums">
                {snow?.value ?? 42}
              </span>
              <span className="text-sm font-semibold text-textMuted font-mono ml-1">{snow?.unit ?? 'cm'}</span>
            </div>
            <div className="text-right font-mono text-xs text-textMuted">
              <span>Upper Cirque</span>
            </div>
          </div>

          <div className="pt-3 border-t border-borderWarm text-[11px] font-mono text-textMuted flex justify-between">
            <span>Status: <strong className="text-textMuted">● PLANNED</strong></span>
            <span>Firmware V2</span>
          </div>
        </div>

        {/* 5. Rainfall & Precipitation */}
        <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
            <div className="flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-indigo-600" />
              <h3 className="font-sans font-bold text-sm text-textDark">
                Rainfall Pluviometer
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
              SIMULATED DATA
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xs font-mono text-textMuted uppercase block">Precipitation</span>
              <span className="font-sans font-bold text-3xl text-textDark tabular-nums">
                {rain?.value ?? 0.0}
              </span>
              <span className="text-sm font-semibold text-textMuted font-mono ml-1">{rain?.unit ?? 'mm/h'}</span>
            </div>
            <div className="text-right font-mono text-xs text-textMuted">
              <span>Clear Conditions</span>
            </div>
          </div>

          <div className="pt-3 border-t border-borderWarm text-[11px] font-mono text-textMuted flex justify-between">
            <span>Status: <strong className="text-textMuted">● PLANNED</strong></span>
            <span>Last Reading: {rain?.lastReading ?? '19:40:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SensorsPage;
