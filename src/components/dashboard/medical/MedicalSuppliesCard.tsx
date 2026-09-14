import React from 'react';
import { SupplyItem } from '../../../types';
import { AlertTriangle, Package, Sun, Wind } from 'lucide-react';

export interface FieldRiskIndicator {
  venue: string;
  sport: string;
  details: string;
  statusTag: string;
  isWarning: boolean;
}

export interface MedicalSuppliesCardProps {
  risks?: FieldRiskIndicator[];
  supplies?: SupplyItem[];
}

export const MedicalSuppliesCard: React.FC<MedicalSuppliesCardProps> = ({
  risks = [],
  supplies = []
}) => {
  return (
    <div className="space-y-4">
      {/* Field Environmental Risk Indicators */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            경기장별 환경 지표 ({risks.length}곳)
          </h3>
        </div>

        {risks.length === 0 ? (
          <div className="py-4 text-center text-slate-400 dark:text-slate-500 text-xs">
            등록된 경기장별 환경 특이사항이 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5">
            {risks.map((r, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {r.venue} ({r.sport})
                  </div>
                  <div className="text-[11px] text-slate-500">{r.details}</div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  r.isWarning
                    ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {r.statusTag}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical supplies inventory */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            보건실 / 의무 스탠드 구급 물품 ({supplies.length}개)
          </h3>
        </div>

        {supplies.length === 0 ? (
          <div className="py-4 text-center text-slate-400 dark:text-slate-500 text-xs">
            등록된 의무 구급 물품이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {supplies.map((item) => (
              <div 
                key={item.id}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {item.name}
                </span>
                <span className={`font-mono font-bold text-[11px] ${
                  item.needsAttention ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {item.statusText || `${item.currentQty} / ${item.totalQty} ${item.unit}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
