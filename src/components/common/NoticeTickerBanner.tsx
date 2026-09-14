import React from 'react';
import { NoticeItem } from '../../types';

export interface NoticeTickerBannerProps {
  notice?: NoticeItem | null;
  timeLabel?: string;
  onClick?: () => void;
}

export const NoticeTickerBanner: React.FC<NoticeTickerBannerProps> = ({
  notice,
  timeLabel = '방금 전 업데이트',
  onClick
}) => {
  const content = notice ? `${notice.title}${notice.content ? ` ${notice.content}` : ''}` : '오후 2시 폐회식 및 이어달리기 예선이 시작됩니다! 모든 학급은 스탠드로 모여주시기 바랍니다.';
  const time = notice?.time || timeLabel;

  return (
    <div 
      onClick={onClick}
      className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2.5 px-4 sm:px-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[11px] tracking-tight">
            공지사항
          </span>
          <span className="text-xs shrink-0">📢</span>
          <p className="truncate text-slate-900 dark:text-slate-100 font-medium text-xs sm:text-[13px]">
            {content}
          </p>
        </div>

        <div className="flex items-center shrink-0 text-slate-400 dark:text-slate-400 font-normal text-[11px] sm:text-xs">
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};
