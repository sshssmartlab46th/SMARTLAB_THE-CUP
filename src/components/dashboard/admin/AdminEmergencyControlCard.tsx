import React, { useState } from 'react';
import { AlertOctagon, CloudRain, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

export interface AdminEmergencyControlCardProps {
  onStopAllMatches?: () => void;
  onResumeAllMatches?: () => void;
  onSwitchToIndoor?: () => void;
  isEmergencyActive?: boolean;
}

export const AdminEmergencyControlCard: React.FC<AdminEmergencyControlCardProps> = ({
  onStopAllMatches,
  onResumeAllMatches,
  onSwitchToIndoor,
  isEmergencyActive = false
}) => {
  const [internalEmergency, setInternalEmergency] = useState(isEmergencyActive);
  const [indoorSwitched, setIndoorSwitched] = useState(false);

  const active = isEmergencyActive !== undefined ? isEmergencyActive : internalEmergency;

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
    setIndoorSwitched(!indoorSwitched);
    onSwitchToIndoor?.();
  };

  return (
    <div className={`rounded-2xl border transition-all p-5 shadow-xs ${
      active 
        ? 'border-red-400 dark:border-red-700 bg-red-100/70 dark:bg-red-950/40 ring-2 ring-red-500/20' 
        : 'border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertOctagon className={`w-5 h-5 ${active ? 'text-red-600 animate-pulse' : 'text-red-500'}`} />
          <h2 className="font-bold text-sm sm:text-base text-red-700 dark:text-red-400 tracking-tight">
            긴급 사태 통제 제어
          </h2>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
          active 
            ? 'bg-red-600 text-white animate-pulse' 
            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
        }`}>
          {active ? '비상 중단 발령 중' : '정상 운영 중'}
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        우천, 폭염 혹은 환자 발생 시 전체 경기를 일시 중단하거나 실내 장소로 강제 전환 전송할 수 있습니다.
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleToggleEmergency}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs ${
            active
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {active ? (
            <>
              <RotateCcw className="w-4 h-4" />
              경기 정상 재개
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
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs ${
            indoorSwitched
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
          }`}
        >
          <CloudRain className="w-4 h-4" />
          {indoorSwitched ? '실외 복귀 전환' : '실내 대체 전환'}
        </button>
      </div>
    </div>
  );
};
