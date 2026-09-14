import React from 'react';
import { AssignedRefereeMatch } from '../../../types';
import { Calendar, Lock, HardDrive, CheckCircle2 } from 'lucide-react';

export interface RefereeAssignedMatchesCardProps {
  assignedMatches?: AssignedRefereeMatch[];
  selectedMatchId?: string;
  onSelectMatch?: (id: string) => void;
  storageUsageMb?: number;
  storageLimitMb?: number;
}

export const RefereeAssignedMatchesCard: React.FC<RefereeAssignedMatchesCardProps> = ({
  assignedMatches = [],
  selectedMatchId,
  onSelectMatch,
  storageUsageMb,
  storageLimitMb
}) => {
  return (
    <div className="space-y-4">
      {/* Assigned Matches List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            나에게 배정된 경기 목록
          </h3>
        </div>

        {assignedMatches.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            현재 배정된 담당 경기가 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignedMatches.map((m) => {
              const isSelected = m.id === selectedMatchId;
              return (
                <div 
                  key={m.id}
                  onClick={() => onSelectMatch?.(m.id)}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                    isSelected 
                      ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20' 
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                      {m.status === 'LIVE' ? `진행 중 (${m.timeLabel})` : `대기 중 (${m.timeLabel})`}
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white">{m.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.teams}</div>
                  </div>

                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    m.status === 'LIVE' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {m.status === 'LIVE' ? '제어 중' : '예정'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unassigned Matches Access Restriction Notice */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
          <Lock className="w-3.5 h-3.5" />
          <span>비배정 경기 접근 제한</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          타 심판진에게 배정된 경기의 스코어 및 경기 상태 제어 권한이 없습니다. 경기 대진 정보만 뷰어로 조회할 수 있습니다.
        </p>
      </div>

      {/* Device Cache & Storage Status */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span>기록원 디바이스 상태</span>
        </div>
        <div className="flex justify-between text-slate-500 pt-1">
          <span>로컬 데이터 무결성</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 정상 (Sync 완료)
          </span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>오프라인 캐시 및 동기화</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {storageUsageMb !== undefined && storageLimitMb !== undefined 
              ? `${storageUsageMb} MB / ${storageLimitMb} MB` 
              : 'IndexedDB 활성화됨'}
          </span>
        </div>
      </div>
    </div>
  );
};
