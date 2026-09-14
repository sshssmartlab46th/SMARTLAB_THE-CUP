import React from 'react';
import { NoticeItem } from '../../types';
import { formatKSTTime } from '../../utils/kstTime';

export interface NoticeTickerBannerProps {
  notice?: NoticeItem | null;
  timeLabel?: string;
  onClick?: () => void;
}

export const NoticeTickerBanner: React.FC<NoticeTickerBannerProps> = ({
  notice,
  timeLabel = '실시간 공지',
  onClick
}) => {
  if (!notice) return null;

  const content = `${notice.title}${notice.content ? ` - ${notice.content}` : ''}`;
  const time = notice.createdAt ? formatKSTTime(notice.createdAt) : timeLabel;

  return (
    <div 
      onClick={onClick}
      className={`w-full border-b py-2.5 px-4 sm:px-6 cursor-pointer transition-colors ${
        notice.important 
          ? 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 hover:bg-red-100/90 dark:hover:bg-red-950/60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
      }`}
      role="button"
      tabIndex={0}
      title="공지사항 팝업 열기"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full font-bold text-[11px] tracking-tight ${
            notice.important
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-amber-400 text-slate-950'
          }`}>
            {notice.important ? '긴급공지' : '공지사항'}
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
