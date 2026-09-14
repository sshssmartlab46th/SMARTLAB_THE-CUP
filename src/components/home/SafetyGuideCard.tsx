import React from 'react';
import { SafetyGuideItem } from '../../types';

export interface SafetyGuideCardProps {
  items?: SafetyGuideItem[];
  title?: string;
  onItemClick?: (item: SafetyGuideItem) => void;
}

const OFFICIAL_SAFETY_PRINCIPLES: SafetyGuideItem[] = [
  {
    id: 'principle-1',
    order: 1,
    title: '충분한 수분 섭취',
    content: '탈수 방지를 위해 운동장 뒤편 급수대를 수시로 이용하세요.'
  },
  {
    id: 'principle-2',
    order: 2,
    title: '부상 즉시 의무실 방문',
    content: '본관 1층 보건실 및 체육관 앞 간이 의무실 상시 운영 중.'
  },
  {
    id: 'principle-3',
    order: 3,
    title: '지나친 경쟁 응원 자제',
    content: '동료 학우를 존중하는 격려와 매너 있는 응원을 보여주세요.'
  }
];

export const SafetyGuideCard: React.FC<SafetyGuideCardProps> = ({
  items = [],
  title = '실시간 안도 가이드',
  onItemClick
}) => {
  const displayItems = items.length > 0 ? items : OFFICIAL_SAFETY_PRINCIPLES;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🔥</span>
        <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
      </div>

      <div className="space-y-4">
        {displayItems.map((item, idx) => (
          <div 
            key={item.id || idx}
            onClick={() => onItemClick?.(item)}
            className="group cursor-pointer"
          >
            <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-emerald-400 transition">
              {item.order || idx + 1}. {item.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
