import React, { useState } from 'react';

interface SmartlabLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

// Provided official SmartLab logo URL
export const SMARTLAB_LOGO_URL = 'https://jetiytrryejszscyfquv.supabase.co/storage/v1/object/sign/drive/public/caea8060-a1e8-408b-971f-b77d7b2a940b.png?token=eyJraWQiOiIzY2RhODRkZC00NzFlLTRiNzQtYjJhZC05NTAxNGZjZTI5MmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkcml2ZS9wdWJsaWMvY2FlYTgwNjAtYTFlOC00MDhiLTk3MWYtYjc3ZDdiMmE5NDBiLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODkzNDk5NjUsImV4cCI6MTc4OTM1MzU2NX0.16CBfChsyAVFMdnJ-YeIKfNcilcD1GPr8-7WN9F15kU';

export const SmartlabLogo: React.FC<SmartlabLogoProps> = ({ 
  className = '', 
  size = 32,
  showText = true
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
      {!imageError ? (
        <img
          src="/smartlab-logo.png"
          alt="SMARTLAB"
          style={{ width: `${size}px`, height: 'auto' }}
          className="object-contain transition-opacity duration-200"
          onError={(e) => {
            // Fallback to direct URL if public asset fails, then to SVG fallback
            const target = e.currentTarget;
            if (target.src !== SMARTLAB_LOGO_URL) {
              target.src = SMARTLAB_LOGO_URL;
            } else {
              setImageError(true);
            }
          }}
        />
      ) : (
        <svg 
          width={size} 
          height={size * 0.8} 
          viewBox="0 0 48 36" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-slate-900 dark:text-white"
        >
          <polygon points="4,4 22,18 4,32" fill="currentColor" fillOpacity="0.9" />
          <polygon points="4,4 14,18 4,18" fill="currentColor" fillOpacity="0.4" />
          <polygon points="44,4 26,18 44,32" fill="currentColor" fillOpacity="0.9" />
          <polygon points="44,4 34,18 44,18" fill="currentColor" fillOpacity="0.4" />
          <polygon points="22,18 24,14 26,18 24,22" fill="currentColor" fillOpacity="1" />
        </svg>
      )}
      {showText && (
        <span className="text-[7px] font-black tracking-widest text-slate-800 dark:text-slate-200 mt-0.5 uppercase select-none">
          SMART LAB
        </span>
      )}
    </div>
  );
};
