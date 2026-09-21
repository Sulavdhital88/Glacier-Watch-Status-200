import React, { useState } from 'react';
import { Database, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck } from 'lucide-react';

export function HistoricalEvidenceCard({ evidence }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const similarEvents = evidence?.similar_events ?? 3;
  const floodEvents = evidence?.historical_flood_events ?? 2;
  const noFloodEvents = evidence?.historical_noflood_events ?? 1;

  const pastRecords = [
    {
      date: 'July 14, 2021',
      waterLevel: '14.4 m',
      quake: '4.8 M',
      outcome: 'FLOOD',
      notes: 'Moraine breach following seismic tremor and rapid water expansion.',
    },
    {
      date: 'August 02, 2019',
      waterLevel: '13.8 m',
      quake: '0.0 M',
      outcome: 'NO_FLOOD',
      notes: 'Seasonal snowmelt surge absorbed by natural spillway channel.',
    },
    {
      date: 'June 28, 2017',
      waterLevel: '14.5 m',
      quake: '4.5 M',
      outcome: 'FLOOD',
      notes: 'Sub-surface moraine piping triggered secondary outburst surge.',
    },
  ];

  return (
    <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-accentRed" />
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-textMuted">
            HISTORICAL EVIDENCE
          </h3>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
          PROTOTYPE DATA
        </span>
      </div>

      {/* Outcome Ratios */}
      <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
        <div className="p-2.5 bg-bgCream/50 rounded-lg border border-borderWarm">
          <span className="text-[10px] text-textMuted uppercase block">Similar Events</span>
          <span className="text-xl font-bold text-textDark">{similarEvents}</span>
        </div>
        <div className="p-2.5 bg-lightRed/40 rounded-lg border border-accentRed/20">
          <span className="text-[10px] text-accentRed uppercase block">Floods</span>
          <span className="text-xl font-bold text-accentRed">{floodEvents}</span>
        </div>
        <div className="p-2.5 bg-emerald-50 rounded-lg border border-accentSuccess/20">
          <span className="text-[10px] text-accentSuccess uppercase block">Safe / Drained</span>
          <span className="text-xl font-bold text-accentSuccess">{noFloodEvents}</span>
        </div>
      </div>

      {/* Comparison Verdict */}
      <div className="p-2.5 bg-bgCream/40 rounded-lg border border-borderWarm text-xs space-y-1">
        <div className="flex items-center justify-between font-mono">
          <span className="text-textMuted uppercase text-[10px]">Historical Risk Correlation:</span>
          <span className="font-bold text-accentRed">66.7% Flood Probability</span>
        </div>
        <p className="text-[11px] text-textMuted leading-relaxed">
          When high visual anomaly coincides with water level &gt; 14.0 m and recent seismic activity, historical precedents strongly favor proactive evacuation review.
        </p>
      </div>

      {/* Collapsible records list */}
      <div className="pt-2 border-t border-borderWarm">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-[11px] font-mono font-semibold text-textDark hover:text-accentRed flex items-center justify-between py-1"
        >
          <span>View 3 Historical Precedent Cases</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-2 text-xs font-mono animate-fadeIn">
            {pastRecords.map((rec, i) => (
              <div key={i} className="p-2.5 bg-cardWarm rounded-lg border border-borderWarm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-textDark">{rec.date}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      rec.outcome === 'FLOOD'
                        ? 'bg-lightRed text-accentRed border border-accentRed/30'
                        : 'bg-emerald-50 text-accentSuccess border border-accentSuccess/30'
                    }`}
                  >
                    {rec.outcome}
                  </span>
                </div>
                <div className="text-[10px] text-textMuted flex space-x-3">
                  <span>Level: {rec.waterLevel}</span>
                  <span>Quake: {rec.quake}</span>
                </div>
                <p className="text-[10px] text-textDark font-sans">{rec.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoricalEvidenceCard;
