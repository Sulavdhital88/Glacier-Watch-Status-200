import { useState, useEffect, useRef, useCallback } from 'react';

export function useAlarm(dangerLevel) {
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [isSilenced, setIsSilenced] = useState(false);
  const prevLevelRef = useRef(dangerLevel);
  const audioCtxRef = useRef(null);
  const oscillatorIntervalRef = useRef(null);

  // Play synthesized warning beep
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3); // Drop

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  }, []);

  const startAlarm = useCallback(() => {
    if (isSilenced) return;
    setIsAlarmPlaying(true);
    playBeep();
    if (!oscillatorIntervalRef.current) {
      oscillatorIntervalRef.current = setInterval(playBeep, 1200);
    }
  }, [isSilenced, playBeep]);

  const stopAlarm = useCallback(() => {
    setIsAlarmPlaying(false);
    if (oscillatorIntervalRef.current) {
      clearInterval(oscillatorIntervalRef.current);
      oscillatorIntervalRef.current = null;
    }
  }, []);

  const silenceAlarm = useCallback(() => {
    setIsSilenced(true);
    stopAlarm();
  }, [stopAlarm]);

  // Monitor Danger Level transitions
  useEffect(() => {
    const prev = prevLevelRef.current;
    const current = dangerLevel;
    prevLevelRef.current = current;

    if (current === 'DANGER' && prev !== 'DANGER') {
      // 1. Trigger Vibration on transition into DANGER
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([500, 200, 500, 200, 800]);
        } catch (_) {}
      }

      // 2. Trigger Audio Alarm
      setIsSilenced(false);
      startAlarm();
    } else if (current !== 'DANGER') {
      stopAlarm();
      setIsSilenced(false);
    }
  }, [dangerLevel, startAlarm, stopAlarm]);

  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, [stopAlarm]);

  return {
    isAlarmPlaying,
    isSilenced,
    silenceAlarm,
    startAlarm,
  };
}
