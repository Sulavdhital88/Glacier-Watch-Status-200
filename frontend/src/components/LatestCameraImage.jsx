import React, { useState, useEffect } from 'react';
import { Camera, Maximize2, AlertTriangle, CheckCircle, Clock, Eye, Cpu, BarChart2 } from 'lucide-react';

export function LatestCameraImage({ capture, onOpenLightbox }) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  const receivedAtStr = capture?.received_at;
  const imageUrl = capture?.image_url;
  const prediction = capture?.prediction;
  const label = prediction?.label || 'NORMAL';
  const confidence = prediction?.confidence ? Math.round(prediction.confidence * 100) : null;
  const probabilities = prediction?.probabilities || { DECREASING: 0.33, NORMAL: 0.34, RISING: 0.33 };
  const inferenceMs = prediction?.inference_ms || 45;

  useEffect(() => {
    if (!receivedAtStr) return;

    const calcAge = () => {
      try {
        const receivedTime = new Date(receivedAtStr).getTime();
        const diffSec = Math.max(0, Math.floor((Date.now() - receivedTime) / 1000));
        setSecondsAgo(diffSec);
      } catch (_) {
        setSecondsAgo(0);
      }
    };

    calcAge();
    const interval = setInterval(calcAge, 1000);
    return () => clearInterval(interval);
  }, [receivedAtStr]);

  const isDelayed = secondsAgo > 180;

  const formatAgeText = (secs) => {
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="bg-[#0d161b] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#111c23]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-white tracking-wide">
              LAKE CAMERA FEED
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Samsung Gear 360 • ESP-NOW Telemetry
            </p>
          </div>
        </div>

        {/* Latency / Ingestion status */}
        <div className="flex items-center space-x-2">
          {isDelayed ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Delayed ({formatAgeText(secondsAgo)})</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live ({formatAgeText(secondsAgo)})</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => onOpenLightbox(imageUrl)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10"
            title="Inspect full image"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Camera Image Display Frame */}
      <div
        className="relative w-full aspect-[16/10] bg-[#070e12] overflow-hidden flex items-center justify-center group cursor-pointer"
        onClick={() => onOpenLightbox(imageUrl)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Latest glacial lake capture"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="text-center p-8 text-slate-500 space-y-2 font-mono">
            <Eye className="w-8 h-8 mx-auto opacity-30 animate-pulse" />
            <p className="text-xs">Waiting for ESP camera transmission...</p>
          </div>
        )}

        {/* Hover Inspect Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-[#0e181e]/90 text-white text-xs px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 border border-white/20 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click to inspect 224x224 crop &amp; full frame</span>
          </span>
        </div>

        {/* Top-Right Badge: Active Classification */}
        {prediction && (
          <div className="absolute top-3 right-3 bg-[#0a1217]/90 text-white px-3 py-1 rounded-lg text-xs font-mono border border-white/15 shadow-md flex items-center space-x-2 backdrop-blur-sm">
            <span className="text-slate-400 text-[10px] uppercase">Prediction:</span>
            <strong className={`font-bold ${
              label === 'RISING'
                ? 'text-amber-400'
                : label === 'DECREASING'
                ? 'text-cyan-400'
                : 'text-emerald-400'
            }`}>
              {label}
            </strong>
            <span className="text-slate-300 font-semibold">({confidence}%)</span>
          </div>
        )}
      </div>

      {/* 3-Class AI Inference Probability Split */}
      <div className="p-4 bg-[#0e1920] border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>GLACIERWATCH 3-CLASS CLASSIFIER</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Latency: <strong className="text-slate-200">{inferenceMs} ms</strong>
          </span>
        </div>

        {/* 3 Progress Bars: NORMAL, RISING, DECREASING */}
        <div className="grid grid-cols-3 gap-3">
          {['NORMAL', 'RISING', 'DECREASING'].map((cls) => {
            const isWinner = label === cls;
            const probPct = Math.round((probabilities[cls] || 0) * 100);

            const barColor =
              cls === 'RISING'
                ? 'bg-amber-500'
                : cls === 'DECREASING'
                ? 'bg-cyan-500'
                : 'bg-emerald-500';

            const textColor =
              cls === 'RISING'
                ? 'text-amber-300'
                : cls === 'DECREASING'
                ? 'text-cyan-300'
                : 'text-emerald-300';

            return (
              <div
                key={cls}
                className={`p-2.5 rounded-xl border transition-all ${
                  isWinner
                    ? 'bg-white/5 border-cyan-500/50 shadow-sm'
                    : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
                  <span className={`font-semibold ${isWinner ? textColor : 'text-slate-400'}`}>
                    {cls}
                  </span>
                  <span className="font-bold text-white tabular-nums">{probPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${probPct}%` }}
                    className={`h-full transition-all duration-300 rounded-full ${barColor}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default LatestCameraImage;
