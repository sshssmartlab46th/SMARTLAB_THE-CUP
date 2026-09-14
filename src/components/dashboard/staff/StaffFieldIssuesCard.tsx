import React, { useState } from 'react';
import { FieldIncidentItem } from '../../../types';
import { AlertTriangle, Volume2, CheckCircle2 } from 'lucide-react';

export interface StaffFieldIssuesCardProps {
  issues?: FieldIncidentItem[];
  onBroadcastNotice?: (message: string) => Promise<void> | void;
  isBroadcasting?: boolean;
}

export const StaffFieldIssuesCard: React.FC<StaffFieldIssuesCardProps> = ({
  issues = [],
  onBroadcastNotice,
  isBroadcasting = false
}) => {
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim() || isBroadcasting) return;
    await onBroadcastNotice?.(broadcastMessage.trim());
    setBroadcastMessage('');
  };

  return (
    <div className="space-y-4">
      {/* Field Issues Feed */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            현장 특이사항 및 조치 피드
          </h3>
        </div>

        {issues.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
            현재 보고된 현장 특이사항이 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5">
            {issues.map((item) => (
              <div 
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {item.location}
                  </span>
                  <span className="text-slate-400">{item.reportedAgo}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium">
                  {item.issueDescription}
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold pt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{item.statusLabel}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Announcement Writer */}
      {onBroadcastNotice && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
              실시간 현장 방송 공지 작성
            </h3>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-2.5">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="예) 2학년 농구 리그 출전 학급은 체육관 대기 장소로 집결해주십시오."
              rows={2}
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
            />
            <button
              type="submit"
              disabled={!broadcastMessage.trim() || isBroadcasting}
              className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50"
            >
              공식 안내방송 송출하기
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
