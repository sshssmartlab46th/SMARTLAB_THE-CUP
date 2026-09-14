import React from 'react';
import { HospitalTransferItem } from '../../../types';
import { PhoneCall, Ambulance, ExternalLink } from 'lucide-react';

export interface HotlineContact {
  label: string;
  number: string;
}

export interface MedicalEmergencyHotlineCardProps {
  hotlines?: HotlineContact[];
  transfers?: HospitalTransferItem[];
}

export const MedicalEmergencyHotlineCard: React.FC<MedicalEmergencyHotlineCardProps> = ({
  hotlines = [
    { label: '119 응급구조센터', number: '119' }
  ],
  transfers = []
}) => {
  return (
    <div className="space-y-4">
      {/* Emergency Hotlines */}
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-red-700 dark:text-red-400">
          <PhoneCall className="w-4 h-4" />
          <span>긴급 구조 핫라인</span>
        </div>

        {hotlines.length === 0 ? (
          <div className="py-2 text-center text-slate-400 text-xs">
            등록된 긴급 연락처가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {hotlines.map((h, idx) => (
              <div 
                key={idx}
                className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-red-100 dark:border-red-900/40 flex items-center justify-between text-xs"
              >
                <span className="text-slate-700 dark:text-slate-300 font-medium">{h.label}</span>
                <span className="font-mono font-black text-red-600 dark:text-red-400 text-sm">
                  {h.number}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* External Hospital Transfers Record */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center gap-2">
          <Ambulance className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            외부 병원 후송 환자 대장 ({transfers.length}건)
          </h3>
        </div>

        {transfers.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs">
            현재 외부 병원으로 후송된 환자가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {transfers.map((t) => (
              <div 
                key={t.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {t.hospitalName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {t.transferTime}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                  {t.patientClass} {t.patientName} ({t.reason})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
