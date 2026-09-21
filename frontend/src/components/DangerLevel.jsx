import React from 'react';
import { AlertTriangle, ShieldCheck, VolumeX, AlertCircle, Activity } from 'lucide-react';

export function DangerLevel({ dangerInfo, isAlarmPlaying, onSilenceAlarm }) {
  const { percentage = 0, level = 'NORMAL', reasons = [] } = dangerInfo || {};

  const isDanger = level === 'DANGER';
  const isWarning = level === 'WARNING';

  const config = isDanger
    ? {
        border: 'border-red-500/50 bg-red-950/30',
        badge: 'bg-red-500 text-white animate-pulse',
        dot: 'bg-red-400',
        text: 'text-red-400',
        bar: 'bg-red-500',
        title: 'CRITICAL HAZARD — IMMEDIATE ACTION REQUIRED',
        desc: 'Elevated multi-hazard trigger detected across sensory & visual inputs.',
      }
    : isWarning
    ? {
        border: 'border-amber-500/40 bg-amber-950/20',
        badge: 'bg-amber-500 text-black',
        dot: 'bg-amber-400',
        text: 'text-amber-300',
        bar: 'bg-amber-500',
        title: 'ELEVATED WATCH — ABNORMAL BEHAVIOR DETECTED',
        desc: 'Visual lake changes or hydrological drift observed. Monitor closely.',
      }
    : {
        border: 'border-emerald-500/30 bg-emerald-950/20',
        badge: 'bg-emerald-600 text-white',
        dot: 'bg-emerald-400',
        text: 'text-emerald-400',
        bar: 'bg-emerald-500',
        title: 'ALL SYSTEMS NOMINAL — LAKE CONDITIONS CALM',
        desc: 'All monitored telemetry and visual classifications within safe baseline.',
      };

  return (
    <div className={`p-4 md:p-5 rounded-2xl border ${config.border} backdrop-blur-md transition-all shadow-lg`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Status Badge & Description */}
        <div className="flex items-start space-x-3.5">
          <div className="mt-0.5">
            {isDanger ? (
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
            ) : isWarning ? (
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${config.badge}`}>
                {level}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Risk Index: <strong className="text-white">{percentage}%</strong>
              </span>
            </div>
            <h2 className={`font-sans font-bold text-sm md:text-base mt-1 ${config.text}`}>
              {config.title}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 font-sans">
              {config.desc}
            </p>
          </div>
        </div>

        {/* Right: Progress Meter & Alarm Button */}
        <div className="flex items-center space-x-4 min-w-[240px]">
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Risk Meter</span>
              <span className="font-semibold text-white">{percentage}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${percentage}%` }}
                className={`h-full transition-all duration-500 rounded-full ${config.bar}`}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>0% Calm</span>
              <span>40% Watch</span>
              <span>70% Danger</span>
            </div>
          </div>

          {isAlarmPlaying && (
            <button
              type="button"
              onClick={onSilenceAlarm}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 shadow-md transition-colors animate-pulse"
              title="Silence alarm"
            >
              <VolumeX className="w-4 h-4" />
              <span>Silence</span>
            </button>
          )}
        </div>
      </div>

      {/* Trigger tags if abnormal */}
      {(isDanger || isWarning) && reasons.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Active Triggers:</span>
          {reasons.map((r, i) => (
            <span key={i} className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-white/10 text-slate-200 border border-white/10">
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
export default DangerLevel;
