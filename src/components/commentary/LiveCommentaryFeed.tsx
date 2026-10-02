import React, { useState, useEffect } from 'react';
import { MatchItem, LiveCommentaryItem } from '../../types';
import { listenLiveCommentaries } from '../../services/firebaseService';
import { Volume2, Radio, Clock, Sparkles } from 'lucide-react';

interface LiveCommentaryFeedProps {
  match: MatchItem;
  compactMode?: boolean; // If true, displays compact banner format for Hero cards
}

export const LiveCommentaryFeed: React.FC<LiveCommentaryFeedProps> = ({
  match,
  compactMode = false
}) => {
  const [commentaries, setCommentaries] = useState<LiveCommentaryItem[]>([]);

  useEffect(() => {
    if (!match?.id) return;
    const unsubscribe = listenLiveCommentaries(match.id, (items) => {
      setCommentaries(items);
    });
    return () => unsubscribe();
  }, [match?.id]);

  if (compactMode) {
    if (commentaries.length === 0) return null;
    const latest = commentaries[0];

    return (
      <div className="p-3 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 space-y-1 animate-fade-in shadow-2xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-purple-600 dark:text-purple-400" />
            <span>STT 라이브 해설 ({latest.commentatorName})</span>
          </span>
          <span className="font-mono text-slate-400 text-[10px]">
            {latest.timestamp}
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
          "{latest.text}"
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-purple-600 animate-pulse" />
          <span>실시간 음성 기반 경기 해설 (STT Live Stream)</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">
          made by SMARTLAB
        </span>
      </div>

      {commentaries.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <p>등록된 실시간 라이브 해설이 없습니다.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            해설위원이 방송 중일 때 실시간 해설 텍스트가 10초 주기로 업데이트됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {commentaries.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1 hover:border-purple-200 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-purple-700 dark:text-purple-300">
                    {item.commentatorName}
                  </span>
                  {item.isSttGenerated && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 text-[9px] font-black">
                      🎙️ STT
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {item.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
