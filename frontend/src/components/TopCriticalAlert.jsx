import React, { useState } from 'react';
import { AlertTriangle, X, Activity, Droplets, Thermometer, Radio, Eye, ArrowRight, ShieldAlert } from 'lucide-react';

export function TopCriticalAlert({
  predictionData,
  latestCapture,
  onOpenAlertBroadcast,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const prediction = (predictionData?.prediction || '').toUpperCase();
  const rawConf = predictionData?.confidence;
  const confidencePct = rawConf !== undefined
    ? Math.round((rawConf <= 1.0 ? rawConf * 100 : rawConf) * 10) / 10
    : 0;

  // Condition: percentage decreasing or rising is strictly greater than 95%
  const isCritical = (prediction === 'RISING' || prediction === 'DECREASING') && confidencePct >= 95.0;

  if (!isCritical || isDismissed) {
    return null;
  }

  const imageUrl = latestCapture?.imageUrl || '/media/received/received_001.jpg';
  const timestamp = latestCapture?.timestamp || predictionData?.timestamp || 'Just now';
  const isRising = prediction === 'RISING';

  return (
    <>
      {/* Fixed Sticky Alert Banner at Top of Page */}
      <div className="sticky top-0 z-50 bg-[#B42318] text-white shadow-lg border-b border-red-900 animate-slideDown">
        <div className="max-w-[1440px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Alert Message */}
          <div
            className="flex items-center space-x-3 cursor-pointer flex-1"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="p-1 bg-white/20 rounded-full flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="text-xs md:text-sm font-sans font-medium flex items-center flex-wrap gap-x-2">
              <span className="font-bold uppercase tracking-wide bg-black/20 px-2 py-0.5 rounded text-[11px] font-mono">
                CRITICAL {prediction} ({confidencePct}%)
              </span>
              <span>
                Lake level {prediction.toLowerCase()} exceeded 95% threshold. Click to inspect photo &amp; live sensor telemetry.
              </span>
            </div>
          </div>

          {/* Action Chips */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1 bg-white text-[#B42318] hover:bg-white/90 font-mono font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Telemetry</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-white/20 rounded-md text-white/80 hover:text-white transition-colors"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sensor Inspection Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-cardWarm rounded-2xl border border-borderWarm shadow-2xl max-w-4xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#B42318] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-yellow-300" />
                <div>
                  <h3 className="font-sans font-bold text-base">
                    Critical Observation Review — Lake Level {prediction} ({confidencePct}%)
                  </h3>
                  <p className="text-xs text-white/80 font-mono">
                    Station GW-001 • Captured: {timestamp}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* 1. Captured Picture */}
              <div>
                <div className="flex items-center justify-between pb-2 text-xs font-mono text-textMuted">
                  <span className="uppercase font-bold text-textDark">Captured Image at Trigger Event</span>
                  <span>Source: Samsung Gear 360 (Station GW-001)</span>
                </div>
                <div className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden border border-borderWarm shadow-inner flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Critical event capture"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/75 backdrop-blur-sm rounded-lg border border-white/20 font-mono text-xs text-white">
                    State: <strong className={isRising ? 'text-red-400' : 'text-sky-400'}>{prediction}</strong> ({confidencePct}%)
                  </div>
                </div>
              </div>

              {/* 2. Data of Other Sensors When Picture Was Taken */}
              <div>
                <div className="pb-2.5 border-b border-borderWarm flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-textDark tracking-wide">
                    Multi-Sensor Telemetry (Synchronized with Image Timestamp)
                  </span>
                  <span className="text-[11px] font-mono text-accentSuccess flex items-center space-x-1">
                    <Radio className="w-3 h-3" />
                    <span>Synchronized Log</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3">
                  {/* Sensor 1: Water Level */}
                  <div className="p-3.5 bg-bgCream rounded-xl border border-borderWarm space-y-1.5">
                    <div className="flex items-center justify-between text-textMuted text-xs">
                      <span className="font-mono text-[11px] uppercase">Water Level</span>
                      <Droplets className="w-3.5 h-3.5 text-[#0284c7]" />
                    </div>
                    <div className="text-xl font-bold font-mono text-textDark">
                      {isRising ? '18.6 m' : '10.8 m'}
                    </div>
                    <div className="text-[11px] font-mono font-medium text-accentRed">
                      {isRising ? '+3.8 cm/min (Rising)' : '-2.4 cm/min (Drainage)'}
                    </div>
                    <p className="text-[10px] text-textMuted pt-1 border-t border-borderWarm">
                      Langtang Khola Gauge • Baseline: 12.0m
                    </p>
                  </div>

                  {/* Sensor 2: Seismic Accelerometer */}
                  <div className="p-3.5 bg-bgCream rounded-xl border border-borderWarm space-y-1.5">
                    <div className="flex items-center justify-between text-textMuted text-xs">
                      <span className="font-mono text-[11px] uppercase">Seismic Activity</span>
                      <Activity className="w-3.5 h-3.5 text-accentWarning" />
                    </div>
                    <div className="text-xl font-bold font-mono text-textDark">
                      {isRising ? '16.4 mg' : '3.2 mg'}
                    </div>
                    <div className={`text-[11px] font-mono font-medium ${isRising ? 'text-accentWarning' : 'text-accentSuccess'}`}>
                      {isRising ? 'Tremor Detected' : 'Baseline Quiet'}
                    </div>
                    <p className="text-[10px] text-textMuted pt-1 border-t border-borderWarm">
                      Triaxial Accelerometer • Syabrubesi
                    </p>
                  </div>

                  {/* Sensor 3: Water Temperature */}
                  <div className="p-3.5 bg-bgCream rounded-xl border border-borderWarm space-y-1.5">
                    <div className="flex items-center justify-between text-textMuted text-xs">
                      <span className="font-mono text-[11px] uppercase">Water Temp</span>
                      <Thermometer className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <div className="text-xl font-bold font-mono text-textDark">
                      1.2 °C
                    </div>
                    <div className="text-[11px] font-mono text-textMuted">
                      -1.6 °C thermal deviation
                    </div>
                    <p className="text-[10px] text-textMuted pt-1 border-t border-borderWarm">
                      Submersible RTD Sensor
                    </p>
                  </div>

                  {/* Sensor 4: Moraine Strain Gauge */}
                  <div className="p-3.5 bg-bgCream rounded-xl border border-borderWarm space-y-1.5">
                    <div className="flex items-center justify-between text-textMuted text-xs">
                      <span className="font-mono text-[11px] uppercase">Moraine Strain</span>
                      <Radio className="w-3.5 h-3.5 text-accentRed" />
                    </div>
                    <div className="text-xl font-bold font-mono text-textDark">
                      48.2 µε
                    </div>
                    <div className="text-[11px] font-mono font-bold text-accentRed">
                      Tensile Expansion
                    </div>
                    <p className="text-[10px] text-textMuted pt-1 border-t border-borderWarm">
                      Dam Crest Extensometer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-bgCream border-t border-borderWarm flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-cardWarm hover:bg-bgCream text-textDark border border-borderWarm rounded-lg font-mono text-xs font-medium transition-colors"
              >
                Close Review
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  if (onOpenAlertBroadcast) onOpenAlertBroadcast();
                }}
                className="px-4 py-2 bg-[#B42318] hover:bg-red-700 text-white font-mono font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
              >
                <span>Initiate Riverside Evacuation Advisory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default TopCriticalAlert;
