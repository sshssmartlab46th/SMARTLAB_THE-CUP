import React from 'react';
import { AuditLog } from '../types';
import { FileText, Shield, AlertTriangle } from 'lucide-react';

interface ScoreAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLog[];
  matchTitle?: string;
}

export const ScoreAuditModal: React.FC<ScoreAuditModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  matchTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                점수 수정 및 감사 기록 (Score Audit Logs)
              </h3>
              <p className="text-xs text-slate-400">
                {matchTitle ? `${matchTitle} 감사 기록` : '전체 경기 점수 변경 및 취소 내역'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-mono">
            ×
          </button>
        </div>

        {/* Audit Log Entries */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>아직 기록된 점수 취소 또는 수정 감사 로그가 없습니다.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                심판진이 점수를 번복하거나 취소할 경우 여기에 불변 기록으로 남습니다.
              </p>
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {log.action}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                </div>

                <div className="text-slate-300">
                  <span className="text-slate-400">상세: </span>
                  {log.details}
                </div>

                {log.reason && (
                  <div className="bg-slate-900 p-2 rounded text-[11px] text-amber-300">
                    <strong className="text-slate-400">취소/수정 사유: </strong>
                    {log.reason}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 text-right">
                  기록 담당자: <span className="text-slate-300 font-semibold">{log.actor}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            * 상산고 학생회 규정에 따라 본 감사 로그는 삭제나 수정이 불가능합니다.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
