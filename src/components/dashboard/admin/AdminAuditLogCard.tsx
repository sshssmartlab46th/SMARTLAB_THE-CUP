import React from 'react';
import { AuditLogEntry } from '../../../types';
import { FileText, ChevronRight } from 'lucide-react';

export interface AdminAuditLogCardProps {
  logs?: AuditLogEntry[];
  auditLogs?: AuditLogEntry[];
  onViewMore?: () => void;
}

export const AdminAuditLogCard: React.FC<AdminAuditLogCardProps> = ({
  logs = [],
  auditLogs,
  onViewMore
}) => {
  const effectiveLogs = auditLogs || logs;
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-500" />
          시스템 감사 로그 (Audit)
        </h3>
        {onViewMore && (
          <button
            type="button"
            onClick={onViewMore}
            className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-emerald-400 font-medium flex items-center transition"
          >
            더보기
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {effectiveLogs.length === 0 ? (
        <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
          기록된 시스템 감사 로그가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {effectiveLogs.map((log) => (
            <div 
              key={log.id} 
              className="p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>
                  {log.timestamp} • {log.operatorRole} {log.operatorName}
                </span>
                {log.venue && (
                  <span className="text-slate-400">{log.venue}</span>
                )}
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {log.reason || `${log.matchTitle}: ${log.oldValue} ➔ ${log.newValue}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
