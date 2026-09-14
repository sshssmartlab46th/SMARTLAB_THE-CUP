import React from 'react';

interface SmartlabLogoProps {
  className?: string;
  size?: number;
}

export const SmartlabLogo: React.FC<SmartlabLogoProps> = ({ 
  className = '', 
  size = 28 
}) => {
  return (
    <div className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
      {/* Geometric origami / faceted wings monogram from the design */}
      <svg 
        width={size} 
        height={size * 0.8} 
        viewBox="0 0 48 36" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-900 dark:text-white"
      >
        {/* Left faceted wing */}
        <polygon points="4,4 22,18 4,32" fill="currentColor" fillOpacity="0.9" />
        <polygon points="4,4 14,18 4,18" fill="currentColor" fillOpacity="0.4" />
        
        {/* Right faceted wing */}
        <polygon points="44,4 26,18 44,32" fill="currentColor" fillOpacity="0.9" />
        <polygon points="44,4 34,18 44,18" fill="currentColor" fillOpacity="0.4" />
        
        {/* Center fold accent */}
        <polygon points="22,18 24,14 26,18 24,22" fill="currentColor" fillOpacity="1" />
      </svg>
      <span className="text-[7px] font-black tracking-widest text-slate-800 dark:text-slate-200 mt-0.5 uppercase select-none">
        SMART LAB
      </span>
    </div>
  );
};
