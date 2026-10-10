import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Copy, Check, Trophy, Award, Activity } from 'lucide-react';
import { MatchItem } from '../../types';
import {
  getMatchSummaryDetails,
  generateMatchResultCardDataUrl,
  downloadMatchResultCardImage,
  shareMatchResultCard,
  formatMatchSummaryText
} from '../../utils/matchResultCardGenerator';

export interface MatchResultCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchItem;
}

export const MatchResultCardModal: React.FC<MatchResultCardModalProps> = ({
  isOpen,
  onClose,
  match
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    if (isOpen && match) {
      try {
        const url = generateMatchResultCardDataUrl(match);
        setDataUrl(url);
      } catch (e) {
        console.error('[MatchResultCardModal] Failed to generate card image', e);
      }
    }
  }, [isOpen, match]);

  if (!isOpen) return null;

  const summary = getMatchSummaryDetails(match);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleDownload = () => {
    downloadMatchResultCardImage(match);
    showToast('이미지 카드가 다운로드되었습니다.');
  };

  const handleShare = async () => {
    const res = await shareMatchResultCard(match);
    if (res.success) {
      if (res.method === 'clipboard') {
        showToast('경기 결과 요약 텍스트가 클립보드에 복사되었습니다.');
      } else {
        showToast('경기 결과 공유창을 열었습니다.');
      }
    } else {
      showToast('클립보드 복사 완료!');
    }
  };

  const handleCopyText = async () => {
    const text = formatMatchSummaryText(match);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      showToast('요약 텍스트가 클립보드에 복사되었습니다!');
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      showToast('텍스트 복사 실패');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-full shadow-lg transition animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                경기 결과 요약 카드
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {summary.sportName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {summary.title} • {summary.roundText} ({summary.courtText})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generated Image Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-inner group">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`${summary.homeTeamName} vs ${summary.awayTeamName} 경기 결과`}
              className="w-full h-auto object-contain rounded-2xl"
            />
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm">
              결과 이미지 생성 중...
            </div>
          )}
        </div>

        {/* Quick Summary Section (Mobile Accessible Fallback View) */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> 최종 스코어 요약
            </span>
            <span className="text-slate-400">{summary.dateText}</span>
          </div>

          <div className="flex items-center justify-between text-sm font-extrabold px-2">
            <span className="text-slate-200">{summary.homeTeamName}</span>
            <span className="text-xl font-black text-amber-400">
              {summary.homeScore} : {summary.awayScore}
              {typeof summary.homePenaltyScore === 'number' && typeof summary.awayPenaltyScore === 'number' && (
                <span className="text-xs text-sky-400 block font-normal text-center">
                  (PK {summary.homePenaltyScore}:{summary.awayPenaltyScore})
                </span>
              )}
            </span>
            <span className="text-slate-200">{summary.awayTeamName}</span>
          </div>

          {(summary.homeScorers.length > 0 || summary.awayScorers.length > 0) && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60 text-[11px] text-slate-300">
              <div>
                <span className="font-bold text-slate-400 block mb-1">⚽ {summary.homeTeamName} 득점</span>
                {summary.homeScorers.length > 0 ? (
                  summary.homeScorers.map((s, i) => (
                    <div key={i}>• {s.player} ({s.details.join(', ')})</div>
                  ))
                ) : (
                  <span className="text-slate-500">기록 없음</span>
                )}
              </div>
              <div>
                <span className="font-bold text-slate-400 block mb-1">⚽ {summary.awayTeamName} 득점</span>
                {summary.awayScorers.length > 0 ? (
                  summary.awayScorers.map((s, i) => (
                    <div key={i}>• {s.player} ({s.details.join(', ')})</div>
                  ))
                ) : (
                  <span className="text-slate-500">기록 없음</span>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-amber-300 font-bold">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> MVP: {summary.mvpWinner}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">made by SMARTLAB</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>이미지 저장 (PNG)</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>결과 카드 공유</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedText ? '복사 완료!' : '텍스트 요약 복사'}</span>
          </button>
        </div>

        {/* Footer Credit Note */}
        <div className="text-center text-[11px] text-slate-500 pt-1">
          made by SMARTLAB • 상산제 공식 경기 결과 요약 서비스
        </div>
      </div>
    </div>
  );
};
