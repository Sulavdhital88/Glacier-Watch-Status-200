import React from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner({ isConnected }) {
  if (isConnected) return null;

  return (
    <div className="bg-rhododendron text-white px-4 py-2 text-sm flex items-center justify-center space-x-2 font-medium select-none shadow-sm z-50">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        Can't reach the GlacierWatch server. Start it with <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs">npm run dev:all</code>. Retrying...
      </span>
    </div>
  );
}
