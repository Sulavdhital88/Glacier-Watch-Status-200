import React, { useState, useEffect } from 'react';
import { Maximize2, Clock, Image as ImageIcon } from 'lucide-react';
import { getImageHistory } from '../services/api';
import { ImageModal } from '../components/ImageModal';

export function ImagesPage() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await getImageHistory(16);
      if (Array.isArray(data)) {
        // Keep strictly only the latest 8 pictures
        setImages(data.slice(0, 8));
      }
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* Clean Header */}
      <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="font-sans font-bold text-lg md:text-xl text-textDark">
            Recent Camera Captures
          </h2>
          <p className="text-xs text-textMuted mt-0.5">
            Latest 8 transmissions received from Station GW-001
          </p>
        </div>
        <span className="text-xs font-mono text-textMuted self-start md:self-auto">
          Showing 8 Latest Frames
        </span>
      </div>

      {/* Grid of Latest 8 Images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {images.map((item) => {
          const confidencePct = item.confidence !== undefined
            ? Math.round((item.confidence <= 1.0 ? item.confidence * 100 : item.confidence) * 10) / 10
            : 90.0;
          const pred = (item.prediction || 'NORMAL').toUpperCase();
          const isRising = pred === 'RISING';
          const isDecreasing = pred === 'DECREASING';

          const badgeColor = isRising
            ? 'bg-lightRed text-accentRed border-accentRed/30'
            : isDecreasing
            ? 'bg-sky-50 text-sky-700 border-sky-300'
            : 'bg-emerald-50 text-accentSuccess border-accentSuccess/30';

          return (
            <div
              key={item.id}
              className="bg-cardWarm rounded-xl border border-borderWarm shadow-card overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => setSelectedImage(item.imageUrl)}
            >
              {/* Thumbnail Container */}
              <div className="relative w-full aspect-[16/10] bg-bgCream overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.id}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-textDark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-2 bg-cardWarm/90 text-textDark rounded-full shadow">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Meta & Predictions */}
              <div className="p-4 space-y-2 border-t border-borderWarm font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-textMuted text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </div>
                  <span className="text-[10px] text-textMuted font-sans">{item.station || 'Station GW-001'}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeColor}`}>
                    {pred}
                  </span>
                  <span className="font-bold text-textDark tabular-nums">
                    {confidencePct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {images.length === 0 && (
        <div className="text-center py-16 bg-cardWarm rounded-xl border border-borderWarm text-textMuted space-y-2">
          <ImageIcon className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-sm font-medium text-textDark">No images received yet</p>
          <p className="text-xs">Incoming captures from Station GW-001 will appear here.</p>
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageModal
        isOpen={Boolean(selectedImage)}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
export default ImagesPage;
