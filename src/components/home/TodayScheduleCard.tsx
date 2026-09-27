import React, { useState, useMemo } from 'react';
import { MatchItem, UserProfile } from '../../types';
import { formatKSTTime, parseKSTDateAndTime, getKSTNowParts } from '../../utils/kstTime';
import { 
  Bell, 
  BellRing, 
  Calendar, 
  Check, 
  AlertCircle, 
  Info, 
  ChevronRight,
  Loader2 
} from 'lucide-react';

export interface TodayScheduleCardProps {
  schedules?: MatchItem[];
  matches?: MatchItem[];
  userReminders?: string[];
  currentUser?: UserProfile | null;
  onViewAll?: () => void;
  onSelectMatch?: (match: MatchItem) => void;
  onToggleReminder?: (match: MatchItem) => void;
  onToggleAllReminders?: (matches: MatchItem[], enable: boolean) => void | Promise<void>;
  onRequireLogin?: () => void;
}

export const TodayScheduleCard: React.FC<TodayScheduleCardProps> = ({
  schedules,
  matches,
  userReminders = [],
  currentUser,
  onViewAll,
  onSelectMatch,
  onToggleReminder,
  onToggleAllReminders,
  onRequireLogin
}) => {
  const [isTogglingBulk, setIsTogglingBulk] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const { dateStr: kstToday } = getKSTNowParts();

  // Determine today's schedules
  const displaySchedules = useMemo(() => {
    if (schedules && schedules.length > 0) return schedules;
    const source = matches || [];

    // Filter matches explicitly scheduled for today
    const todayList = source.filter((item) => {
      if (!item.startTime) return false;
      if (item.startTime.includes(':') && item.startTime.length <= 5) return true;
      const parsed = parseKSTDateAndTime(item.startTime);
      return parsed.date === kstToday;
    });

    if (todayList.length > 0) return todayList;
    // Fallback: if database has dates from another day, display active source matches
    return source;
  }, [schedules, matches, kstToday]);

  // Sort chronologically by start time
  const sortedSchedules = useMemo(() => {
    return [...displaySchedules].sort((a, b) => {
      const timeA = a.startTime ? (parseKSTDateAndTime(a.startTime).time || a.startTime) : '';
      const timeB = b.startTime ? (parseKSTDateAndTime(b.startTime).time || b.startTime) : '';
      return timeA.localeCompare(timeB);
    });
  }, [displaySchedules]);

  // Eligible matches for reminders (scheduled or live matches, excluding finished ones)
  const eligibleMatches = useMemo(() => {
    return sortedSchedules.filter((m) => m.status !== 'FINISHED');
  }, [sortedSchedules]);

  // Count how many eligible matches are already reminded
  const remindedCount = useMemo(() => {
    return eligibleMatches.filter((m) => userReminders.includes(m.id)).length;
  }, [eligibleMatches, userReminders]);

  const isAllReminded = eligibleMatches.length > 0 && remindedCount === eligibleMatches.length;
  const hasSomeReminded = remindedCount > 0 && !isAllReminded;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    if (timeStr.includes(':') && timeStr.length <= 5) return timeStr;
    return formatKSTTime(timeStr);
  };

  // Bulk Toggle handler for all today's matches
  const handleBulkToggle = async () => {
    if (!currentUser) {
      setStatusFeedback({
        message: '로그인이 필요한 기능입니다. 로그인 후 오늘 경기 알림을 설정해주세요.',
        type: 'info'
      });
      setTimeout(() => setStatusFeedback(null), 3500);
      onRequireLogin?.();
      return;
    }

    if (eligibleMatches.length === 0) {
      setStatusFeedback({
        message: '오늘 알림을 설정할 수 있는 예정 경기가 없습니다.',
        type: 'info'
      });
      setTimeout(() => setStatusFeedback(null), 3000);
      return;
    }

    setIsTogglingBulk(true);
    try {
      const nextEnable = !isAllReminded;
      if (onToggleAllReminders) {
        await onToggleAllReminders(eligibleMatches, nextEnable);
      } else if (onToggleReminder) {
        // Fallback: loop through each eligible match and toggle
        for (const item of eligibleMatches) {
          const isSet = userReminders.includes(item.id);
          if (nextEnable !== isSet) {
            await onToggleReminder(item);
          }
        }
      }

      setStatusFeedback({
        message: nextEnable
          ? `오늘 예정된 전 경기(${eligibleMatches.length}개) 시작 10분 전 알림이 모두 설정되었습니다!`
          : '오늘 예정된 전 경기 알림이 모두 해제되었습니다.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setStatusFeedback({
        message: '알림 일괄 설정 중 오류가 발생했습니다. 다시 시도해주세요.',
        type: 'error'
      });
    } finally {
      setIsTogglingBulk(false);
      setTimeout(() => setStatusFeedback(null), 3500);
    }
  };

  // Individual match reminder button handler
  const handleIndividualToggle = (item: MatchItem) => {
    if (!currentUser) {
      setStatusFeedback({
        message: '로그인이 필요한 기능입니다. 로그인 후 경기 알림을 설정해주세요.',
        type: 'info'
      });
      setTimeout(() => setStatusFeedback(null), 3500);
      onRequireLogin?.();
      return;
    }
    onToggleReminder?.(item);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
            오늘 예정된 경기
          </h2>
          {sortedSchedules.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {sortedSchedules.length}
            </span>
          )}
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition font-medium flex items-center gap-0.5"
          >
            <span>전체보기</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Bulk Toggle Card: Remind me of all today's matches */}
      {sortedSchedules.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isAllReminded
                    ? 'bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                    : hasSomeReminded
                    ? 'bg-red-100 dark:bg-emerald-950/80 text-red-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {isTogglingBulk ? (
                  <Loader2 className="w-4 h-4 animate-spin text-inherit" />
                ) : isAllReminded ? (
                  <BellRing className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    오늘 전 경기 알림
                  </span>
                  {eligibleMatches.length > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isAllReminded
                        ? 'bg-red-100 dark:bg-emerald-950 text-red-700 dark:text-emerald-300'
                        : hasSomeReminded
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {remindedCount}/{eligibleMatches.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {!currentUser 
                    ? '로그인 후 오늘 경기 일괄 알림 받기'
                    : eligibleMatches.length === 0
                    ? '오늘 모든 경기가 종료되었습니다'
                    : isAllReminded
                    ? '오늘 전 경기 시작 10분 전 알림 ON'
                    : hasSomeReminded
                    ? `일부 경기 알림 중 · 탭하여 전 경기 켜기`
                    : '오늘 모든 경기 시작 10분 전 알림 받기'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isAllReminded}
              onClick={handleBulkToggle}
              disabled={isTogglingBulk || eligibleMatches.length === 0}
              title={
                !currentUser 
                  ? '로그인이 필요한 기능입니다' 
                  : eligibleMatches.length === 0
                  ? '예정된 경기가 없습니다'
                  : isAllReminded 
                  ? '오늘 모든 경기 알림 일괄 해제' 
                  : '오늘 모든 경기 알림 일괄 설정 (Remind me of all today\'s matches)'
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
                isAllReminded 
                  ? 'bg-red-600 dark:bg-emerald-500' 
                  : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAllReminded ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Feedback notification inside card */}
          {statusFeedback && (
            <div className={`mt-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              statusFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : statusFeedback.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              {statusFeedback.type === 'success' && <Check className="w-3.5 h-3.5 shrink-0" />}
              {statusFeedback.type === 'info' && <Info className="w-3.5 h-3.5 shrink-0" />}
              {statusFeedback.type === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{statusFeedback.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Schedule Items List */}
      {sortedSchedules.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          오늘 예정된 경기 일정이 없습니다.
        </div>
      ) : (
        <div className="space-y-3.5">
          {sortedSchedules.slice(0, 5).map((item) => {
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
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{formatTime(item.startTime)}</span>
                    {hasReminder && (
                      <span className="inline-flex items-center text-[10px] text-red-600 dark:text-emerald-400 font-sans font-medium">
                        <Bell className="w-3 h-3 inline mr-0.5" />
                        알림 ON
                      </span>
                    )}
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
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      종료
                    </span>
                  ) : isLive ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 dark:bg-emerald-500 text-white dark:text-slate-950 animate-pulse">
                      진행중
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleIndividualToggle(item)}
                      title={hasReminder ? '알림 해제' : '경기 시작 10분 전 알림 받기'}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition flex items-center gap-1 cursor-pointer ${
                        hasReminder
                          ? 'border-red-500 dark:border-emerald-500 bg-red-50 dark:bg-emerald-950/40 text-red-600 dark:text-emerald-400 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-red-400 hover:text-red-600 dark:hover:border-emerald-400 dark:hover:text-emerald-400'
                      }`}
                    >
                      {hasReminder ? (
                        <>
                          <BellRing className="w-3 h-3 text-red-600 dark:text-emerald-400" />
                          <span>알림됨</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3 h-3" />
                          <span>알림</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {sortedSchedules.length > 5 && (
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={onViewAll}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
              >
                외 {sortedSchedules.length - 5}개 경기 더 보기 &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
