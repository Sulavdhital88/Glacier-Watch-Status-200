import React from 'react';
import { Eye, Cpu, Database, Activity, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, XCircle, RotateCcw } from 'lucide-react';

export function AgentActivityLog({ activityLog = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case 'observation':
        return <Eye className="w-3.5 h-3.5 text-cyan-600" />;
      case 'perception':
        return <Cpu className="w-3.5 h-3.5 text-indigo-600" />;
      case 'action':
        return <ArrowRight className="w-3.5 h-3.5 text-accentRed" />;
      case 'evidence':
        return <Activity className="w-3.5 h-3.5 text-[#0284c7]" />;
      case 'historical':
        return <Database className="w-3.5 h-3.5 text-amber-600" />;
      case 'decision':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'escalation':
        return <AlertTriangle className="w-3.5 h-3.5 text-accentRed animate-pulse" />;
      case 'verification':
        return <UserCheck className="w-3.5 h-3.5 text-accentSuccess" />;
      case 'dismissal':
        return <XCircle className="w-3.5 h-3.5 text-textMuted" />;
      default:
        return <RotateCcw className="w-3.5 h-3.5 text-textMuted" />;
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'escalation':
        return 'bg-lightRed text-accentRed font-bold border border-accentRed/30';
      case 'verification':
        return 'bg-emerald-50 text-accentSuccess font-bold border border-accentSuccess/30';
      case 'decision':
        return 'bg-amber-100 text-amber-800 font-bold border border-amber-300';
      case 'perception':
        return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
      case 'historical':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      default:
        return 'bg-bgCream text-textDark border border-borderWarm';
    }
  };

  return (
    <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card flex flex-col justify-between space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
        <div>
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-textMuted">
            AGENT REASONING TIMELINE
          </h3>
          <p className="text-[11px] text-textMuted mt-0.5">
            Real-time Observe ➔ Analyze ➔ Decide ➔ Act step progression
          </p>
        </div>

        <span className="text-[11px] font-mono text-textMuted">
          Live Stream
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {activityLog && activityLog.length > 0 ? (
          activityLog.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-2.5 bg-bgCream/50 hover:bg-bgCream rounded-lg border border-borderWarm text-xs font-mono transition-colors flex items-start space-x-2.5"
            >
              <div className="mt-0.5 p-1 bg-cardWarm rounded border border-borderWarm flex-shrink-0">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider ${getBadgeStyle(item.type)}`}>
                    {item.type}
                  </span>
                  <span className="text-[10px] text-textMuted tabular-nums">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-textDark mt-1 leading-snug font-sans break-words">
                  {item.message}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-textMuted font-mono">
            No agent actions recorded yet.
          </div>
        )}
      </div>

      {/* Footer explanation for judges */}
      <div className="pt-2 border-t border-borderWarm text-[10px] font-mono text-textMuted flex items-center justify-between">
        <span>Autonomous Edge Orchestration Loop</span>
        <span className="text-accentSuccess">● Deterministic &amp; Auditable</span>
      </div>
    </div>
  );
}

export default AgentActivityLog;
