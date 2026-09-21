import React from 'react';
import { ShieldAlert, CheckCircle2, Send, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export function AdminVerificationSection({
  dangerInfo,
  isConfirmed,
  onOpenReview,
  onOpenCitizenAlert,
}) {
  const { percentage = 0, level = 'NORMAL', reasons = [] } = dangerInfo || {};
  const isDanger = level === 'DANGER';
  const isWarning = level === 'WARNING';

  if (isConfirmed) {
    return (
      <div className="p-5 bg-emerald-950/30 border border-emerald-500/50 rounded-2xl shadow-xl text-white backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 uppercase">
                  Verified by Operator
                </span>
                <span className="text-xs text-slate-400 font-mono">Gatekeeper Check Passed</span>
              </div>
              <h3 className="font-sans font-bold text-base text-white mt-0.5">
                HAZARD CONFIRMED — CITIZEN SMS BROADCAST READY
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCitizenAlert}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold rounded-xl text-xs shadow-lg transition-all flex items-center space-x-2 border border-red-400/50 animate-pulse"
          >
            <Send className="w-4 h-4" />
            <span>TRANSMIT SMS BROADCAST</span>
          </button>
        </div>
      </div>
    );
  }

  if (isDanger || isWarning) {
    return (
      <div className="p-5 bg-[#141215] border border-red-500/40 rounded-2xl shadow-xl text-white backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center border border-red-500/40">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/40 uppercase">
                  Human-in-the-Loop Required
                </span>
                <span className="text-xs text-slate-400 font-mono">Risk Index: {percentage}%</span>
              </div>
              <h3 className="font-sans font-bold text-base text-white mt-0.5">
                ELEVATED THREAT DETECTED — OPERATOR AUDIT NEEDED
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenReview}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold rounded-xl text-xs shadow-lg transition-all flex items-center space-x-2 border border-red-400/50 hover:scale-[1.02]"
          >
            <UserCheck className="w-4 h-4" />
            <span>VERIFY &amp; AUDIT THREAT</span>
          </button>
        </div>
      </div>
    );
  }

  // Calm State
  return (
    <div className="p-4 bg-[#0d161b] border border-white/10 rounded-2xl shadow-md text-white flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="font-sans font-bold text-xs text-slate-300">
            OPERATOR GATEWAY ACTIVE
          </span>
          <p className="text-[11px] text-slate-500 font-mono">
            Safety protocol: AI model assists, operator verifies before any public advisory is broadcast.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenReview}
        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs rounded-lg border border-white/10 transition-colors"
      >
        Manual Review
      </button>
    </div>
  );
}
export default AdminVerificationSection;
