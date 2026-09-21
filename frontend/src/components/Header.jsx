import React from 'react';
import { ShieldCheck, Wifi } from 'lucide-react';

export function Header({ title = 'GlacierWatch', subtitle = 'Early Warning & Environmental Monitoring', isOnline = true }) {
  return (
    <header className="bg-cardWarm border-b border-borderWarm px-8 py-4 flex items-center justify-between select-none">
      <div>
        <h2 className="font-sans font-bold text-lg md:text-xl text-textDark tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-textMuted mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* System Status Pill */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-bgCream border border-borderWarm rounded-full">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-accentSuccess animate-pulse' : 'bg-accentRed'}`} />
          <span className="text-xs font-mono font-semibold text-textDark">
            {isOnline ? '● System Online' : '● System Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
export default Header;
