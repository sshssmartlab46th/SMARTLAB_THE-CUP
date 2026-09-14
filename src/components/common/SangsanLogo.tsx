import React, { useState } from 'react';

export type SangsanLogoSize = number | 'sm' | 'md' | 'lg' | 'xl';

export interface SangsanLogoProps {
  className?: string;
  size?: SangsanLogoSize;
  alt?: string;
  zoom?: number;
}

const SIZE_MAP: Record<string, number> = {
  sm: 28,
  md: 48,
  lg: 64,
  xl: 80,
};

export const SangsanLogo: React.FC<SangsanLogoProps> = ({ 
  className = '', 
  size = 36,
  alt = '상산고등학교 로고',
  zoom = 1.32
}) => {
  const [imgError, setImgError] = useState(false);
  const dimension = typeof size === 'number' ? size : (SIZE_MAP[size] || 36);

  // Official Sangsan logo image URL requested by user
  const primarySrc = '/images/sangsan_logo.png';
  const fallbackExternalSrc = 'https://cdn.kyobit.com/news/photo/202511/2241_2193_3618.png';

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xs ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {!imgError ? (
        <img 
          src={primarySrc}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== fallbackExternalSrc) {
              img.src = fallbackExternalSrc;
            } else {
              setImgError(true);
            }
          }}
        />
      ) : (
        <svg 
          width={dimension} 
          height={dimension} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="46" stroke="#991B1B" strokeWidth="4" fill="#7F1D1D" fillOpacity="0.1" />
          <circle cx="50" cy="50" r="41" stroke="#B91C1C" strokeWidth="1.5" strokeDasharray="3 3" />
          <polygon points="50,16 61,38 85,38 66,54 73,78 50,64 27,78 34,54 15,38 39,38" fill="#DC2626" opacity="0.9" />
          <polygon points="50,25 58,42 76,42 62,54 67,72 50,61 33,72 38,54 24,42 42,42" fill="#FCA5A5" opacity="0.4" />
          <circle cx="50" cy="50" r="13" fill="#991B1B" />
          <text 
            x="50" 
            y="54" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            fontSize="11" 
            fontWeight="bold" 
            fill="#FFFFFF" 
            fontFamily="serif"
          >
            象山
          </text>
        </svg>
      )}
    </div>
  );
};
