import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Radio, AlertTriangle, Shield, User, Clock, Wifi, WifiOff } from 'lucide-react';
import { useOperator } from '../hooks/useOperator';

export function StationBar({ statusData, isConnected }) {
  const { operator, changeOperator } = useOperator();
  const [nepalTime, setNepalTime] = useState('');

  // Live Nepal Time (UTC+5:45)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // UTC time + 5 hours 45 minutes
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptMs = utcMs + (5 * 60 + 45) * 60000;
      const nptDate = new Date(nptMs);

      const hours = String(nptDate.getHours()).padStart(2, '0');
      const minutes = String(nptDate.getMinutes()).padStart(2, '0');
      const seconds = String(nptDate.getSeconds()).padStart(2, '0');
      setNepalTime(`${hours}:${minutes}:${seconds} NPT`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format last image time & stale check (> 10 minutes)
  const lastCaptureTimeStr = statusData?.last_capture_time;
  let lastImageDisplay = 'No images';
  let isStale = false;

  if (lastCaptureTimeStr) {
    try {
      const capDate = new Date(lastCaptureTimeStr);
      const diffMinutes = Math.floor((Date.now() - capDate.getTime()) / 60000);
      const timePart = capDate.toTimeString().split(' ')[0].substring(0, 5);
      lastImageDisplay = `${timePart} UTC (${diffMinutes}m ago)`;
      if (diffMinutes >= 10) {
        isStale = true;
      }
    } catch (_) {
      lastImageDisplay = lastCaptureTimeStr;
    }
  }

  const isDemo = statusData?.demo_mode ?? true;
  const isLiveSms = statusData?.sms_mode === 'live';

  return (
    <header className="bg-crevasse text-paper border-b border-borderDark px-4 py-2.5 flex items-center justify-between select-none">
      {/* Brand Wordmark & Tabs */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex flex-col text-paper focus:outline-none">
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-2xl tracking-wider text-paper uppercase">
              GLACIERWATCH
            </span>
            <span className="text-[10px] bg-glacial/40 text-cyan-200 px-1.5 py-0.2 rounded font-mono font-bold">
              EARLY WARNING
            </span>
          </div>
          <span className="text-[11px] text-mist/60 font-sans tracking-wide">
            Glacial Lake Early Warning System
          </span>
        </Link>

        <nav className="flex items-center space-x-1 ml-4" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-glacial text-white shadow-sm'
                  : 'text-mist/80 hover:text-white hover:bg-white/5'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/sensors"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-glacial text-white shadow-sm'
                  : 'text-mist/80 hover:text-white hover:bg-white/5'
              }`
            }
          >
            Sensors
          </NavLink>
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-glacial text-white shadow-sm'
                  : 'text-mist/80 hover:text-white hover:bg-white/5'
              }`
            }
          >
            Alerts
          </NavLink>
        </nav>
      </div>

      {/* Status, Clock, Flags & Operator Badge */}
      <div className="flex items-center space-x-3 text-xs">
        {/* System Online indicator */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 rounded-md border border-white/10" title={isConnected ? 'System Bridge Online' : 'Reconnecting...'}>
          {isConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-300 font-bold font-mono text-[11px]">
                SYSTEM ONLINE
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-red-300 font-bold font-mono text-[11px]">
                OFFLINE
              </span>
            </>
          )}
        </div>

        {/* Time of last image */}
        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded ${isStale ? 'bg-ochre/20 text-amber-300' : 'text-mist/80'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span className="tabular-nums">Image: {lastImageDisplay}</span>
          {isStale && <span className="font-semibold ml-1">(Stale)</span>}
        </div>

        {/* Nepal Time Clock */}
        <div className="text-mist/90 font-mono tabular-nums px-2 py-0.5 bg-white/5 rounded border border-white/10">
          {nepalTime || '--:--:-- NPT'}
        </div>

        {/* Demo / Live SMS Chips */}
        {isDemo && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
            Demo mode
          </span>
        )}

        {statusData?.serial_enabled && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
              statusData?.serial_connected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                : 'bg-amber-950/80 text-amber-300 border-amber-600/50'
            }`}
            title={`ESP32 USB Ingestion on ${statusData?.serial_port || 'COM4'}`}
          >
            ESP: {statusData?.serial_connected ? `Connected (${statusData.serial_port})` : `Listening (${statusData.serial_port})`}
          </span>
        )}

        {isLiveSms ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rhododendron text-white animate-pulse">
            Live SMS
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-mist/70">
            Mock SMS
          </span>
        )}

        {/* Operator Badge */}
        <button
          onClick={changeOperator}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-paper transition-colors border border-white/10"
          title="Click to switch operator"
        >
          <User className="w-3.5 h-3.5 text-glacial" />
          <span className="font-medium">{operator || 'Set operator'}</span>
        </button>
      </div>
    </header>
  );
}
