import React, { useState } from 'react';
import { Notice, SangsanUser, Suggestion } from '../types';
import { INITIAL_NOTICES } from '../data/mockFestivalData';
import { Megaphone, AlertCircle, Plus, Send, MessageSquare, CheckCircle } from 'lucide-react';

interface NoticeBoardProps {
  currentUser: SangsanUser | null;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ currentUser }) => {
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: 'sug-1',
      authorStudentId: '20412',
      authorName: '박준혁',
      content: '대운동장 관람석 쪽에 햇빛 가림막 차광막 추가 설치가 가능할까요?',
      status: 'answered',
      answer: '학생회 체육부에서 12시 점심시간 이후 대형 천막 2동을 추가 설치 완료했습니다.',
      createdAt: '10:20',
    },
  ]);

  // Notice creation state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [showNoticeForm, setShowNoticeForm] = useState(false);

  // Suggestion box input
  const [suggText, setSuggText] = useState('');
  const [activeTab, setActiveTab] = useState<'notices' | 'suggestions'>('notices');

  const canPostNotice =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'student_council' ||
    currentUser?.role === 'teacher' ||
    currentUser?.role === 'health_officer';

  const canAnswerSuggestion =
    currentUser?.role === 'admin' || currentUser?.role === 'student_council';

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNotice: Notice = {
      id: `not-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      authorName: currentUser?.name || '운영진',
      authorRole: currentUser?.role || 'student_council',
      priority: isUrgent ? 'urgent' : 'normal',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setNotices([newNotice, ...notices]);
    setTitle('');
    setContent('');
    setIsUrgent(false);
    setShowNoticeForm(false);
  };

  const handleCreateSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggText.trim()) return;

    const newSugg: Suggestion = {
      id: `sug-${Date.now()}`,
      authorStudentId: currentUser?.studentId || '20000',
      authorName: currentUser?.name || '익명학생',
      content: suggText.trim(),
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSuggestions([newSugg, ...suggestions]);
    setSuggText('');
  };

  return (
    <div className="space-y-6">
      {/* Switcher & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'notices'
                ? 'bg-red-900 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            공식 공지사항
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'suggestions'
                ? 'bg-red-900 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            실명 건의함 (Suggestion Box)
          </button>
        </div>

        {activeTab === 'notices' && canPostNotice && (
          <button
            onClick={() => setShowNoticeForm(!showNoticeForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            {showNoticeForm ? '작성 취소' : '공지사항 작성하기'}
          </button>
        )}
      </div>

      {/* Notice creation modal/box */}
      {showNoticeForm && (
        <form
          onSubmit={handleCreateNotice}
          className="bg-slate-900 border border-red-900/60 p-5 rounded-xl space-y-3 text-xs shadow-xl"
        >
          <h4 className="font-bold text-white text-sm flex items-center gap-2 font-serif">
            <Megaphone className="w-4 h-4 text-red-400" />
            새 공지사항 등록
          </h4>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">공지 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: [학생회] 오후 우천 대비 장소 변경 안내"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">공지 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="전교생 또는 학급에 전달할 공지 상세 내용을 입력하세요."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-red-500"
              />
              긴급 공지 (상단 배너 강조)
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg transition"
            >
              공지 발행하기
            </button>
          </div>
        </form>
      )}

      {/* Main Tab View */}
      {activeTab === 'notices' ? (
        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-xl border transition shadow-sm ${
                n.priority === 'urgent'
                  ? 'bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border-red-800/80 ring-1 ring-red-700/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {n.priority === 'urgent' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-700 text-white flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3 h-3" /> 긴급
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-white font-serif">{n.title}</h3>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="font-medium text-slate-300">{n.authorName}</span> · {n.createdAt}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {n.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* Real-name Suggestion Box */
        <div className="space-y-6">
          {/* Submitter */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 font-serif">
              <MessageSquare className="w-4 h-4 text-red-400" />
              실명 건의 사항 접수 (학생회 검토 후 피드백 반영)
            </h4>
            <p className="text-slate-400">
              상산고등학교 학생회는 체육대회 중 발생하는 학생 여러분의 불편 사항과 건의를 실시간으로
              접수하여 즉시 조치하고 있습니다.
            </p>

            <form onSubmit={handleCreateSuggestion} className="space-y-2">
              <textarea
                value={suggText}
                onChange={(e) => setSuggText(e.target.value)}
                placeholder="건의할 사항을 구체적으로 기재해 주십시오."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                required
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-mono">
                  작성자:{' '}
                  <strong className="text-slate-200">
                    {currentUser ? `${currentUser.studentId} ${currentUser.name}` : '로그인 필요'}
                  </strong>
                </span>
                <button
                  type="submit"
                  disabled={!currentUser}
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition"
                >
                  건의 제출하기
                </button>
              </div>
            </form>
          </div>

          {/* Suggestions List */}
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">
                      {s.authorStudentId} {s.authorName}
                    </span>
                    <span className="text-slate-500">· {s.createdAt}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'answered'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.status === 'answered' ? '조치 완료' : '검토 중'}
                  </span>
                </div>

                <p className="text-slate-200">{s.content}</p>

                {s.answer && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/40 text-emerald-300 text-[11px] flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-400">학생회 조치 답변:</strong> {s.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
