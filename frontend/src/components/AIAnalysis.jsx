import React from 'react';
import { Cpu, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export function AIAnalysis({ predictionData }) {
  const prediction = (predictionData?.prediction || 'DECREASING').toUpperCase();
  
  // Real ML Model Confidence percentage
  const rawConf = predictionData?.confidence;
  const confidencePct = rawConf !== undefined
    ? Math.round((rawConf <= 1.0 ? rawConf * 100 : rawConf) * 10) / 10
    : 90.0;

  // Real ML Model Dynamic Probabilities
  const rawProbs = predictionData?.probabilities || {};
  const getProbPct = (upperKey, lowerKey, fallbackFraction) => {
    const val = rawProbs[upperKey] !== undefined
      ? rawProbs[upperKey]
      : (rawProbs[lowerKey] !== undefined ? rawProbs[lowerKey] : fallbackFraction);
    return Math.round((val <= 1.0 ? val * 100 : val) * 10) / 10;
  };

  const probNormal = getProbPct('NORMAL', 'normal', 0.042);
  const probRising = getProbPct('RISING', 'rising', 0.024);
  const probDecreasing = getProbPct('DECREASING', 'decreasing', 0.934);

  const isRising = prediction === 'RISING';
  const statusLabel = isRising ? 'REVIEW REQUIRED' : 'MONITORING';
  const statusColor = isRising
    ? 'bg-lightRed text-accentRed border-accentRed/30'
    : 'bg-emerald-50 text-accentSuccess border-accentSuccess/30';

  const rows = [
    { label: 'Normal', value: probNormal, isWinner: prediction === 'NORMAL' },
    { label: 'Rising', value: probRising, isWinner: prediction === 'RISING' },
    { label: 'Decreasing', value: probDecreasing, isWinner: prediction === 'DECREASING' },
  ];

  return (
    <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-borderWarm">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-accentRed" />
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-textMuted">
            AI OBSERVATION
          </h3>
        </div>

        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-bgCream border border-borderWarm text-textMuted">
          PERCEPTION LAYER
        </span>
      </div>

      {/* Main State & Metric */}
      <div className="py-4 space-y-3">
        <div>
          <span className="text-xs font-mono text-textMuted uppercase block">
            Current Lake State
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-sans font-bold text-2xl md:text-3xl text-textDark tracking-tight">
              {prediction}
            </span>
            <div className="text-right">
              <span className="font-sans font-bold text-2xl md:text-3xl text-textDark tabular-nums">
                {confidencePct}%
              </span>
              <span className="text-[11px] text-textMuted block font-mono">Confidence</span>
            </div>
          </div>
        </div>

        {/* 3-Class Horizontal Probability Progress Bars */}
        <div className="space-y-2.5 pt-3 border-t border-borderWarm">
          {rows.map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className={r.isWinner ? 'font-bold text-textDark' : 'text-textMuted'}>
                  {r.label}
                </span>
                <span className={r.isWinner ? 'font-bold text-textDark' : 'text-textMuted'}>
                  {r.value}%
                </span>
              </div>
              <div className="h-2 w-full bg-bgCream rounded-full overflow-hidden border border-borderWarm">
                <div
                  style={{ width: `${r.value}%` }}
                  className={`h-full transition-all duration-300 rounded-full ${
                    r.isWinner
                      ? r.label === 'Rising'
                        ? 'bg-accentRed'
                        : 'bg-accentSuccess'
                      : 'bg-textMuted/30'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Guardrail & Status Note */}
      <div className="pt-3 border-t border-borderWarm flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-textMuted font-mono text-[11px]">Status:</span>
          <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] border ${statusColor}`}>
            ● {statusLabel}
          </span>
        </div>

        <span className="text-[11px] text-textMuted font-sans">
          Human verification required
        </span>
      </div>
    </div>
  );
}
export default AIAnalysis;
