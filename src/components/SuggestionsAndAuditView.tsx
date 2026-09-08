import React, { useState, useEffect } from 'react';
import { UserProfile, SuggestionItem, AuditLogEntry } from '../types';
import { 
  listenSuggestions, 
  submitSuggestion, 
  answerSuggestion, 
  listenAuditLogs 
} from '../services/firebaseService';
import { 
  MessageSquareText, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CornerDownRight, 
  FileText 
} from 'lucide-react';

interface SuggestionsAndAuditViewProps {
  currentUser: UserProfile;
}

export function SuggestionsAndAuditView({ currentUser }: SuggestionsAndAuditViewProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'audit'>('suggestions');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Suggestion Input
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionContent, setSuggestionContent] = useState('');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState('');

  const canAnswer = currentUser.role === 'admin' || currentUser.role === 'student_council';

  useEffect(() => {
    const unsubSug = listenSuggestions(setSuggestions);
    const unsubAudit = listenAuditLogs(setAuditLogs);

    return () => {
      unsubSug();
      unsubAudit();
    };
  }, []);

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionTitle.trim() || !suggestionContent.trim()) return;

    await submitSuggestion({
      authorId: currentUser.studentId,
      authorName: `${currentUser.studentId} ${currentUser.name}`,
      authorStudentId: currentUser.studentId,
      title: suggestionTitle.trim(),
      content: suggestionContent.trim()
    });

    setSuggestionTitle('');
    setSuggestionContent('');
  };

  const handleAnswer = async (id: string) => {
    if (!answerInput.trim()) return;

    await answerSuggestion(id, answerInput.trim(), `${currentUser.studentId} ${currentUser.name} (${currentUser.role})`);
    setAnsweringId(null);
    setAnswerInput('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'suggestions'
              ? 'bg-red-950 text-white border border-red-800/80 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquareText className="w-4 h-4 text-red-400" />
          <span>학생회 실명 건의함 ({suggestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'audit'
              ? 'bg-red-950 text-white border border-red-800/80 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>심판 스코어 수정 불변 감사 로그 ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          {/* Submit Suggestion Form */}
          <form onSubmit={handleSubmitSuggestion} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-black text-base text-white flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-red-400" />
                <span>체육대회 &amp; 축제 실명 건의 작성</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                작성자: <b>{currentUser.studentId} {currentUser.name}</b>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              건전하고 안전한 대회 운영을 위해 모든 건의사항은 상산고 학번 실명제로 투명하게 접수되며 학생회가 공식 검토 후 답변합니다.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={suggestionTitle}
                onChange={(e) => setSuggestionTitle(e.target.value)}
                placeholder="건의 제목을 입력하세요 (예: 경기장 식수대 추가 비치 요청)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-red-600"
              />
              <textarea
                value={suggestionContent}
                onChange={(e) => setSuggestionContent(e.target.value)}
                rows={3}
                placeholder="상세한 건의 내용 및 장소를 입력해 주세요"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-red-600"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>실명 건의 등록</span>
              </button>
            </div>
          </form>

          {/* Suggestions List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              접수된 건의 및 학생회 답변 현황
            </span>

            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{sug.title}</span>
                    {sug.answer ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        답변 완료
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                        검토 대기중
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(sug.createdAt).toLocaleString('ko-KR', { hour12: false })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-1">
                  {sug.content}
                </p>

                <div className="text-[11px] text-slate-500">
                  작성자: <span className="text-slate-400 font-mono">{sug.authorName}</span>
                </div>

                {/* Answer Box if answered */}
                {sug.answer && (
                  <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{sug.answeredBy || '학생회'} 공식 답변:</span>
                    </div>
                    <p className="pl-5 leading-relaxed text-slate-300">{sug.answer}</p>
                  </div>
                )}

                {/* Answer Action for Council / Admin */}
                {canAnswer && !sug.answer && (
                  <div className="pt-2 border-t border-slate-800/80">
                    {answeringId === sug.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={answerInput}
                          onChange={(e) => setAnswerInput(e.target.value)}
                          placeholder="학생회 공식 답변을 작성하세요"
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-600"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setAnsweringId(null)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleAnswer(sug.id)}
                            className="px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                          >
                            답변 등록
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnsweringId(sug.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>이 건의에 학생회 답변 달기</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immutable Score Audit Logs View */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-amber-900/60 rounded-2xl p-5 space-y-2 shadow-xl">
            <h3 className="font-serif font-black text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>심판 점수 수정 불변 감사 로그 (Immutable Audit Engine)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              점수 조작 방지 및 판정 시비 근절을 위해, 모든 심판진의 점수 증감 및 롤백 내역은 
              수정자 정보, 변경 전후 점수, 구체적 사유와 함께 <b>영구 불변(Immutable)</b> 데이터로 기록 및 투명 공개됩니다.
            </p>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'SCORE_ROLLBACK' 
                        ? 'bg-red-950 text-red-300 border border-red-800' 
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {log.action === 'SCORE_ROLLBACK' ? '오심 취소/롤백' : '정규 점수 갱신'}
                    </span>
                    <span className="font-bold text-white">{log.matchTitle}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString('ko-KR', { hour12: false })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">점수 변경 내역</span>
                    <span className="font-mono font-bold text-amber-400">
                      {log.oldValue} ➔ {log.newValue}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">수정 및 취소 사유</span>
                    <span className="font-semibold text-white">{log.reason}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">기록 심판/수정자</span>
                    <span className="text-slate-300 font-mono">{log.operatorName} ({log.operatorRole})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
