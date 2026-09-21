import React, { useState, useMemo } from 'react';
import { Send, CheckCircle2, AlertTriangle, ShieldCheck, User, ArrowRight, Lock } from 'lucide-react';
import { SMS_TEMPLATES, calculateSmsSegments } from '../config/templates';
import { postSendAlert } from '../api/client';

export function CitizenAlertModal({
  isOpen,
  onClose,
  towers = [],
  captureId,
  operator,
  onAlertDispatched,
}) {
  const [language, setLanguage] = useState('en'); // 'en' | 'ne' | 'both'
  const [selectedTemplateId, setSelectedTemplateId] = useState('flood_warning');
  const [messageText, setMessageText] = useState(SMS_TEMPLATES[0].english);
  const [isConfirmingFinal, setIsConfirmingFinal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Target towers (defaults to all active towers)
  const [selectedTowerIds, setSelectedTowerIds] = useState(() => towers.map((t) => t.id));

  // Sync towers if updated
  useMemo(() => {
    if (selectedTowerIds.length === 0 && towers.length > 0) {
      setSelectedTowerIds(towers.map((t) => t.id));
    }
  }, [towers]);

  if (!isOpen) return null;

  const handleTemplateChange = (tplId, lang = language) => {
    setSelectedTemplateId(tplId);
    const tpl = SMS_TEMPLATES.find((t) => t.id === tplId) || SMS_TEMPLATES[0];
    if (lang === 'en') {
      setMessageText(tpl.english);
    } else if (lang === 'ne') {
      setMessageText(tpl.nepali);
    } else {
      setMessageText(`${tpl.english}\n\n${tpl.nepali}`);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    handleTemplateChange(selectedTemplateId, newLang);
  };

  const selectedTowers = towers.filter((t) => selectedTowerIds.includes(t.id));
  const totalRecipients = selectedTowers.reduce((acc, t) => acc + (t.est_recipients || 0), 0) || 4280;

  const smsStats = calculateSmsSegments(messageText);

  const handleFinalSend = async () => {
    setIsSending(true);
    setErrorMessage('');
    try {
      const payload = {
        tower_ids: selectedTowerIds.length > 0 ? selectedTowerIds : towers.map((t) => t.id),
        message: messageText,
        languages: language === 'both' ? ['en', 'ne'] : [language],
        basis: 'verified_lake_event',
        operator: operator || 'Field Duty Officer',
        confirmed: true,
        event_id: captureId || null,
      };

      const result = await postSendAlert(payload);
      setSuccessResult({
        recipients: totalRecipients,
        time: new Date().toLocaleTimeString(),
        status: 'SMS DISPATCHED',
      });
      setIsSending(false);
      setIsConfirmingFinal(false);
      if (onAlertDispatched) {
        onAlertDispatched();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to dispatch alert');
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-crevasse/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none animate-fadeIn overflow-y-auto">
      <div className="bg-paper border border-borderHairline rounded-xl shadow-modal w-full max-w-xl p-6 text-granite space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderHairline pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600 text-white rounded-full">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-crevasse uppercase tracking-wider">
                Send Citizen Emergency Alert
              </h2>
              <p className="text-xs text-granite/70">
                Authorized Emergency SMS & Cell Broadcast
              </p>
            </div>
          </div>
        </div>

        {/* State 1: Success Sent Screen */}
        {successResult ? (
          <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="font-display font-bold text-3xl text-emerald-800 uppercase tracking-wide">
              ✓ ALERT SENT
            </h3>

            <p className="text-sm text-emerald-900 font-medium">
              Emergency notification has been sent successfully to all selected communities.
            </p>

            <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-emerald-200 font-mono text-xs">
              <div>
                <span className="text-granite/60 block">Recipients</span>
                <strong className="text-emerald-700 text-base">{successResult.recipients.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-granite/60 block">Dispatch Time</span>
                <strong className="text-crevasse text-base">{successResult.time}</strong>
              </div>
              <div>
                <span className="text-granite/60 block">Status</span>
                <strong className="text-emerald-700 text-base">DISPATCHED</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow transition-colors"
            >
              Close and Return to Dashboard
            </button>
          </div>
        ) : isConfirmingFinal ? (
          /* State 2: Final Double Confirmation Dialog */
          <div className="p-5 bg-amber-50 border border-amber-300 rounded-xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>Final Authorization Confirmation</span>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed">
              Are you sure you want to broadcast this emergency alert to <strong>{totalRecipients.toLocaleString()} citizens</strong> across <strong>{selectedTowers.length || towers.length} cell towers</strong>?
            </p>

            <div className="bg-white p-3 rounded border border-amber-200 text-xs font-sans text-granite italic">
              "{messageText}"
            </div>

            {errorMessage && (
              <div className="text-xs text-red-600 font-bold">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingFinal(false)}
                disabled={isSending}
                className="px-4 py-2 text-xs font-bold text-granite/70 hover:text-granite bg-white rounded border border-borderHairline"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFinalSend}
                disabled={isSending}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs shadow-md transition-colors flex items-center space-x-2 animate-pulse"
              >
                <Lock className="w-4 h-4" />
                <span>{isSending ? 'Transmitting...' : 'CONFIRM & SEND NOW'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* State 3: Main Alert Composer */
          <div className="space-y-4">
            {/* Target Summary */}
            <div className="bg-mist/50 p-3 rounded-lg border border-borderHairline flex items-center justify-between text-xs">
              <div>
                <span className="text-granite/60 font-mono block text-[10px] uppercase font-bold">
                  Coverage Area
                </span>
                <span className="font-bold text-crevasse">
                  Rasuwa Riverside Valley ({towers.length} Cell Towers)
                </span>
              </div>

              <div className="text-right">
                <span className="text-granite/60 font-mono block text-[10px] uppercase font-bold">
                  Estimated Recipients
                </span>
                <span className="font-bold text-red-700 font-mono text-sm">
                  {totalRecipients.toLocaleString()} Citizens
                </span>
              </div>
            </div>

            {/* Language Picker */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-crevasse uppercase tracking-wider text-[11px]">
                <span>Language Selection</span>
                <div className="flex space-x-1 bg-mist p-0.5 rounded border border-borderHairline">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      language === 'en' ? 'bg-paper text-crevasse font-bold shadow-xs' : 'text-granite/60'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('ne')}
                    className={`px-3 py-1 rounded text-xs font-semibold font-devanagari ${
                      language === 'ne' ? 'bg-paper text-crevasse font-bold shadow-xs' : 'text-granite/60'
                    }`}
                  >
                    नेपाली
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('both')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      language === 'both' ? 'bg-paper text-crevasse font-bold shadow-xs' : 'text-granite/60'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-crevasse uppercase tracking-wider text-[11px] block">
                Emergency Message Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-granite/20 rounded-lg text-xs font-medium focus:border-glacial"
              >
                {SMS_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editable Text Area */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-crevasse uppercase tracking-wider text-[11px] block">
                Message Content
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 bg-white border border-granite/20 rounded-lg text-xs leading-relaxed font-sans focus:border-glacial"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs font-mono text-granite/70 border-t border-borderHairline pt-2">
              <span>Recipients: <strong className="text-crevasse">{totalRecipients.toLocaleString()}</strong></span>
              <span>Length: <strong className="text-red-700">{smsStats.segments} SMS segments</strong> ({smsStats.chars} chars)</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-granite/60 hover:text-granite"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingFinal(true)}
                disabled={!messageText.trim()}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>SEND ALERT TO CITIZENS</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
