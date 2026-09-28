import React from 'react';
import { SafetyGuideItem } from '../../types';
import { ShieldCheck } from 'lucide-react';

export interface SafetyGuideCardProps {
  items?: SafetyGuideItem[];
  title?: string;
  onItemClick?: (item: SafetyGuideItem) => void;
  onOpenInjuryEncyclopedia?: () => void;
}

const OFFICIAL_SAFETY_PRINCIPLES: SafetyGuideItem[] = [
  {
    id: 'principle-1',
    order: 1,
    title: '충분한 수분 섭취',
    content: '운동장 뒤 급수대 수시 이용'
  },
  {
    id: 'principle-2',
    order: 2,
    title: '부상 즉시 의무실',
    content: '본관 1층 보건실 & 체육관 의무실'
  },
  {
    id: 'principle-3',
    order: 3,
    title: '매너 있는 동료 응원',
    content: '과열 경쟁 및 비방 자제'
  }
];

export const SafetyGuideCard: React.FC<SafetyGuideCardProps> = ({
  items = [],
  title = '실시간 안도 가이드',
  onItemClick,
  onOpenInjuryEncyclopedia
}) => {
  const displayItems = items.length > 0 ? items : OFFICIAL_SAFETY_PRINCIPLES;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121826] p-3.5 shadow-2xs transition-all">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🔥</span>
          <h2 className="font-bold text-xs text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        {onOpenInjuryEncyclopedia && (
          <button
            type="button"
            onClick={onOpenInjuryEncyclopedia}
            className="text-[10px] text-slate-500 hover:text-red-600 dark:text-slate-300 dark:hover:text-emerald-400 transition cursor-pointer flex items-center gap-0.5 font-medium"
          >
            <ShieldCheck className="w-3 h-3" />
            백과
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {displayItems.map((item, idx) => (
          <div 
            key={item.id || idx}
            onClick={() => onItemClick?.(item)}
            className="group flex items-start gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <span className="shrink-0 w-4 h-4 rounded-full bg-red-50 dark:bg-emerald-950/80 text-red-600 dark:text-emerald-400 border dark:border-emerald-500/40 text-[10px] font-bold flex items-center justify-center mt-0.5">
              {item.order || idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-slate-800 dark:text-white group-hover:text-red-600 dark:group-hover:text-emerald-400 transition truncate">
                {item.title}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-300 truncate leading-tight">
                {item.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
