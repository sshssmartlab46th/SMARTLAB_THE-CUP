import React, { useState } from 'react';
import { MatchItem, NoticeItem } from '../../../types';
import { Megaphone, Calendar, Send, AlertTriangle } from 'lucide-react';

export interface ClassScheduleInquiryCardProps {
  urgentNotice?: NoticeItem | null;
  classSchedules?: MatchItem[];
  onSubmitInquiry?: (content: string) => Promise<void> | void;
  isSubmittingInquiry?: boolean;
}

export const ClassScheduleInquiryCard: React.FC<ClassScheduleInquiryCardProps> = ({
  urgentNotice,
  classSchedules = [],
  onSubmitInquiry,
  isSubmittingInquiry = false
}) => {
  const [inquiryText, setInquiryText] = useState('');

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim() || isSubmittingInquiry) return;
    await onSubmitInquiry?.(inquiryText.trim());
    setInquiryText('');
  };

  const getStatusBadge = (status: MatchItem['status']) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 dark:bg-emerald-500 text-white animate-pulse">
            경기 진행중
          </span>
        );
      case 'FINISHED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            종료
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
            대기
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Headquarters urgent bulletin */}
      {urgentNotice && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400">
            <Megaphone className="w-3.5 h-3.5" />
            <span>본부 공식 긴급 속보</span>
          </div>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            "{urgentNotice.title} {urgentNotice.content ? `— ${urgentNotice.content}` : ''}"
          </p>
          <div className="text-[10px] text-slate-400 pt-0.5">
            {urgentNotice.createdAt || '방금 전 업데이트 됨'}
          </div>
        </div>
      )}

      {/* Today's class match schedules */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            오늘 우리 반 주요 일정
          </h3>
        </div>

        {classSchedules.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
            오늘 예정된 소속 학급 경기가 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
            {classSchedules.map((m) => (
              <div key={m.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    {m.startTime ? new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '경기'}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {m.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    vs {m.awayTeam}
                  </div>
                </div>
                <div className="shrink-0">
                  {getStatusBadge(m.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Inquiry / Objection Submission Form */}
      {onSubmitInquiry && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
              본부 및 심판진에 문의/이의제기
            </h3>
          </div>

          <form onSubmit={handleInquirySubmit} className="space-y-2.5">
            <textarea
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              placeholder="예) 축구 후반 득점 오프사이드 여부 비디오 판독 확인을 요청합니다."
              rows={2}
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
            />
            <button
              type="submit"
              disabled={!inquiryText.trim() || isSubmittingInquiry}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition disabled:opacity-50"
            >
              이의제기 공식 접수하기
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
