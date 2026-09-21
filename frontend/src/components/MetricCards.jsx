import React from 'react';
import { Activity, Clock, Cpu, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function MetricCards({
  systemStatus = 'ONLINE',
  lastImageTime = '19:42:13',
  confidence = 93.4,
  alertStatus = 'MONITORING',
}) {
  const isAlert = alertStatus === 'ALERT SENT' || alertStatus === 'VERIFIED';
  const isReview = alertStatus === 'REVIEW REQUIRED';

  const metrics = [
    {
      label: 'SYSTEM STATUS',
      value: systemStatus,
      statusDot: 'bg-accentSuccess',
      icon: Activity,
    },
    {
      label: 'LAST IMAGE',
      value: lastImageTime,
      subtext: 'Station GW-001',
      icon: Clock,
    },
    {
      label: 'AI CONFIDENCE',
      value: `${confidence}%`,
      subtext: 'MobileNetV2',
      icon: Cpu,
    },
    {
      label: 'ALERT STATUS',
      value: alertStatus,
      badgeColor: isAlert ? 'bg-lightRed text-accentRed border-accentRed/30' : isReview ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-50 text-accentSuccess border-accentSuccess/30',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="bg-cardWarm p-4 rounded-xl border border-borderWarm shadow-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-textMuted uppercase tracking-wider">
              {m.label}
            </span>
            <m.icon className="w-4 h-4 text-textMuted/60" />
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            {m.badgeColor ? (
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${m.badgeColor}`}>
                {m.value}
              </span>
            ) : (
              <div className="flex items-center space-x-2">
                {m.statusDot && <span className={`w-2 h-2 rounded-full ${m.statusDot}`} />}
                <span className="font-sans font-bold text-lg md:text-xl text-textDark tabular-nums">
                  {m.value}
                </span>
              </div>
            )}

            {m.subtext && (
              <span className="text-[11px] font-mono text-textMuted">
                {m.subtext}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
export default MetricCards;
