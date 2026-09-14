import React, { useEffect } from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageLightboxModalProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  src,
  alt = '첨부 이미지',
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (src) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls */}
        <div className="absolute -top-10 right-0 flex items-center gap-2">
          <a
            href={src}
            download="attached_image.jpg"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            title="이미지 원본 다운로드"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image preview */}
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
};
