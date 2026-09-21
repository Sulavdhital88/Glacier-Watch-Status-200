import React from 'react';
import { X, Maximize2, Download } from 'lucide-react';

export function ImageModal({ isOpen, imageUrl, title = 'Glacier Lake Observation', onClose }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-textDark/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-cardWarm rounded-2xl max-w-4xl w-full border border-borderWarm shadow-modal overflow-hidden p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-borderWarm">
          <h4 className="font-sans font-bold text-sm text-textDark">
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-textMuted hover:text-textDark hover:bg-bgCream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        <div className="w-full max-h-[70vh] bg-bgCream rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs font-mono text-textMuted pt-1">
          <span>Source: Samsung Gear 360 (Manual HDR) • 224×224 Normalised Model Input</span>
          <a
            href={imageUrl}
            download
            className="px-3 py-1 bg-bgCream border border-borderWarm rounded text-textDark hover:bg-borderWarm transition-colors flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>
    </div>
  );
}
export default ImageModal;
