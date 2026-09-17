import React, { useState } from 'react';
import { SubstitutionRecord } from '../../../types';
import { RefreshCw, FileEdit, Plus, Save } from 'lucide-react';

export interface RefereeSubstitutionsCardProps {
  substitutions?: SubstitutionRecord[];
  initialMemo?: string;
  onSaveMemo?: (memo: string) => void;
  onAddSubstitution?: () => void;
}

export const RefereeSubstitutionsCard: React.FC<RefereeSubstitutionsCardProps> = ({
  substitutions = [],
  initialMemo = '',
  onSaveMemo,
  onAddSubstitution
}) => {
  const [memo, setMemo] = useState(initialMemo);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSaveMemo?.(memo);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Real-time player substitution log */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            실시간 교체 선수 교대 기록
          </h3>
          {onAddSubstitution && (
            <button
              type="button"
              onClick={onAddSubstitution}
              className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              교체 기록 추가
            </button>
          )}
        </div>

        {substitutions.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs">
            기록된 선수 교대 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {substitutions.map((sub) => {
              const renderPlayer = (player: any, fallback?: string) => {
                if (!player && fallback) return fallback;
                if (typeof player === 'string') return player;
                if (player && typeof player === 'object') {
                  return `${player.name}${player.position ? ` (${player.position})` : ''}`;
                }
                return fallback || '';
              };

              const classDisplay = sub.classLabel || sub.teamLabel || '교체';
              const timeDisplay = sub.timeLabel || (sub.minute ? `${sub.minute}분` : '');
              const outDisplay = renderPlayer(sub.playerOut, sub.outPlayer);
              const inDisplay = renderPlayer(sub.playerIn, sub.inPlayer);

              return (
                <div 
                  key={sub.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-red-600 dark:text-red-400 mr-1.5">
                      [{classDisplay}]
                    </span>
                    {outDisplay && <span className="text-slate-500 mr-1">OUT: {outDisplay}</span>}
                    {inDisplay && <span className="text-slate-800 dark:text-slate-200 font-bold">IN: {inDisplay}</span>}
                  </div>
                  {timeDisplay && (
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {timeDisplay}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Field referee offline notes & incident memo */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <FileEdit className="w-4 h-4 text-amber-500" />
            현장 판정 기록 및 오프라인 특이사항 메모
          </h3>
          {onSaveMemo && (
            <button
              type="button"
              onClick={handleSave}
              className="text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1 hover:text-slate-900"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaved ? '저장됨' : '저장'}
            </button>
          )}
        </div>

        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="판정 관련 특이사항 및 부상 발생 경위를 기록하세요. 네트워크 손실 시에도 로컬에 보존됩니다."
          rows={3}
          className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
        />
      </div>
    </div>
  );
};
