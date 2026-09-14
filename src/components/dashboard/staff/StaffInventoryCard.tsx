import React from 'react';
import { SupplyItem } from '../../../types';
import { Package, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface StaffInventoryCardProps {
  items?: SupplyItem[];
  onAddItem?: () => void;
}

export const StaffInventoryCard: React.FC<StaffInventoryCardProps> = ({
  items = [],
  onAddItem
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
            본부 장비 및 물품 상황 ({items.length}개)
          </h3>
        </div>
        {onAddItem && (
          <button
            type="button"
            onClick={onAddItem}
            className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 transition"
          >
            + 물품 추가
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
          등록된 본부 장비 및 물품이 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div 
              key={item.id}
              className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {item.statusText || `${item.currentQty}/${item.totalQty} ${item.unit}`}
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                item.needsAttention
                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              }`}>
                {item.needsAttention ? '확인 필요' : '준비완료'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
