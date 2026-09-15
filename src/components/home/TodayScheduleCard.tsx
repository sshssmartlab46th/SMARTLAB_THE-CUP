import React from 'react';
import { MatchItem } from '../../types';
import { formatKSTTime } from '../../utils/kstTime';

export interface TodayScheduleCardProps {
  schedules?: MatchItem[];
  matches?: MatchItem[];
  userReminders?: string[];
  onViewAll?: () => void;
  onSelectMatch?: (match: MatchItem) => void;
  onToggleReminder?: (match: MatchItem) => void;
}

export const TodayScheduleCard: React.FC<TodayScheduleCardProps> = ({
  schedules,
  matches,
  userReminders = [],
  onViewAll,
  onSelectMatch,
  onToggleReminder
}) => {
  const displaySchedules = schedules || matches || [];
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    if (timeStr.includes(':') && timeStr.length <= 5) return timeStr;
    return formatKSTTime(timeStr);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
          오늘 예정된 경기
        </h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            전체보기
          </button>
        )}
      </div>

      {displaySchedules.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          오늘 예정된 경기 일정이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {displaySchedules.slice(0, 5).map((item) => {
            const isFinished = item.status === 'FINISHED';
            const isLive = item.status === 'LIVE';
            const hasReminder = userReminders.includes(item.id);

            return (
              <div 
                key={item.id}
                className="flex items-start justify-between gap-3 group"
              >
                <div 
                  onClick={() => onSelectMatch?.(item)}
                  className="space-y-0.5 cursor-pointer flex-1 min-w-0"
                >
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formatTime(item.startTime)}
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-emerald-400 transition truncate">
                    {item.title} {item.round ? `(${item.round})` : ''}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.homeTeam || item.homeClass || '홈팀'} vs {item.awayTeam || item.awayClass || '원정팀'}
                    {(item.court || item.location) ? ` · ${item.court || item.location}` : ''}
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  {isFinished ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 dark:bg-emerald-600 text-white">
                      완료
                    </span>
                  ) : isLive ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 animate-pulse">
                      진행중
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleReminder?.(item)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                        hasReminder
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {hasReminder ? '알림설정됨' : '알림'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
