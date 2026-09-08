import React, { useState, useEffect } from 'react';
import { UserProfile, NoticeItem, DirectMessage } from '../types';
import { 
  listenNotices, 
  createNotice, 
  listenMessages, 
  sendDirectMessage 
} from '../services/firebaseService';
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Shield, 
  Plus, 
  UserCheck, 
  AlertCircle, 
  Clock,
  Pin
} from 'lucide-react';

interface NoticesViewProps {
  currentUser: UserProfile;
}

export function NoticesView({ currentUser }: NoticesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'notices' | 'messages'>('notices');
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);

  // Notice Creation Form State
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<'global' | 'class'>('global');
  const [isImportant, setIsImportant] = useState(false);

  // Message Sending Form State
  const [messageRecipientClass, setMessageRecipientClass] = useState('203');
  const [messageRecipientRole, setMessageRecipientRole] = useState('담임 선생님');
  const [messageContent, setMessageContent] = useState('');

  const canPostGlobalNotice = currentUser.role === 'admin' || currentUser.role === 'student_council';
  const canPostClassNotice = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const isLeaderOrTeacher = 
    currentUser.role === 'admin' || 
    currentUser.role === 'teacher' || 
    currentUser.role === 'class_president' || 
    currentUser.role === 'student_council';

  useEffect(() => {
    const unsubNotices = listenNotices(setNotices);
    const userClass = currentUser.classNum ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : '203';
    const unsubMessages = listenMessages(userClass, isLeaderOrTeacher, setMessages);

    return () => {
      unsubNotices();
      unsubMessages();
    };
  }, [currentUser]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    const targetClass = noticeType === 'class' ? `${currentUser.grade}${currentUser.classNum.padStart(2, '0')}` : undefined;

    await createNotice({
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      type: noticeType,
      targetClass,
      authorName: `${currentUser.studentId} ${currentUser.name}`,
      authorRole: currentUser.role,
      authorId: currentUser.studentId,
      important: isImportant
    });

    setNoticeTitle('');
    setNoticeContent('');
    setShowNoticeForm(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    await sendDirectMessage({
      fromId: currentUser.studentId,
      fromName: `${currentUser.studentId} ${currentUser.name}`,
      fromRole: currentUser.role,
      toClass: messageRecipientClass,
      toRole: messageRecipientRole,
      content: messageContent.trim()
    });

    setMessageContent('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('notices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'notices'
              ? 'bg-red-950 text-white border border-red-800/80 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4 text-red-400" />
          <span>공식 공지사항 ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'messages'
              ? 'bg-red-950 text-white border border-red-800/80 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span>간부·교사 전용 쪽지함 ({messages.length})</span>
        </button>
      </div>

      {activeSubTab === 'notices' && (
        <div className="space-y-4">
          {/* Post Notice Trigger Button */}
          {(canPostGlobalNotice || canPostClassNotice) && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowNoticeForm(!showNoticeForm)}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>공지사항 새로 작성</span>
              </button>
            </div>
          )}

          {/* New Notice Modal/Card */}
          {showNoticeForm && (
            <form onSubmit={handleCreateNotice} className="bg-slate-900 border border-red-900/60 rounded-2xl p-5 space-y-4 shadow-xl">
              <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" />
                <span>공지사항 등록</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">공지 구분</label>
                  <select
                    value={noticeType}
                    onChange={(e) => setNoticeType(e.target.value as 'global' | 'class')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    {canPostGlobalNotice && <option value="global">전체 학생 공지 (학생회/관리자)</option>}
                    {canPostClassNotice && <option value="class">우리 반 학급 공지 (담임 교사)</option>}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chkImportant"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-red-600 focus:ring-0"
                  />
                  <label htmlFor="chkImportant" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    상단 긴급 고정 공지 (중요 표시)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">공지 제목</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="공지 제목을 입력하세요"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">공지 본문 내용</label>
                <textarea
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  rows={4}
                  placeholder="대회 운영 수칙, 집결 장소, 생수 배부 등 상세 내용을 작성하세요"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-red-600"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeForm(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  공지 게시하기
                </button>
              </div>
            </form>
          )}

          {/* Notices Feed */}
          <div className="space-y-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition shadow-lg ${
                  n.important
                    ? 'bg-red-950/20 border-red-800/80'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {n.important && (
                      <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold text-[10px] flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" /> 중요
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.type === 'global' ? 'bg-slate-800 text-slate-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    }`}>
                      {n.type === 'global' ? '전체 공지' : `${n.targetClass}반 공지`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(n.createdAt).toLocaleString('ko-KR', { hour12: false })}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm sm:text-base mb-2">
                  {n.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed mb-3">
                  {n.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>작성자: <b className="text-white">{n.authorName}</b> ({n.authorRole})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Messaging (쪽지함) */}
      {activeSubTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="font-serif font-black text-base text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>반장 · 교사 · 학생회 상시 비공개 소통 쪽지함</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                대회 중 발생하는 일정 조율, 선수 교체 보고 및 질의사항을 신속하게 주고받습니다.
              </p>
            </div>

            {/* Send Message Box */}
            <form onSubmit={handleSendMessage} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">수신 학급 선택</label>
                  <select
                    value={messageRecipientClass}
                    onChange={(e) => setMessageRecipientClass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="all">전체 간부 및 운영진</option>
                    <option value="203">2학년 3반</option>
                    <option value="204">2학년 4반</option>
                    <option value="101">1학년 1반</option>
                    <option value="102">1학년 2반</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">수신자 직책</label>
                  <select
                    value={messageRecipientRole}
                    onChange={(e) => setMessageRecipientRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="담임 선생님">담임 선생님</option>
                    <option value="반장">반장</option>
                    <option value="학생회 경기부">학생회 경기부</option>
                    <option value="총괄 관리자">총괄 관리자</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">쪽지 내용</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="내용을 입력하세요 (예: 3반 선수 축구화 교체로 3분 지연 요청)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>전송</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Messages Feed */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                수신 및 발신 쪽지 내역 ({messages.length})
              </span>

              {messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{m.fromName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                            {m.fromRole}
                          </span>
                          <span className="text-slate-600">➔</span>
                          <span className="text-blue-400 font-medium">
                            {m.toClass === 'all' ? '전체' : `${m.toClass}반`} {m.toRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour12: false })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pl-1">{m.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  도착한 쪽지가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
