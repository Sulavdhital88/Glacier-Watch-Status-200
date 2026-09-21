import React, { useState } from 'react';
import { Bot, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Eye, RefreshCw, UserCheck } from 'lucide-react';

export function AgentMonitoringCard({
  agentState,
  onVerify,
  onDismiss,
  onScrollToAlert,
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [operatorName, setOperatorName] = useState('Duty Officer');
  const [actionLoading, setActionLoading] = useState(false);

  const state = agentState?.state || 'REVIEW_REQUIRED';
  const risk = agentState?.risk_level || 'HIGH';
  const nextAction = agentState?.next_action || 'REQUEST_HUMAN_VERIFICATION';
  const assessment = agentState?.assessment || 'MULTIPLE ABNORMAL INDICATORS DETECTED';
  const reasons = agentState?.reasons || [];
  const evidence = agentState?.evidence || {};

  const handleConfirmVerify = async () => {
    setActionLoading(true);
    try {
      await onVerify(operatorName, 'Verified moraine breach threat from multi-signal correlation');
      setIsVerifying(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDismiss = async () => {
    setActionLoading(true);
    try {
      await onDismiss(operatorName, 'Dismissed by on-duty operator: no immediate danger');
      setIsDismissing(false);
    } finally {
      setActionLoading(false);
    }
  };

  // State color badges
  const getStateBadge = () => {
    switch (state) {
      case 'REVIEW_REQUIRED':
        return 'bg-lightRed text-accentRed border-accentRed/30 animate-pulse';
      case 'VERIFIED':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'ALERT_SENT':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'UNCERTAIN':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'INVESTIGATING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MONITORING':
      default:
        return 'bg-emerald-50 text-accentSuccess border-accentSuccess/30';
    }
  };

  const getRiskBadge = () => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-[#B42318] text-white';
      case 'HIGH':
        return 'bg-lightRed text-accentRed border-accentRed/30';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-emerald-50 text-accentSuccess border-accentSuccess/30';
    }
  };

  return (
    <div className="bg-cardWarm p-6 rounded-xl border-2 border-accentRed/30 shadow-card space-y-5 relative overflow-hidden">
      {/* Background ambient indicator */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accentRed/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-borderWarm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-lightRed rounded-lg text-accentRed flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-sans font-bold text-base text-textDark tracking-tight">
                GLACIERWATCH MONITORING AGENT
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-textMuted mt-0.5">
              Autonomous Decision &amp; Orchestration Layer (Perception ➔ Reasoning ➔ Action)
            </p>
          </div>
        </div>

        {/* State & Risk Pills */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="text-right font-mono text-xs">
            <span className="text-[10px] text-textMuted uppercase block">Agent State</span>
            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${getStateBadge()}`}>
              {state.replace('_', ' ')}
            </span>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-[10px] text-textMuted uppercase block">Risk Assessment</span>
            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${getRiskBadge()}`}>
              {risk}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Agent Core Assessment & Next Action */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Assessment Verdict (7 cols) */}
        <div className="md:col-span-7 p-4 bg-bgCream/60 rounded-xl border border-borderWarm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-textMuted uppercase tracking-wider">
              AGENT ASSESSMENT VERDICT
            </span>
            <span className="text-[10px] font-mono text-textMuted">
              Last Evaluated: {agentState?.last_evaluated || 'Just now'}
            </span>
          </div>

          <div className="text-sm md:text-base font-bold text-textDark flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-accentRed flex-shrink-0" />
            <span>{assessment}</span>
          </div>

          {/* Evidence Checklist */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase text-textMuted block">
              Multi-Signal Evidence Synthesis:
            </span>
            <ul className="space-y-1 text-xs text-textDark">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accentSuccess mt-0.5 flex-shrink-0" />
                  <span className="leading-snug">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Next Action & Human Verification (5 cols) */}
        <div className="md:col-span-5 p-4 bg-bgCream/40 rounded-xl border border-borderWarm flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] font-mono font-semibold text-textMuted uppercase tracking-wider block">
              RECOMMENDED NEXT ACTION
            </span>
            <div className="mt-2 p-2.5 bg-cardWarm rounded-lg border border-borderWarm text-xs font-mono font-bold text-textDark flex items-center space-x-2">
              <ArrowRight className="w-3.5 h-3.5 text-accentRed" />
              <span>{nextAction.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-[11px] text-textMuted mt-1.5 leading-relaxed">
              {state === 'REVIEW_REQUIRED'
                ? 'High-risk multi-hazard anomaly detected. The agent requests explicit human confirmation before unlocking public alert broadcast.'
                : state === 'VERIFIED'
                ? 'Incident confirmed by administrator. Emergency dispatch protocol unlocked.'
                : 'Routine temporal observation active. Next image ingest cycle scheduled.'}
            </p>
          </div>

          {/* Verification CTA Buttons */}
          {state === 'REVIEW_REQUIRED' && (
            <div className="pt-2 border-t border-borderWarm flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsVerifying(true)}
                className="flex-1 py-2 px-3 bg-accentRed hover:bg-accentRed/90 text-white font-sans font-bold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Verify Incident</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDismissing(true)}
                className="py-2 px-3 bg-cardWarm hover:bg-bgCream text-textDark border border-borderWarm font-sans font-medium text-xs rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {state === 'VERIFIED' && (
            <div className="pt-2 border-t border-borderWarm flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accentSuccess flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified by {agentState?.verified_by || 'Operator'}</span>
              </span>
              <button
                type="button"
                onClick={onScrollToAlert}
                className="text-xs font-bold text-accentRed underline hover:opacity-80"
              >
                Send Alerts ➔
              </button>
            </div>
          )}

          {state === 'MONITORING' && (
            <div className="pt-2 border-t border-borderWarm text-[11px] font-mono text-accentSuccess flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-accentSuccess"></span>
              <span>All signals within nominal safety envelopes</span>
            </div>
          )}
        </div>
      </div>

      {/* Human Verification Modal Dialog */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cardWarm max-w-md w-full p-6 rounded-xl border border-borderWarm shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-2 pb-3 border-b border-borderWarm">
              <ShieldAlert className="w-5 h-5 text-accentRed" />
              <h4 className="font-sans font-bold text-base text-textDark">
                Confirm GLOF Hazard Incident
              </h4>
            </div>

            <p className="text-xs text-textMuted leading-relaxed">
              You are verifying the multi-hazard anomaly detected by the monitoring agent. This will transition the agent to <strong>VERIFIED</strong> and unlock downstream cellular SMS broadcasting.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-textMuted uppercase mb-1">Operator Signature</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-3 py-2 bg-bgCream border border-borderWarm rounded-lg text-textDark focus:outline-none focus:border-accentRed"
                />
              </div>

              <div className="p-3 bg-lightRed/40 rounded-lg border border-accentRed/20 space-y-1">
                <span className="font-bold text-accentRed block">Evidence Summary:</span>
                <span className="text-[11px] text-textDark block">• Visual Observation: {evidence.visual_prediction} ({Math.round(evidence.visual_confidence * 100)}%)</span>
                <span className="text-[11px] text-textDark block">• Hydrological Level: {evidence.water_level} m (+{evidence.water_level_change} m)</span>
                <span className="text-[11px] text-textDark block">• Seismic Tremor: {evidence.earthquake_magnitude} M</span>
                <span className="text-[11px] text-textDark block">• Historical Precedents: 2 Floods / 1 No-Flood</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-borderWarm">
              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="px-3 py-1.5 text-xs font-sans text-textMuted hover:text-textDark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerify}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentRed hover:bg-accentRed/90 text-white font-sans font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Verifying...' : 'Confirm Verification'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human Dismissal Modal Dialog */}
      {isDismissing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cardWarm max-w-md w-full p-6 rounded-xl border border-borderWarm shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-2 pb-3 border-b border-borderWarm">
              <XCircle className="w-5 h-5 text-textMuted" />
              <h4 className="font-sans font-bold text-base text-textDark">
                Dismiss Incident Anomaly
              </h4>
            </div>

            <p className="text-xs text-textMuted leading-relaxed">
              Dismissing will log your operator decision and return the monitoring agent to <strong>ROUTINE MONITORING</strong>.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-borderWarm">
              <button
                type="button"
                onClick={() => setIsDismissing(false)}
                className="px-3 py-1.5 text-xs font-sans text-textMuted hover:text-textDark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDismiss}
                disabled={actionLoading}
                className="px-4 py-2 bg-textDark hover:bg-black text-white font-sans font-bold text-xs rounded-lg shadow-sm"
              >
                {actionLoading ? 'Dismissing...' : 'Dismiss & Return to Monitoring'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentMonitoringCard;
