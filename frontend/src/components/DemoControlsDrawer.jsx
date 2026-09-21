import React, { useState } from 'react';
import { Sliders, Activity, Droplets, RotateCcw, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { postDemoTrigger } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

export function DemoControlsDrawer({ isDemoMode = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  if (!isDemoMode) return null;

  const handleTrigger = async (scenario, label) => {
    try {
      setLoadingAction(scenario);
      await postDemoTrigger(scenario);
      setFeedback(`Triggered: ${label}`);
      queryClient.invalidateQueries({ queryKey: ['sensors_latest'] });
      queryClient.invalidateQueries({ queryKey: ['sensors_history'] });
      queryClient.invalidateQueries({ queryKey: ['situation'] });
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none">
      {isOpen ? (
        <div className="bg-crevasse text-paper border border-borderDark rounded-lg shadow-modal w-80 p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-borderDark pb-2">
            <div className="flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-sm">Demo Simulation Controls</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-mist/70 hover:text-paper p-1 rounded"
              title="Collapse"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-mist/70 leading-relaxed">
            Trigger simulated sensor events to test multi-hazard situation evaluation and alerting workflows. Real model replay is preserved.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => handleTrigger('earthquake', 'Strong Earthquake')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-medium text-amber-200 border border-amber-500/30 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Simulate earthquake (55+ mg)</span>
              </span>
              {loadingAction === 'earthquake' && <span className="text-[10px] animate-pulse">Running...</span>}
            </button>

            <button
              onClick={() => handleTrigger('rapid_water_rise', 'Rapid Water Rise')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-medium text-cyan-200 border border-cyan-500/30 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Simulate rapid water rise (+3 cm/m)</span>
              </span>
              {loadingAction === 'rapid_water_rise' && <span className="text-[10px] animate-pulse">Running...</span>}
            </button>

            <button
              onClick={() => handleTrigger('reset', 'Reset Sensors')}
              disabled={loadingAction !== null}
              className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-medium text-mist/80 border border-white/10 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-mist/60" />
                <span>Reset sensors to nominal</span>
              </span>
              {loadingAction === 'reset' && <span className="text-[10px] animate-pulse">Resetting...</span>}
            </button>
          </div>

          {feedback && (
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1.5 rounded border border-emerald-800/40">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{feedback}</span>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-crevasse hover:bg-cyan-950 text-paper px-3.5 py-2 rounded-full border border-cyan-700/50 shadow-lg text-xs font-medium transition-all"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Demo controls</span>
          <ChevronUp className="w-3.5 h-3.5 text-mist/60" />
        </button>
      )}
    </div>
  );
}
