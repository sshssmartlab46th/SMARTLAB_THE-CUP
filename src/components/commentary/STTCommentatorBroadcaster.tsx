import React, { useState, useEffect, useCallback } from 'react';
import { MatchItem, UserProfile, LiveCommentaryItem } from '../../types';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { addLiveCommentary, listenLiveCommentaries, deleteLiveCommentary } from '../../services/firebaseService';
import {
  Mic,
  MicOff,
  Radio,
  Send,
  Trash2,
  Clock,
  Sparkles,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Settings2,
  RefreshCw
} from 'lucide-react';

interface STTCommentatorBroadcasterProps {
  currentUser: UserProfile;
  match: MatchItem;
  onNotice?: (message: string, type?: 'success' | 'error') => void;
}

export const STTCommentatorBroadcaster: React.FC<STTCommentatorBroadcasterProps> = ({
  currentUser,
  match,
  onNotice
}) => {
  const [commentatorName, setCommentatorName] = useState(`${currentUser.name} 해설위원`);
  const [manualInputText, setManualInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentCommentaries, setRecentCommentaries] = useState<LiveCommentaryItem[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    onNotice?.(text, type);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Dispatch live commentary payload to Firestore
  const handleDispatchCommentary = useCallback(async (textToSend: string, isStt: boolean = true) => {
    if (!textToSend || !textToSend.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addLiveCommentary(
        match.id,
        commentatorName,
        textToSend.trim(),
        isStt,
        currentUser
      );
      showToast(`🎙️ 해설 메시지가 방송 전송되었습니다! ("${textToSend.trim().substring(0, 20)}...")`);
      setManualInputText('');
    } catch (err) {
      console.error('Failed to send commentary:', err);
      showToast('해설 전송에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [match.id, commentatorName, currentUser, isSubmitting]);

  // STT hook with 10s auto-dispatch
  const {
    isSupported,
    isListening,
    fullTranscript,
    error: sttError,
    autoDispatchEnabled,
    secondsUntilNextDispatch,
    setAutoDispatchEnabled,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  } = useSpeechToText({
    autoDispatchIntervalMs: 10000,
    onAutoDispatch: (text) => {
      handleDispatchCommentary(text, true);
    }
  });

  // Listen to recent commentaries for this match
  useEffect(() => {
    const unsubscribe = listenLiveCommentaries(match.id, (list) => {
      setRecentCommentaries(list);
    });
    return () => unsubscribe();
  }, [match.id]);

  const handleDeleteCommentaryItem = async (id: string) => {
    if (!window.confirm('이 해설 항목을 삭제하시겠습니까?')) return;
    try {
      await deleteLiveCommentary(id);
      showToast('해설 항목이 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      showToast('삭제 실패했습니다.', 'error');
    }
  };

  const handleManualSend = () => {
    const textToSend = manualInputText.trim() || fullTranscript.trim();
    if (!textToSend) {
      showToast('전송할 해설 내용을 입력하거나 음성을 말씀하세요.', 'error');
      return;
    }
    handleDispatchCommentary(textToSend, Boolean(!manualInputText.trim()));
    resetTranscript();
  };

  return (
    <div className="rounded-2xl border-2 border-purple-500/80 bg-white dark:bg-slate-900 p-5 shadow-md space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>STT 라이브 음성 해설 방송실</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                LIVE STT
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              해설위원의 음성을 텍스트로 자동 변환하여 10초 주기로 전교생에게 실시간 스트리밍합니다.
            </p>
          </div>
        </div>

        {/* Commentator Name Customizer */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-1">방송자:</span>
          <input
            type="text"
            value={commentatorName}
            onChange={(e) => setCommentatorName(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 w-32 focus:outline-hidden"
            placeholder="해설위원 명칭"
          />
        </div>
      </div>

      {/* Toast Notification */}
      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* STT Speech Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-purple-50/60 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-900/60">
        {/* Big Mic Toggle Button */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-2">
          {isListening ? (
            <button
              type="button"
              onClick={stopListening}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition transform active:scale-95 cursor-pointer animate-pulse"
              title="마이크 끄기 (음성 중지)"
            >
              <MicOff className="w-8 h-8" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startListening}
              className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition transform active:scale-95 cursor-pointer"
              title="마이크 켜기 (STT 녹음 시작)"
            >
              <Mic className="w-8 h-8" />
            </button>
          )}

          <div className="space-y-0.5">
            <span className={`text-xs font-black ${isListening ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {isListening ? '🎙️ 실시간 음성 수신 중...' : '마이크 버튼을 눌러 해설 시작'}
            </span>
            {!isSupported && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                (현재 기기/브라우저는 Web Speech를 지원하지 않습니다. 텍스트 직접 입력 모드를 사용하세요.)
              </p>
            )}
          </div>
        </div>

        {/* Live Transcript Preview Box */}
        <div className="md:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-purple-600" />
              실시간 감지된 음성 (STT 트랜스크립트)
            </span>

            {/* Auto Dispatch Toggle Switch */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                10초 자동 전송:
              </span>
              <input
                type="checkbox"
                checked={autoDispatchEnabled}
                onChange={(e) => setAutoDispatchEnabled(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              {isListening && autoDispatchEnabled && (
                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">
                  {secondsUntilNextDispatch}초 남음
                </span>
              )}
            </label>
          </div>

          <div className="min-h-[72px] p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium space-y-1 relative">
            {fullTranscript ? (
              <p className="leading-relaxed font-sans">{fullTranscript}</p>
            ) : (
              <p className="text-slate-400 italic">
                {isListening
                  ? '마이크에 대고 경기 해설을 말씀해보세요... 텍스트가 실시간 변환됩니다.'
                  : '마이크를 켜면 말하는 내용이 텍스트로 표출됩니다.'}
              </p>
            )}

            {/* Sound Wave Animation Visualizer */}
            {isListening && (
              <div className="flex items-center gap-1 absolute right-3 bottom-3">
                <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
              </div>
            )}
          </div>

          {sttError && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{sttError}</span>
            </p>
          )}
        </div>
      </div>

      {/* Manual Input or Text Correction Line */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <input
          type="text"
          value={manualInputText}
          onChange={(e) => setManualInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleManualSend();
            }
          }}
          placeholder="텍스트로 직접 해설을 입력하거나 위 STT 내용을 보완하여 입력하세요 (Enter시 전송)"
          className="flex-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {fullTranscript && (
            <button
              type="button"
              onClick={resetTranscript}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer shrink-0"
              title="음성 버퍼 비우기"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleManualSend}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>즉시 전송하기</span>
          </button>
        </div>
      </div>

      {/* Sent Commentary List */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            전송된 라이브 해설 내역 ({recentCommentaries.length}건)
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            made by SMARTLAB
          </span>
        </h4>

        {recentCommentaries.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            아직 전송된 경기 해설 메시지가 없습니다.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {recentCommentaries.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-xs flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-700 dark:text-purple-300 text-[11px]">
                      {item.commentatorName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {item.timestamp}
                    </span>
                    {item.isSttGenerated && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 text-[9px] font-black">
                        STT
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-snug">
                    {item.text}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCommentaryItem(item.id)}
                  className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
