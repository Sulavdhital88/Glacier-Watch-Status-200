import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

export function AboutModelPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-glacial hover:text-cyan-800 underline underline-offset-2 flex items-center space-x-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-glacial"
      >
        <Info className="w-3 h-3" />
        <span>About this model</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-80 bg-paper border border-borderHairline rounded p-3.5 shadow-modal text-xs text-granite z-50 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-borderHairline mb-2">
            <span className="font-semibold text-crevasse">Model Information & Validation</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-granite/60 hover:text-granite p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="leading-relaxed mb-2">
            <strong>93.48%:</strong> Validation accuracy of the three-class classifier on 46 held-out images. It is not GLOF detection accuracy, and accuracy on new imagery has not been established yet.
          </p>
          <div className="bg-mist/60 p-2 rounded text-[11px] text-granite/80 space-y-1">
            <div><strong>Architecture:</strong> MobileNetV2 (3-class)</div>
            <div><strong>Classes:</strong> DECREASING, NORMAL, RISING</div>
            <div><strong>Role:</strong> Advisory visual classification only. Human verification is strictly required before any advisory or broadcast.</div>
          </div>
        </div>
      )}
    </div>
  );
}
