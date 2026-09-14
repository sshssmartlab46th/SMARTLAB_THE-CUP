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
    title: 'RICE 응급처치 기본 원칙 준수',
    content: '부상 발생 시 Rest(안정), Ice(냉찜질), Compression(압박), Elevation(거상) 원칙을 즉시 적용합니다.'
  },
  {
    id: 'principle-2',
    order: 2,
    title: '충분한 수분 섭취 및 준비운동',
    content: '탈수 예방을 위해 수분을 수시로 섭취하고 경기 전후 가벼운 스트레칭을 실시합니다.'
  },
  {
    id: 'principle-3',
    order: 3,
    title: '부상 발생 즉시 의무팀 안내',
    content: '신체 접촉 부상 및 탈진 징후 발생 시 심판진 및 의무 지원팀에 즉시 보고합니다.'
  }
];

export const SafetyGuideCard: React.FC<SafetyGuideCardProps> = ({
  items = [],
  title = '실시간 안전 가이드',
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
