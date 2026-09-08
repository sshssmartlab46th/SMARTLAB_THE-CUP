import React from 'react';

interface SangsanEmblemProps {
  className?: string;
  size?: number;
}

export function SangsanEmblem({ className = '', size = 36 }: SangsanEmblemProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#800000" />
          <stop offset="50%" stopColor="#4A0000" />
          <stop offset="100%" stopColor="#1A0000" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D77F" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA820A" />
        </linearGradient>
      </defs>

      {/* Outer Laurel Wreath / Ring */}
      <circle cx="50" cy="50" r="46" stroke="url(#goldGrad)" strokeWidth="2.5" strokeDasharray="3 2" />
      
      {/* Heraldic Shield */}
      <path 
        d="M50 12 L78 20 C78 50 68 76 50 88 C32 76 22 50 22 20 Z" 
        fill="url(#shieldGrad)" 
        stroke="url(#goldGrad)" 
        strokeWidth="3" 
      />

      {/* Internal Quadrant Divider */}
      <line x1="50" y1="20" x2="50" y2="82" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <line x1="28" y1="46" x2="72" y2="46" stroke="url(#goldGrad)" strokeWidth="1.5" />

      {/* Book Icon (Top Left Quadrant) */}
      <path 
        d="M36 32 C39 31 43 31 46 33 L46 41 C43 39 39 39 36 40 Z M46 33 C49 31 53 31 56 32 L56 40 C53 39 49 39 46 41 Z" 
        fill="#FFFFFF" 
        opacity="0.95"
      />

      {/* Korean Character '상산' (象山) / 1981 Foundation Year */}
      <text 
        x="50" 
        y="62" 
        fill="#FFFFFF" 
        fontSize="12" 
        fontWeight="bold" 
        textAnchor="middle" 
        fontFamily="serif"
      >
        상산
      </text>

      <text 
        x="50" 
        y="75" 
        fill="url(#goldGrad)" 
        fontSize="8" 
        fontWeight="bold" 
        textAnchor="middle" 
        fontFamily="sans-serif"
      >
        1981
      </text>
    </svg>
  );
}
