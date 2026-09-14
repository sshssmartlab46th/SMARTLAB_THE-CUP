import React from 'react';
import { MedicalIncidentQueueItem } from '../../../types';
import { AlertCircle, Ambulance, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface MedicalTriageQueueCardProps {
  queue?: MedicalIncidentQueueItem[];
  unconfirmedCount?: number;
  onTransferHospital?: (id: string) => void;
  onResolveIncident?: (id: string) => void;
}

export const MedicalTriageQueueCard: React.FC<MedicalTriageQueueCardProps> = ({
  queue = [],
  unconfirmedCount,
  onTransferHospital,
  onResolveIncident
}) => {
  return (
    <div className="space-y-4">
      {/* Privacy disclaimer banner */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>학생 개인정보 및 의료 민감 데이터 보호 의무 대상 화면</span>
        </div>
        <span className="text-[11px] text-slate-500 hidden md:inline">
          환자 기본 정보 및 보호자 비상 연락처 노출 방지에 유의하세요.
        </span>
      </div>

      {/* Main Triage Queue Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
              실시간 부상 환자 접수 / 트리아지 대기 큐
            </h3>
          </div>
          {unconfirmedCount !== undefined && (
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              미확인 {unconfirmedCount}건
            </span>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            현재 대기 중인 부상 환자가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <div 
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.severity === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-500 text-slate-950 font-bold'
                    }`}>
                      {item.severityLabel}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.patientClass} {item.patientName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    접수: {item.reportedAgo} ({item.reportedTime})
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {item.description}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-500">
                    📍 {item.location} · 의무담당: {item.assignedStaff}
                  </div>

                  <div className="flex items-center gap-2">
                    {onTransferHospital && (
                      <button
                        type="button"
                        onClick={() => onTransferHospital(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                      >
                        <Ambulance className="w-3.5 h-3.5" />
                        병원 이송 연동
                      </button>
                    )}
                    {onResolveIncident && (
                      <button
                        type="button"
                        onClick={() => onResolveIncident(item.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        조치 완료 처리
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
