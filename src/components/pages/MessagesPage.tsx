import React, { useState, useEffect } from 'react';
import { DirectMessage, UserProfile } from '../../types';
import { 
  Send, 
  Inbox, 
  SendHorizontal, 
  Mail, 
  Trash2, 
  Reply, 
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert
} from 'lucide-react';
import { 
  sendDirectMessage, 
  listenAllDirectMessages, 
  deleteDirectMessage 
} from '../../services/firebaseService';

interface MessagesPageProps {
  currentUser: UserProfile | null;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Compose fields
  const [targetType, setTargetType] = useState<string>('class'); // 'class', 'teachers', 'council', 'all'
  const [targetGrade, setTargetGrade] = useState<string>('1');
  const [targetClass, setTargetClass] = useState<string>('1');
  const [targetRole, setTargetRole] = useState<string>('class_president');
  const [messageContent, setMessageContent] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    const unsub = listenAllDirectMessages((list) => {
      setMessages(list);
    });
    return () => unsub();
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Filter messages for current user
  // User's class code: e.g. "101", "203" or "teacher" or "admin"
  const userClassCode = currentUser?.isTeacher 
    ? 'teacher' 
    : `${currentUser?.grade || '1'}${String(currentUser?.classNum || '1').padStart(2, '0')}`;

  const inboxMessages = messages.filter((m) => {
    if (!currentUser) return false;
    // Admins see all
    if (currentUser.role === 'admin') return true;
    // Sent to user's class
    if (m.toClass === userClassCode || m.toClass === 'all') return true;
    // Sent to role
    if (m.toRole === currentUser.role || m.toRole === 'all') return true;
    // If teacher and sent to teachers
    if (currentUser.isTeacher && (m.toRole === 'teacher' || m.toClass === 'teacher')) return true;
    return false;
  });

  const sentMessages = messages.filter((m) => {
    return m.fromId === currentUser?.studentId;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!messageContent.trim()) {
      alert('쪽지 내용을 입력하세요.');
      return;
    }

    setIsSending(true);
    try {
      let finalToClass = 'all';
      let finalToRole = 'student';

      if (targetType === 'class') {
        finalToClass = `${targetGrade}${targetClass.padStart(2, '0')}`;
        finalToRole = targetRole;
      } else if (targetType === 'teachers') {
        finalToClass = 'teacher';
        finalToRole = 'teacher';
      } else if (targetType === 'council') {
        finalToClass = 'all';
        finalToRole = 'student_council';
      } else if (targetType === 'all') {
        finalToClass = 'all';
        finalToRole = 'all';
      }

      await sendDirectMessage({
        fromId: currentUser.studentId,
        fromName: `${currentUser.name} (${currentUser.isTeacher ? '선생님' : `${currentUser.grade}-${currentUser.classNum}`})`,
        fromRole: currentUser.role,
        toClass: finalToClass,
        toRole: finalToRole,
        content: messageContent.trim()
      });

      setMessageContent('');
      showNotice('쪽지가 성공적으로 발송되었습니다.');
      setActiveTab('sent');
    } catch (err) {
      console.error(err);
      alert('쪽지 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 쪽지를 삭제하시겠습니까?')) {
      try {
        await deleteDirectMessage(id);
        showNotice('쪽지가 삭제되었습니다.');
      } catch (err) {
        console.error(err);
        alert('삭제 실패');
      }
    }
  };

  const handleReplyTo = (msg: DirectMessage) => {
    setActiveTab('compose');
    setTargetType('class');
    setMessageContent(`[답장] ${msg.fromName} 학우/선생님께:\n> ${msg.content.slice(0, 30)}...\n\n`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-navy-800 text-white bg-slate-800 dark:bg-slate-700">
              COMMUNICATION
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              반장·교사·학생회 상호 연락망
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Mail className="w-6 h-6 text-red-600" />
            상산고 실시간 쪽지함 (Messages)
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>받은 쪽지 ({inboxMessages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <SendHorizontal className="w-4 h-4" />
            <span>보낸 쪽지 ({sentMessages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'compose'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>새 쪽지 쓰기</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tab 1: Inbox */}
      {activeTab === 'inbox' && (
        <div className="space-y-3">
          {inboxMessages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-slate-400">
              <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              도착한 새 쪽지가 없습니다.
            </div>
          ) : (
            inboxMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                      {msg.fromName ? msg.fromName.charAt(0) : 'S'}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{msg.fromName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {msg.fromRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString('ko-KR') : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleReplyTo(msg)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>답장</span>
                    </button>
                    {(currentUser?.role === 'admin' || currentUser?.studentId === msg.fromId) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer"
                        title="쪽지 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Sent */}
      {activeTab === 'sent' && (
        <div className="space-y-3">
          {sentMessages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-slate-400">
              <SendHorizontal className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              보낸 쪽지 내역이 없습니다.
            </div>
          ) : (
            sentMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      수신: {msg.toClass === 'all' ? '전체 대상' : msg.toClass === 'teacher' ? '교사 전체' : `${msg.toClass} (${msg.toRole})`}
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString('ko-KR') : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(msg.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title="쪽지 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Compose */}
      {activeTab === 'compose' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-red-600" />
            새 쪽지 발송
          </h3>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Target Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                수신 대상 선택
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'class', label: '특정 학급 (반장/담임)' },
                  { key: 'teachers', label: '교사 / 교무실 전체' },
                  { key: 'council', label: '학생회 / 체육부' },
                  { key: 'all', label: '전체 공지 (공통)' }
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTargetType(t.key)}
                    className={`p-2.5 rounded-xl font-bold transition cursor-pointer text-center ${
                      targetType === t.key
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Class Details if 'class' */}
            {targetType === 'class' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    수신 학년
                  </label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    수신 학급 (1~12반)
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(c => (
                      <option key={c} value={c}>{c}반</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    수신자 직책
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    <option value="class_president">학급 반장</option>
                    <option value="teacher">담임 선생님</option>
                    <option value="student">학급 전체 학우</option>
                  </select>
                </div>
              </div>
            )}

            {/* Message Content */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                쪽지 내용
              </label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="전달할 긴급 일정, 엔트리 제출 확인, 조율 사항 등을 자유롭게 작성하세요."
                rows={5}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:border-red-500"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? '발송 중...' : '쪽지 발송'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
