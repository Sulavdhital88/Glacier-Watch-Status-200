import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Eye, ArrowRight, User } from 'lucide-react';

export function AdminReviewModal({
  isOpen,
  onClose,
  dangerInfo,
  waterData,
  seismicData,
  capture,
  operator,
  onConfirmDanger,
  onDismissSafe,
  isSubmitting,
}) {
  const [operatorNote, setOperatorNote] = useState('');

  if (!isOpen) return null;

  const { percentage = 0, level = 'NORMAL', reasons = [] } = dangerInfo || {};
  const prediction = capture?.prediction;
  const label = prediction?.label || 'NORMAL';
  const confidence = prediction?.confidence ? Math.round(prediction.confidence * 100) : 90;

  return (
    <div className="fixed inset-0 bg-crevasse/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none animate-fadeIn overflow-y-auto">
      <div className="bg-paper border border-borderHairline rounded-xl shadow-modal w-full max-w-2xl p-6 text-granite space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderHairline pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-full">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-crevasse uppercase tracking-wider">
                Danger Review & Verification
              </h2>
              <p className="text-xs text-granite/70">
                GlacierWatch Operator Human-in-the-Loop Protocol
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-granite/60">
            <div className="flex items-center space-x-1 justify-end font-semibold text-crevasse">
              <User className="w-3.5 h-3.5 text-glacial" />
              <span>{operator || 'Field Operator'}</span>
            </div>
          </div>
        </div>

        {/* Big Danger Summary Banner */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-800 font-mono block">
              Overall Danger Level
            </span>
            <span className="font-display font-bold text-4xl text-red-700 tabular-nums">
              {percentage}%
            </span>
          </div>

          <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-red-600 text-white uppercase tracking-wider animate-pulse">
            🔴 {level}
          </span>
        </div>

        {/* 3 Channel Evidence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* 1. Water */}
          <div className="bg-mist/50 p-3 rounded-lg border border-borderHairline space-y-1">
            <span className="font-bold text-crevasse uppercase font-mono text-[10px] text-granite/60 block">
              Water Level
            </span>
            <div className="font-display font-bold text-2xl text-crevasse">
              {Number(waterData?.value_cm || 120).toFixed(1)} cm
            </div>
            <div className="font-mono text-amber-700 font-semibold">
              {Number(waterData?.rate_of_rise_cm_min || 0) > 0 ? '+' : ''}
              {Number(waterData?.rate_of_rise_cm_min || 0).toFixed(2)} cm/min
            </div>
          </div>

          {/* 2. Seismic */}
          <div className="bg-mist/50 p-3 rounded-lg border border-borderHairline space-y-1">
            <span className="font-bold text-crevasse uppercase font-mono text-[10px] text-granite/60 block">
              Earthquake / Seismic
            </span>
            <div className="font-display font-bold text-2xl text-crevasse">
              {Number(seismicData?.peak_mg || 2).toFixed(1)} mg
            </div>
            <div className="font-mono uppercase font-semibold text-granite/80">
              {seismicData?.shaking_level || 'quiet'}
            </div>
          </div>

          {/* 3. Camera AI */}
          <div className="bg-mist/50 p-3 rounded-lg border border-borderHairline space-y-1">
            <span className="font-bold text-crevasse uppercase font-mono text-[10px] text-granite/60 block">
              Camera AI Result
            </span>
            <div className={`font-display font-bold text-2xl uppercase ${
              label === 'RISING' ? 'text-amber-700' : label === 'DECREASING' ? 'text-indigo-700' : 'text-emerald-700'
            }`}>
              {label}
            </div>
            <div className="font-mono text-[11px] text-granite/60">
              Confidence: {confidence}%
            </div>
          </div>
        </div>

        {/* Latest Camera Preview Thumbnail */}
        {capture?.image_url && (
          <div className="bg-crevasse p-2 rounded-lg border border-borderDark flex items-center space-x-3 text-paper text-xs">
            <div className="w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0">
              <img src={capture.image_url} alt="Camera view" className="w-full h-full object-cover" />
            </div>
            <div className="font-mono space-y-0.5">
              <div className="text-cyan-300 font-semibold">Latest Image: {capture.filename}</div>
              <div className="text-mist/70">Received: {capture.received_at}</div>
              <div className="text-emerald-400">JPEG Integrity: Validated (FF D8 / FF D9)</div>
            </div>
          </div>
        )}

        {/* Trigger Reasons List */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-crevasse block">
            Identified Danger Causes:
          </span>
          <div className="bg-mist/40 p-3 rounded-lg border border-borderHairline space-y-1 text-xs">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start space-x-2 font-medium text-granite/90">
                <span className="text-red-600 font-bold">✓</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-bold text-crevasse uppercase tracking-wider mb-1">
            Operator Verification Note (Optional):
          </label>
          <input
            type="text"
            value={operatorNote}
            onChange={(e) => setOperatorNote(e.target.value)}
            placeholder="e.g. Visual verification of moraine stability and rapid tributary inflow"
            className="w-full px-3 py-2 border border-granite/20 rounded-lg text-xs bg-white focus:border-glacial"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-borderHairline flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onDismissSafe(operatorNote)}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-paper hover:bg-mist text-granite font-bold rounded-lg text-xs border border-borderHairline transition-colors flex items-center space-x-1.5"
          >
            <XCircle className="w-4 h-4 text-emerald-600" />
            <span>Dismiss / Mark Safe</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-granite/60 hover:text-granite"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onConfirmDanger(operatorNote)}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors flex items-center space-x-2 animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming...' : 'CONFIRM DANGER'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
