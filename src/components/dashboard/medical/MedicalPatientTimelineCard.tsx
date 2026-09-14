import React from 'react';
import { MedicalTimelineItem } from '../../../types';
import { Clock, FileText, CheckCircle2 } from 'lucide-react';

export interface MedicalPatientTimelineCardProps {
  patientHeader?: string;
  timeline?: MedicalTimelineItem[];
  onWriteOfficialReport?: () => void;
}

export const MedicalPatientTimelineCard: React.FC<MedicalPatientTimelineCardProps> = ({
  patientHeader = '응급조치 실시간 타임라인',
  timeline = [],
  onWriteOfficialReport
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          {patientHeader}
        </h3>
      </div>

      {timeline.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          선택된 환자의 진행 타임라인이 없습니다.
        </div>
      ) : (
        <div className="space-y-2 relative pl-2 border-l-2 border-red-200 dark:border-red-900/60 ml-2">
          {timeline.map((step) => (
            <div key={step.id} className="relative pl-3 text-xs space-y-0.5">
              <span className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
              <div className="font-mono font-bold text-red-600 dark:text-red-400 text-[11px]">
                {step.time}
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {step.activity}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Official Incident Report Writing Box */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>공식 사고 보고서 작성 가이드</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            사고 경위 및 본부 조치 기록 후 전교 관리 대장에 즉시 자동 반영됩니다.
          </p>
        </div>

        {onWriteOfficialReport && (
          <button
            type="button"
            onClick={onWriteOfficialReport}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shrink-0 transition"
          >
            보고서 작성
          </button>
        )}
      </div>
    </div>
  );
};
