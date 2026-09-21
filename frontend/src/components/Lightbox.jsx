import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

export function Lightbox({ src, alt, caption, onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.3, 4));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.3, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 bg-crevasse/95 z-50 flex flex-col items-center justify-between p-4 backdrop-blur-sm select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Controls */}
      <div className="w-full flex items-center justify-between text-paper text-sm max-w-6xl">
        <div className="font-medium text-mist">{caption || 'Capture Lightbox'}</div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-paper transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-paper transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-paper transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <a
            href={src}
            download
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-paper transition-colors"
            title="Download image"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 bg-rhododendron hover:bg-red-700 rounded text-white transition-colors ml-2"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden w-full max-w-6xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <img
          src={src}
          alt={alt || 'Capture'}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 100ms ease-out',
          }}
          className="max-h-[85vh] max-w-full object-contain pointer-events-none rounded shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Bottom Hint */}
      <div className="text-xs text-mist/60">
        Click and drag to pan • Zoom: {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
