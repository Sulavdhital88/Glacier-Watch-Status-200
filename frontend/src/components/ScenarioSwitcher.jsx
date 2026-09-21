import React from 'react';
import { Sliders, ShieldCheck, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';

export function ScenarioSwitcher({ activeScenario = 'investigation', onSelectScenario }) {
  const scenarios = [
    {
      id: 'investigation',
      label: 'Scenario C: Multi-Sensor Hazard (Default)',
      sub: 'Rising 95.4% + 14.4m (+0.6m) + 4.8M ➔ Review Required',
      badge: 'REVIEW REQUIRED',
      badgeColor: 'bg-lightRed text-accentRed border-accentRed/30',
    },
    {
      id: 'uncertain',
      label: 'Scenario B: Uncertain Observation',
      sub: 'Rising 58.4% (Weak confidence) ➔ Request More Data',
      badge: 'UNCERTAIN',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'normal',
      label: 'Scenario A: Normal Baseline',
      sub: 'Normal 94.2% + Stable level ➔ Continue Monitoring',
      badge: 'MONITORING',
      badgeColor: 'bg-emerald-50 text-accentSuccess border-accentSuccess/30',
    },
    {
      id: 'human_verified',
      label: 'Scenario D: Operator Verified',
      sub: 'Incident confirmed by operator ➔ Unlock Alert Dispatch',
      badge: 'VERIFIED',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    },
  ];

  return (
    <div className="bg-cardWarm p-4 rounded-xl border border-borderWarm shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-accentRed" />
          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-textDark">
            AGENT DEMO SCENARIO EVALUATOR
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bgCream border border-borderWarm text-textMuted font-bold">
          JUDGING TOOL
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => onSelectScenario(sc.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-lightRed/50 border-accentRed shadow-sm ring-1 ring-accentRed'
                  : 'bg-bgCream/40 border-borderWarm hover:bg-bgCream text-textDark'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-accentRed" />}
              </div>
              <span className="font-sans font-bold text-xs block text-textDark leading-tight">
                {sc.label}
              </span>
              <span className="text-[11px] text-textMuted font-mono block mt-1 leading-snug">
                {sc.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ScenarioSwitcher;
