import React from 'react';

export interface FooterLink {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface FooterProps {
  links?: FooterLink[];
  customCredit?: string;
}

const DEFAULT_LINKS: FooterLink[] = [
  { label: '개인정보처리방침' },
  { label: '체육대회 규정집' },
  { label: '스마트랩 소개' },
  { label: '문의하기' }
];

export const Footer: React.FC<FooterProps> = ({
  links = DEFAULT_LINKS,
  customCredit = 'made by SMARTLAB'
}) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-[#0b0f19]/40 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center space-y-3 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
          {links.map((link, idx) => (
            <button
              key={idx}
              type="button"
              onClick={link.onClick}
              className="hover:text-red-600 dark:hover:text-emerald-400 transition"
            >
              {link.label}
            </button>
          ))}
        </nav>
        <p className="text-[11px] font-mono tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          {customCredit}
        </p>
      </div>
    </footer>
  );
};
