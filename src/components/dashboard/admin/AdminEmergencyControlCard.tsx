import React, { useState, useEffect } from 'react';
import { AlertOctagon, CloudRain, ShieldAlert, CheckCircle2, RotateCcw, Sun } from 'lucide-react';

export interface AdminEmergencyControlCardProps {
  onStopAllMatches?: () => void;
  onResumeAllMatches?: () => void;
  onSwitchToIndoor?: () => void;
  onSwitchToOutdoor?: () => void;
  isEmergencyActive?: boolean;
  isIndoorMode?: boolean;
}

export const AdminEmergencyControlCard: React.FC<AdminEmergencyControlCardProps> = ({
  onStopAllMatches,
  onResumeAllMatches,
  onSwitchToIndoor,
  onSwitchToOutdoor,
  isEmergencyActive = false,
  isIndoorMode = false
}) => {
  const [internalEmergency, setInternalEmergency] = useState(isEmergencyActive);
  const [internalIndoor, setInternalIndoor] = useState(isIndoorMode);

  useEffect(() => {
    setInternalEmergency(isEmergencyActive);
  }, [isEmergencyActive]);

  useEffect(() => {
    setInternalIndoor(isIndoorMode);
  }, [isIndoorMode]);

  const active = isEmergencyActive !== undefined ? isEmergencyActive : internalEmergency;
  const isIndoor = isIndoorMode !== undefined ? isIndoorMode : internalIndoor;

  const handleToggleEmergency = () => {
    if (active) {
      setInternalEmergency(false);
      onResumeAllMatches?.();
    } else {
      setInternalEmergency(true);
      onStopAllMatches?.();
    }
  };

  const handleToggleIndoor = () => {
    if (isIndoor) {
      setInternalIndoor(false);
      onSwitchToOutdoor?.();
    } else {
      setInternalIndoor(true);
      onSwitchToIndoor?.();
    }
  };

  return (
    <div className={`rounded-2xl border transition-all p-5 shadow-xs ${
      active 
        ? 'border-red-400 dark:border-red-700 bg-red-100/70 dark:bg-red-950/40 ring-2 ring-red-500/20' 
        : isIndoor
          ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertOctagon className={`w-5 h-5 ${active ? 'text-red-600 animate-pulse' : 'text-slate-600 dark:text-slate-400'}`} />
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
            긴급 사태 및 경기장 통제 제어
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {isIndoor && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              실내 대체 진행중
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
            active 
              ? 'bg-red-600 text-white animate-pulse' 
              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
          }`}>
            {active ? '비상 중단 발령 중' : '정상 운영 중'}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        기상 악화, 안전 점검 발생 시 전체 경기를 일시 중단하거나 실내 장소로 대체 전환할 수 있습니다. 
        재개 및 실외 복귀 시 이전 중단/실내 공지는 자동으로 정리됩니다.
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleToggleEmergency}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
            active
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {active ? (
            <>
              <RotateCcw className="w-4 h-4" />
              경기 정상 재개 (중단 공지 삭제)
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              전체 경기 긴급 중단
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleToggleIndoor}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
            isIndoor
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
          }`}
        >
          {isIndoor ? (
            <>
              <Sun className="w-4 h-4" />
              실외 복귀 전환 (실내 공지 삭제)
            </>
          ) : (
            <>
              <CloudRain className="w-4 h-4" />
              실내 대체 전환 (우천 대비)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
