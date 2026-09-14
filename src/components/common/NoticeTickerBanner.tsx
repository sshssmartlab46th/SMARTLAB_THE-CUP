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
  if (!notice) {
    return null;
  }

  return (
    <div 
      onClick={onClick}
      className="w-full bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80 py-2 px-4 sm:px-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-red-600 dark:bg-red-600 text-white font-bold text-[11px] tracking-tight">
            공지사항
          </span>
          <span className="text-sm shrink-0">📢</span>
          <p className="truncate text-slate-900 dark:text-slate-100 font-medium text-xs sm:text-[13px]">
            {notice.title} {notice.content ? `— ${notice.content}` : ''}
          </p>
        </div>

        <div className="flex items-center shrink-0 text-red-600 dark:text-red-400 font-medium text-xs">
          <span>{notice.time || timeLabel}</span>
        </div>
      </div>
    </div>
  );
};
