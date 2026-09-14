import React, { useState } from 'react';
import { CheerMessageItem } from '../../types';
import { Send } from 'lucide-react';

export interface LiveCheersFeedCardProps {
  cheers?: CheerMessageItem[];
  totalCount?: number;
  onViewMore?: () => void;
  onSubmitCheer?: (message: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const LiveCheersFeedCard: React.FC<LiveCheersFeedCardProps> = ({
  cheers = [],
  totalCount,
  onViewMore,
  onSubmitCheer,
  isSubmitting = false
}) => {
  const [inputMsg, setInputMsg] = useState('');
  const count = totalCount !== undefined ? totalCount : cheers.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isSubmitting) return;
    await onSubmitCheer?.(inputMsg.trim());
    setInputMsg('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
            실시간 한줄 응원
          </h2>
          {count > 0 && onViewMore && (
            <button
              type="button"
              onClick={onViewMore}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              {count}개 글 더보기
            </button>
          )}
        </div>

        {cheers.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            등록된 응원 메시지가 없습니다. 첫 번째 응원을 남겨보세요!
          </div>
        ) : (
          <div className="space-y-3.5 mb-4">
            {cheers.slice(0, 3).map((c) => (
              <div key={c.id} className="space-y-0.5">
                <div className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-white">
                  {c.authorMasked}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {c.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      {onSubmitCheer && (
        <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="우리 반에게 힘이 되는 응원을 남겨주세요!"
              maxLength={60}
              className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-red-500 dark:focus:border-emerald-500 focus:outline-hidden transition"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || isSubmitting}
              className="px-3 py-2 bg-red-600 dark:bg-emerald-500 hover:bg-red-700 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
