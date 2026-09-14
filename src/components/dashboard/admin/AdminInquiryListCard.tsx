import React from 'react';
import { SuggestionItem } from '../../../types';
import { MessageSquareWarning, CheckCircle, Clock } from 'lucide-react';

export interface AdminInquiryListCardProps {
  inquiries?: SuggestionItem[];
  onAnswerInquiry?: (id: string) => void;
}

export const AdminInquiryListCard: React.FC<AdminInquiryListCardProps> = ({
  inquiries = [],
  onAnswerInquiry
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <MessageSquareWarning className="w-4 h-4 text-amber-500" />
          이의제기 및 건의사항 접수 ({inquiries.length}건)
        </h3>
      </div>

      {inquiries.length === 0 ? (
        <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
          접수된 이의제기 및 건의사항이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const isResolved = !!inq.answer;
            return (
              <div 
                key={inq.id}
                onClick={() => onAnswerInquiry?.(inq.id)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-1.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {inq.authorName} ({inq.authorStudentId || '학급'})
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isResolved 
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                  }`}>
                    {isResolved ? '완료' : '대기중'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  "{inq.content}"
                </p>
                {inq.answer && (
                  <div className="pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>답변 완료: {inq.answer}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
