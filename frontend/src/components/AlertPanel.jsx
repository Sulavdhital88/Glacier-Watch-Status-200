import React, { useState } from 'react';
import { Send, AlertTriangle, Users, CheckCircle2, Phone, Clock, Radio, RotateCcw } from 'lucide-react';
import { sendAlert } from '../services/api';

// Emergency dispatch numbers configured directly in code (add more numbers here as needed)
export const EMERGENCY_DISPATCH_RECIPIENTS = [
  '+9779761888995',
];

export function AlertPanel({
  currentPrediction = 'DECREASING',
  totalResidents = 2450,
}) {
  const [recipients] = useState(EMERGENCY_DISPATCH_RECIPIENTS);
  const [message, setMessage] = useState(
    'EMERGENCY GLOF WARNING: Abnormal glacial lake activity detected at Lirung Glacier GW-001. Immediately evacuate riverside basins along Langtang Khola to higher elevation.'
  );

  const [alertStatus, setAlertStatus] = useState('MONITORING'); // MONITORING | REVIEW REQUIRED | ALERT SENT
  const [lastAlertTime, setLastAlertTime] = useState('No alerts sent');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [operatorName, setOperatorName] = useState('Duty Officer');
  const [sentDetails, setSentDetails] = useState(null);

  const handleInitiateVerification = () => {
    setIsVerifying(true);
  };

  const handleCancelVerification = () => {
    setIsVerifying(false);
  };

  const handleConfirmAndSend = async () => {
    setIsSending(true);
    try {
      const primaryRecipient = recipients[0] || '+9779761888995';
      const res = await sendAlert({
        message,
        operator: operatorName,
        recipient: primaryRecipient,
        recipients,
        basis: 'drill',
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAlertStatus('ALERT SENT');
      setLastAlertTime(`Sent ${timeStr}`);
      setSentDetails({
        time: timeStr,
        operator: operatorName,
        recipientsCount: res?.estRecipients || totalResidents,
      });
      setIsVerifying(false);
    } catch (e) {
      alert(`Error dispatching alert: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setAlertStatus('MONITORING');
    setIsVerifying(false);
    setSentDetails(null);
  };

  return (
    <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card flex flex-col justify-between">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-borderWarm">
        <div>
          <h3 className="font-sans font-bold text-base text-textDark">
            Emergency Alert System
          </h3>
          <p className="text-xs text-textMuted mt-0.5">
            Human-verified SMS &amp; cell broadcast dispatcher
          </p>
        </div>

        {/* Status Badge */}
        <span
          className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${
            alertStatus === 'ALERT SENT'
              ? 'bg-lightRed text-accentRed border-accentRed/30'
              : alertStatus === 'REVIEW REQUIRED'
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-accentSuccess border-accentSuccess/30'
          }`}
        >
          ● {alertStatus}
        </span>
      </div>

      {/* 2. Riverside Basin Population Exposure Banner */}
      <div className="my-3.5 p-3.5 bg-bgCream border border-borderWarm rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-accentRed" />
            <span className="font-mono text-xs font-bold text-textDark uppercase tracking-wide">
              Riverside Basin Exposure
            </span>
          </div>
          <span className="text-[11px] font-mono text-textMuted flex items-center space-x-1">
            <Radio className="w-3 h-3 text-accentSuccess" />
            <span>6 Towers Active</span>
          </span>
        </div>

        {/* Main Population Count Metric */}
        <div className="flex items-baseline justify-between pt-0.5">
          <div>
            <span className="text-2xl font-bold font-mono text-textDark">
              {totalResidents.toLocaleString()}
            </span>
            <span className="ml-1.5 text-xs font-sans text-textMuted font-medium">
              residents live on the riverside basins
            </span>
          </div>
        </div>

        {/* Settlement Breakdown Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono text-textDark">
          <span className="px-2 py-0.5 bg-cardWarm border border-borderWarm rounded text-textMuted">
            Kyanjin: <strong className="text-textDark">180</strong>
          </span>
          <span className="px-2 py-0.5 bg-cardWarm border border-borderWarm rounded text-textMuted">
            Langtang: <strong className="text-textDark">450</strong>
          </span>
          <span className="px-2 py-0.5 bg-cardWarm border border-borderWarm rounded text-textMuted">
            Ghora Tabela &amp; Lama: <strong className="text-textDark">310</strong>
          </span>
          <span className="px-2 py-0.5 bg-cardWarm border border-borderWarm rounded text-textMuted">
            Bamboo &amp; Syabrubesi: <strong className="text-textDark">1,510</strong>
          </span>
        </div>
      </div>

      {/* 3. Message & Inputs / Verification State */}
      <div className="space-y-3 mb-3">
        {/* Message Input */}
        <div>
          <label className="text-[11px] font-mono text-textMuted uppercase block mb-1">
            Emergency Broadcast Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={alertStatus === 'ALERT SENT'}
            rows={2}
            className="w-full bg-bgCream border border-borderWarm rounded-lg p-2.5 text-xs text-textDark font-sans leading-relaxed outline-none focus:border-accentRed/50 resize-none disabled:opacity-60"
          />
        </div>

        {/* 4. Action / Confirmation States */}
        {alertStatus === 'ALERT SENT' ? (
          /* Dispatched Confirmation Box */
          <div className="p-3.5 bg-emerald-50/80 border border-accentSuccess/30 rounded-xl space-y-2.5">
            <div className="flex items-center space-x-2 text-accentSuccess font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Emergency Alert Dispatched Successfully</span>
            </div>
            <p className="text-xs text-textDark leading-relaxed font-sans">
              Evacuation advisory broadcast to{' '}
              <strong>{sentDetails?.recipientsCount || totalResidents} riverside residents</strong> across 6 cell towers.
              Emergency SMS dispatch broadcast triggered.
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-textMuted border-t border-accentSuccess/20">
              <span>Verified by: {sentDetails?.operator || operatorName}</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-accentRed hover:underline flex items-center space-x-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Send Another Alert</span>
              </button>
            </div>
          </div>
        ) : isVerifying ? (
          /* Prominent Confirmation Box (Ask: Send alert to 2,450 people?) */
          <div className="p-4 bg-lightRed border border-accentRed/40 rounded-xl space-y-3 animate-fadeIn">
            <div className="flex items-center space-x-2 text-accentRed font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Human Verification Required</span>
            </div>

            {/* Explicit Prompt Display */}
            <div className="p-3 bg-cardWarm/95 rounded-lg border border-accentRed/30 text-center space-y-1">
              <p className="text-xs font-mono text-textMuted">
                {totalResidents.toLocaleString()} residents live on the riverside basins.
              </p>
              <p className="text-sm md:text-base font-bold text-textDark">
                Send alert to {totalResidents.toLocaleString()} people?
              </p>
            </div>

            {/* Operator Signature & Confirmation Buttons */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Duty Officer / Operator Name"
                  className="px-3 py-1.5 text-xs font-mono bg-cardWarm border border-borderWarm rounded-lg text-textDark flex-1 outline-none focus:border-accentRed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelVerification}
                  disabled={isSending}
                  className="w-full py-2 bg-cardWarm hover:bg-bgCream text-textDark font-mono font-medium text-xs rounded-lg border border-borderWarm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSend}
                  disabled={isSending}
                  className="w-full py-2 bg-accentRed hover:bg-red-700 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSending
                      ? 'Sending...'
                      : `Yes, Send to ${totalResidents.toLocaleString()}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Default Trigger Button */
          <button
            type="button"
            onClick={handleInitiateVerification}
            className="w-full py-2.5 bg-accentRed hover:bg-red-700 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm uppercase tracking-wider"
          >
            <Send className="w-4 h-4" />
            <span>Send Alert to Riverside Basins</span>
          </button>
        )}
      </div>

      {/* 5. Footer Info */}
      <div className="pt-3 border-t border-borderWarm flex items-center justify-between text-xs font-mono text-textMuted">
        <div className="flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-textMuted/60" />
          <span>Last Alert: <strong className="text-textDark font-medium">{lastAlertTime}</strong></span>
        </div>

        <span className="text-[10px] text-textMuted">GW-SMS Gateway</span>
      </div>
    </div>
  );
}
export default AlertPanel;
