import React from 'react';
import { NoticeItem } from '../../types';
import { Bell, X, Calendar, AlertTriangle } from 'lucide-react';

export interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice?: NoticeItem | null;
  notices?: NoticeItem[];
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  onClose,
  notice,
  notices = []
}) => {
  if (!isOpen) return null;

  const displayList = notice 
    ? [notice, ...notices.filter(n => n.id !== notice.id)]
    : notices;

  const defaultNotice: NoticeItem = {
    id: 'default-notice',
    title: '오후 2시 폐회식 및 이어달리기 예선이 시작됩니다!',
    content: '모든 학급은 스탠드로 모여주시기 바랍니다. 질서 있는 관람과 이동을 위해 각 학급 반장 및 학생회 진행 요원의 안내에 적극 협조해주시기 바랍니다.',
    type: 'global',
    authorName: '체육대회 운영본부',
    authorRole: 'admin',
    authorId: 'admin',
    important: true,
    createdAt: new Date().toISOString()
  };

  const listToRender = displayList.length > 0 ? displayList : [defaultNotice];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                대회 본부 공식 공지사항
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                상산고등학교 체육대회 스마트 보드 실시간 방송
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          {listToRender.map((item, idx) => (
            <div 
              key={item.id || idx}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${
                  item.priority === 'HIGH' || item.type === 'URGENT'
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-400 text-slate-950'
                }`}>
                  {item.type === 'URGENT' ? '긴급공지' : '일반공지'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {item.time || '방금 전'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                📢 {item.title}
              </h4>
              {item.content && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
