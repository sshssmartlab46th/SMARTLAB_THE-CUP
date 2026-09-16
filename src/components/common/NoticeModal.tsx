import React, { useState } from 'react';
import { NoticeItem } from '../../types';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Clock,
  Archive
} from 'lucide-react';
import { formatKSTDateTime, getKSTNowParts } from '../../utils/kstTime';

export interface NoticeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  notice?: NoticeItem | null;
  onViewAllNotices?: () => void;
  onDismissToday?: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen = true,
  onClose,
  notice,
  onViewAllNotices,
  onDismissToday
}) => {
  const [dontShowToday, setDontShowToday] = useState(false);

  // If closed or no notice exists, do not render
  if (isOpen === false || !notice) {
    return null;
  }

  const handleClose = () => {
    if (dontShowToday) {
      const { dateStr } = getKSTNowParts();
      localStorage.setItem('sangsan_hide_notice_date', dateStr);
      if (onDismissToday) {
        onDismissToday();
      }
    }
    onClose();
  };

  const handleDismissTodayClick = () => {
    const { dateStr } = getKSTNowParts();
    localStorage.setItem('sangsan_hide_notice_date', dateStr);
    if (onDismissToday) {
      onDismissToday();
    }
    onClose();
  };

  const handleViewAllNotices = () => {
    if (dontShowToday) {
      const { dateStr } = getKSTNowParts();
      localStorage.setItem('sangsan_hide_notice_date', dateStr);
      if (onDismissToday) {
        onDismissToday();
      }
    }
    onClose();
    if (onViewAllNotices) {
      onViewAllNotices();
    }
  };

  const getCategoryBadge = (item: NoticeItem) => {
    if (item.important || item.category === 'urgent') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white flex items-center gap-1 shadow-xs">
          <AlertTriangle className="w-3 h-3" />
          긴급 중요 공지
        </span>
      );
    }
    switch (item.category) {
      case 'tournament':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
            경기/대진 공지
          </span>
        );
      case 'festival':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-600 text-white">
            축제/행사 공지
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950">
            대회 본부 공지
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-popup-title"
    >
      {/* Background click overlay */}
      <div 
        className="absolute inset-0" 
        onClick={handleClose} 
        aria-hidden="true" 
      />

      {/* Main Popup Window Card - Shows strictly the most recent notice */}
      <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              notice.important 
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400' 
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="notice-popup-title" className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  최신 공식 공지사항
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                  가장 최근 공지
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                상산고 실시간 본부 공식 안내
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
            aria-label="팝업 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {getCategoryBadge(notice)}
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3 h-3" />
              <span>{formatKSTDateTime(notice.createdAt)}</span>
            </div>
          </div>

          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug break-keep">
            {notice.title}
          </h4>

          {notice.content && (
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed break-words">
              {notice.content}
            </div>
          )}

          {/* External Link if provided */}
          {notice.linkUrl && (
            <a
              href={notice.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition w-full justify-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{notice.linkLabel || '관련 페이지 바로가기'}</span>
            </a>
          )}

          {/* Author info */}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>작성: {notice.authorName || '총괄본부'}</span>
            {onViewAllNotices && (
              <button
                type="button"
                onClick={handleViewAllNotices}
                className="text-red-600 dark:text-emerald-400 hover:underline font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
              >
                <Archive className="w-3 h-3" />
                <span>기존 공지 전체 목록 보기 →</span>
              </button>
            )}
          </div>
        </div>

        {/* Popup Footer (Today dismiss + View all notices + Close button) */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>오늘 하루 열지 않기</span>
          </label>

          <div className="flex items-center gap-2">
            {onViewAllNotices && (
              <button
                type="button"
                onClick={handleViewAllNotices}
                className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold transition cursor-pointer"
              >
                <Archive className="w-3 h-3" />
                <span>전체 공지 탭</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDismissTodayClick}
              className="hidden sm:inline-block text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded cursor-pointer transition"
            >
              오늘 하루 닫기
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer shadow-xs"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

